import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ANM Official Base URLs
const ANM_SERVICES: Record<string, string> = {
  General_Base: 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/General_Base/MapServer',
  Cuadricula: 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/Cuadricula/MapServer',
  TenureLayers: 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/TenureLayers/MapServer',
  Exclusive_Restriction: 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/Exclusive_Restriction/MapServer',
};

// Health Check API
app.get('/api/health', async (req, res) => {
  const status: Record<string, any> = {
    status: 'online',
    timestamp: new Date().toISOString(),
    engine: 'Minería Legal GIS Colombia v7.5',
    services: {},
  };

  for (const [key, url] of Object.entries(ANM_SERVICES)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(`${url}?f=json`, { signal: controller.signal });
      clearTimeout(timeoutId);
      status.services[key] = resp.ok ? 'online' : `error_${resp.status}`;
    } catch (e: any) {
      status.services[key] = 'reachable_via_fallback';
    }
  }

  res.json(status);
});

// Official Distritos Mineros Especiales (Decreto 044 de 2024)
app.get('/api/distritos-mineros', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const filePath = path.resolve(__dirname, 'src/services/distritosMinerosSimplified.json');
  res.sendFile(filePath);
});

// Proxy endpoint for ANM or External GIS services (prevents browser CORS blocks)
app.get('/api/anm/proxy', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MineriaLegalGIS/7.0',
      'Accept': 'application/json, text/plain, */*',
    };

    const response = await fetch(targetUrl, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (contentType.startsWith('image/')) {
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } else {
      const text = await response.text();
      res.send(text);
    }
  } catch (err: any) {
    res.status(502).json({
      error: 'Proxy request failed or timed out',
      details: err.message,
      targetUrl,
    });
  }
});

// Service discovery endpoint
app.get('/api/anm/services', async (req, res) => {
  res.json({
    services: [
      {
        id: 'General_Base',
        name: 'Cartografía Base y Ordenamiento Territorial (SIGM)',
        url: ANM_SERVICES.General_Base,
        description: 'Límites político-administrativos (Departamentos, Municipios, Veredas), drenajes y topografía.',
      },
      {
        id: 'Cuadricula',
        name: 'Cuadrícula Minera Nacional ANM',
        url: ANM_SERVICES.Cuadricula,
        description: 'Celdas y mallas del sistema de cuadrícula adoptado para radicación de propuestas.',
      },
      {
        id: 'TenureLayers',
        name: 'Capas de Tenencia Minera (Títulos y Solicitudes)',
        url: ANM_SERVICES.TenureLayers,
        description: 'Títulos mineros otorgados, solicitudes en trámite, autorizaciones y contratos de concesión.',
      },
      {
        id: 'Exclusive_Restriction',
        name: 'Zonas de Exclusión y Restricción Minero-Ambiental',
        url: ANM_SERVICES.Exclusive_Restriction,
        description: 'Páramos, Parques Nacionales Naturales, Reservas Forestales Ley 2da, Humedales y Resguardos.',
      },
    ],
  });
});

// Query TenureLayers for exact Placa/Expediente across official layers
async function queryTenureByPlaca(rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  const cleanCode = code.replace(/[^A-Z0-9-]/g, '');

  const tenureUrl = 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/TenureLayers/MapServer';
  const layersToCheck = [4, 3, 5, 2]; // 4: Título Vigente, 3: Solicitud Vigente, 5: Solicitud Original, 2: Subcontrato

  for (const layerId of layersToCheck) {
    try {
      const whereConditions = [
        `CODIGO_EXPEDIENTE = '${cleanCode}'`,
        `TENURE_ID = '${cleanCode}'`,
      ];

      for (const where of whereConditions) {
        const params = new URLSearchParams({
          where,
          outFields: '*',
          returnGeometry: 'true',
          outSR: '4326',
          f: 'json',
        });

        const resp = await fetch(`${tenureUrl}/${layerId}/query`, {
          method: 'POST',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (!resp.ok) continue;

        const data = await resp.json();
        if (data && data.features && data.features.length > 0) {
          const feat = data.features[0];
          const attr = feat.attributes;
          const geom = feat.geometry;

          // Convert Esri rings to GeoJSON
          let geojsonGeom: any = null;
          if (geom && geom.rings) {
            geojsonGeom = {
              type: geom.rings.length === 1 ? 'Polygon' : 'MultiPolygon',
              coordinates: geom.rings.length === 1 ? geom.rings : [geom.rings],
            };
          }

          return {
            found: true,
            layerId,
            layerName: layerId === 4 ? 'Título Vigente' : layerId === 3 ? 'Solicitud Vigente' : 'Solicitud Original',
            attributes: attr,
            geometry: geojsonGeom,
          };
        }
      }
    } catch (e: any) {
      console.warn(`[ANM] Layer ${layerId} query error:`, e.message);
    }
  }

  return { found: false };
}

// Endpoint to fetch real ANM tenure data
app.post('/api/anm/search-tenure', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Falta el código de expediente o placa' });
  }

  try {
    const result = await queryTenureByPlaca(code);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al consultar AnnA Minería', details: err.message });
  }
});

// Spatial intersection with Exclusive_Restriction and surrounding TenureLayers
app.post('/api/anm/query-restrictions', async (req, res) => {
  const { bbox, bufferDegrees = 0.04, extraLayers = [] } = req.body; // { minX, minY, maxX, maxY }
  if (!bbox) {
    return res.status(400).json({ error: 'Falta la extensión geográfica (bbox)' });
  }

  // Exact envelope for direct overlaps
  const exactEnvelope = `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`;

  // Expanded envelope to discover surrounding titles, applications, and buffer zones (~4-5 km)
  const expandedEnvelope = `${bbox.minX - bufferDegrees},${bbox.minY - bufferDegrees},${bbox.maxX + bufferDegrees},${bbox.maxY + bufferDegrees}`;

  const exclUrl = 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/Exclusive_Restriction/MapServer';
  const tenureUrl = 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/TenureLayers/MapServer';

  const results: Record<string, any[]> = {
    restringidas: [],
    excluibles: [],
    titulosCircundantes: [],
    solicitudesCircundantes: [],
  };

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // CP 2026-11-02: Configuración para servicios RUNAP, MinInterior y UPME
  const RUNAP_WMS_BASE = 'https://runap.parquesnacionales.gov.co/services/wms';
  const MININTERIOR_REST_BASE = 'https://geoportal.mininterior.gov.co/server/rest/services';
  const UPME_REST_BASE = 'https://upme.gov.co/geospatial/rest/services';

  try {
    // 1. Áreas Restringidas (Layer 1) - Exclusive_Restriction
    const p1 = new URLSearchParams({
      geometry: exactEnvelope,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      outFields: '*',
      returnGeometry: 'true',
      f: 'json',
    });

    const res1 = await fetch(`${exclUrl}/1/query`, { method: 'POST', headers, body: p1.toString() });
    if (res1.ok) {
      const data1 = await res1.json();
      results.restringidas = data1.features || [];
    }

    // 2. Áreas Excluibles (Layer 2) - Exclusive_Restriction
    const p2 = new URLSearchParams({
      geometry: exactEnvelope,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      outFields: '*',
      returnGeometry: 'true',
      f: 'json',
    });

    const res2 = await fetch(`${exclUrl}/2/query`, { method: 'POST', headers, body: p2.toString() });
    if (res2.ok) {
      const data2 = await res2.json();
      results.excluibles = data2.features || [];
    }

    // 3. Títulos Vigentes Circundantes y Superpuestos (Layer 4) - TenureLayers
    const p3 = new URLSearchParams({
      geometry: expandedEnvelope,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      outFields: 'CODIGO_EXPEDIENTE,TENURE_ID,MODALIDAD,TITULO_ESTADO,AREA_HA,CLASIFICACION_MINERIA,ETAPA,SOLICITANTES_O_TITULARES,MINERALES,MUNICIPIOS,DEPARTAMENTOS',
      returnGeometry: 'true',
      f: 'json',
    });

    const res3 = await fetch(`${tenureUrl}/4/query`, { method: 'POST', headers, body: p3.toString() });
    if (res3.ok) {
      const data3 = await res3.json();
      results.titulosCircundantes = data3.features || [];
    }

    // 4. Solicitudes Vigentes Circundantes y Superpuestas (Layer 3) - TenureLayers
    const p4 = new URLSearchParams({
      geometry: expandedEnvelope,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      outFields: 'CODIGO_EXPEDIENTE,TENURE_ID,MODALIDAD,TITULO_ESTADO,AREA_HA,CLASIFICACION_MINERIA,ETAPA,SOLICITANTES_O_TITULARES,MINERALES,MUNICIPIOS,DEPARTAMENTOS',
      returnGeometry: 'true',
      f: 'json',
    });

    const res4 = await fetch(`${tenureUrl}/3/query`, { method: 'POST', headers, body: p4.toString() });
    if (res4.ok) {
      const data4 = await res4.json();
      results.solicitudesCircundantes = data4.features || [];
    }

    // 5. General_Base: Municipios (Layer 122) y Departamentos (Layer 121)
    const gbUrl = 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/General_Base/MapServer';

    const pMpios = new URLSearchParams({
      geometry: exactEnvelope,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      outFields: '*',
      returnGeometry: 'true',
      f: 'json',
    });

    const resMpios = await fetch(`${gbUrl}/122/query`, { method: 'POST', headers, body: pMpios.toString() });
    if (resMpios.ok) {
      const dataMpios = await resMpios.json();
      results.municipios = dataMpios.features || [];
    }

    // 6. General_Base: Resguardos Indígenas (Layer 26)
    const pInd = new URLSearchParams({
      geometry: exactEnvelope,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      outFields: '*',
      returnGeometry: 'true',
      f: 'json',
    });
    const resInd = await fetch(`${gbUrl}/26/query`, { method: 'POST', headers, body: pInd.toString() });
    if (resInd.ok) {
      const dataInd = await resInd.json();
      results.indigenas = dataInd.features || [];
    }

    // 7. General_Base: Rondas Hídricas (Layer 60)
    const pHidro = new URLSearchParams({
      geometry: exactEnvelope,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      outFields: '*',
      returnGeometry: 'true',
      f: 'json',
    });
    const resHidro = await fetch(`${gbUrl}/60/query`, { method: 'POST', headers, body: pHidro.toString() });
    if (resHidro.ok) {
      const dataHidro = await resHidro.json();
      results.rondasHidricas = dataHidro.features || [];
    }

    // 8. General_Base: Áreas Arqueológicas Protegidas (Layer 80)
    const pArq = new URLSearchParams({
      geometry: exactEnvelope,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      outFields: '*',
      returnGeometry: 'true',
      f: 'json',
    });
    const resArq = await fetch(`${gbUrl}/80/query`, { method: 'POST', headers, body: pArq.toString() });
    if (resArq.ok) {
      const dataArq = await resArq.json();
      results.arqueologicas = dataArq.features || [];
    }

    // 10. General_Base: capas restrictivas adicionales (RESTRICTIVE_LAYER_REGISTRY)
    const extraIds: number[] = Array.isArray(extraLayers)
      ? [...new Set<number>(extraLayers.map(Number).filter((n: number) => Number.isInteger(n) && n >= 0 && n <= 200))].slice(0, 30)
      : [];
    if (extraIds.length > 0) {
      const adicionales: Record<string, any[]> = {};
      const adicionalesFallidas: number[] = [];
      await Promise.all(
        extraIds.map(async (lid) => {
          try {
          const pExtra = new URLSearchParams({
            geometry: exactEnvelope,
            geometryType: 'esriGeometryEnvelope',
            spatialRel: 'esriSpatialRelIntersects',
            inSR: '4326',
            outSR: '4326',
            outFields: '*',
            returnGeometry: 'true',
            f: 'json',
          });
          const resExtra = await fetch(`${gbUrl}/${lid}/query`, { method: 'POST', headers, body: pExtra.toString() });
          const dataExtra = resExtra.ok ? await resExtra.json() : null;
          if (!dataExtra || dataExtra.error || !Array.isArray(dataExtra.features)) {
            adicionalesFallidas.push(lid);
            return;
          }
          adicionales[String(lid)] = dataExtra.features;
          } catch {
            adicionalesFallidas.push(lid);
          }
        })
      );
      (results as any).adicionales = adicionales;
      (results as any).adicionalesFallidas = adicionalesFallidas;
    }

    // CP 2026-11-02: Consulta RUNAP (Áreas Protegidas SINAP / Parques Nacionales)
    try {
      const runapParams = new URLSearchParams({
        service: 'WMS',
        request: 'GetFeatureInfo',
        version: '1.3.0',
        layers: 'runap:areas_protegidas',
        query_layers: 'runap:areas_protegidas',
        crs: 'EPSG:4326',
        bbox: exactEnvelope,
        width: '256',
        height: '256',
        format: 'application/json',
        info_format: 'application/json',
        i: '128',
        j: '128',
      });
      const runapResp = await fetch(`${RUNAP_WMS_BASE}?${runapParams.toString()}`, { method: 'GET', headers });
      if (runapResp.ok) {
        const runapData = await runapResp.json();
        results.areasProtegidasRUNAP = runapData.features || [];
      }
    } catch (eRunap) {
      console.warn('RUNAP query error:', eRunap);
    }

    // CP 2026-11-02: Consulta MinInterior (Resguardos Indígenas y Comunidades Negras)
    try {
      const minIntParams = new URLSearchParams({
        where: `1=1`,
        outFields: '*',
        geometry: exactEnvelope,
        geometryType: 'esriGeometryEnvelope',
        inSR: '4326',
        outSR: '4326',
        f: 'json',
      });
      const minIntResp = await fetch(`${MININTERIOR_REST_BASE}/Territorios_Etnicos/MapServer/0/query`, {
        method: 'POST',
        headers,
        body: minIntParams.toString(),
      });
      if (minIntResp.ok) {
        const minIntData = await minIntResp.json();
        results.territoriosEtnicosMinInterior = minIntData.features || [];
      }
    } catch (eMinInt) {
      console.warn('MinInterior query error:', eMinInt);
    }

    // CP 2026-11-02: Consulta UPME (Infraestructura Eléctrica / Servidumbres)
    try {
      const upmeParams = new URLSearchParams({
        where: `1=1`,
        outFields: '*',
        geometry: exactEnvelope,
        geometryType: 'esriGeometryEnvelope',
        inSR: '4326',
        outSR: '4326',
        f: 'json',
      });
      const upmeResp = await fetch(`${UPME_REST_BASE}/Lineas_Transmision/MapServer/0/query`, {
        method: 'POST',
        headers,
        body: upmeParams.toString(),
      });
      if (upmeResp.ok) {
        const upmeData = await upmeResp.json();
        results.infraestructuraUPME = upmeData.features || [];
      }
    } catch (eUpme) {
      console.warn('UPME query error:', eUpme);
    }

    // 9. Distritos Mineros Especiales (Shapefile Oficial MinMinas / Decreto 044 de 2024)
    try {
      const fs = await import('fs');
      const distritosPath = path.resolve(__dirname, 'src/services/distritosMineros.json');
      if (fs.existsSync(distritosPath)) {
        const distritosData = JSON.parse(fs.readFileSync(distritosPath, 'utf-8'));
        const matchingDistritos = distritosData.features.filter((f: any) => {
          const fbox = f.geometry?.bbox;
          if (fbox && fbox.length === 4) {
            return !(fbox[0] > bbox.maxX || fbox[2] < bbox.minX || fbox[1] > bbox.maxY || fbox[3] < bbox.minY);
          }
          return false;
        });
        results.distritosMineros = matchingDistritos;
      }
    } catch (errDist) {
      console.warn('Error reading distritosMineros.json:', errDist);
    }

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: 'Error en consulta espacial ampliada', details: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Minería Legal GIS] Servidor activo en puerto ${PORT}`);
  });
}

startServer();
