import L from 'leaflet';
import { EvaluationResult } from '../types/mining';
import {
  CATALOG_LAYERS,
  EVALUATION_LAYERS_META,
  CatalogLayerItem,
  ArcGisMapServerLayer,
} from './mapLayersCatalog';
import { buildLegalFrameworkPopupHtml, escapeHtml } from './legalFramework';

export interface LayerStateSubscriber {
  (activeLayerIds: Set<string>): void;
}

/**
 * Decoupled Leaflet Map Controller & Layer Manager
 * Features:
 * - One-time map and catalog layers initialization
 * - Direct popups bound to each layer with practical legal instructions on "¿Cómo aplicar?"
 * - All 119 Distritos Mineros loaded and visible by default with interactive popups
 * - Resguardos Indígenas enabled by default
 * - Direct layer visibility manipulation without component re-renders
 */
export class MapController {
  private map: L.Map | null = null;
  private container: HTMLElement;
  private layerInstances = new Map<string, L.Layer>();
  private activeLayerIds = new Set<string>();
  private subscribers = new Set<LayerStateSubscriber>();
  private baseTileLayer: L.TileLayer | null = null;
  private currentBaseMap: 'satellite' | 'dark' | 'topo' = 'satellite';

  // Evaluation LayerGroups
  private evalBasePolyGroup = L.layerGroup();
  private evalExclusionesGroup = L.layerGroup();
  private evalRestriccionesGroup = L.layerGroup();
  private evalDistritosGroup = L.layerGroup();
  private evalIndigenasGroup = L.layerGroup();
  private evalRondasGroup = L.layerGroup();
  private evalTitulosGroup = L.layerGroup();
  private evalSolicitudesGroup = L.layerGroup();
  private evalAreaHabilGroup = L.layerGroup();
  private evalZonasSustraidasGroup = L.layerGroup();

  // Full Distritos Mineros Official GeoJSON LayerGroup (Decreto 044 de 2024)
  private distritosOficialesGroup = L.layerGroup();
  private distritosGeoJsonData: any = null;

  private currentEvaluation: EvaluationResult | null = null;

  // Leaflet's maxHeight is only applied at layout time, so a <details> expanded later can push
  // the popup past the map edge: cap the height with CSS and re-pan on toggle.
  private bindScrollablePopup(layer: L.Layer, html: string) {
    // CP 2026-11-02: Popup adaptativo con scroll interno y estética de tarjeta profesional.
    // Evita que el popup se salga del mapa ni tape controles al redimensionar y desplazar la vista.
    const popupHtml = `
      <div style="
        font-family: 'Segoe UI', Roboto, system-ui, sans-serif;
        font-size: 12px;
        color: #0f172a;
        max-width: 320px;
        max-height: 340px;
        overflow-y: auto;
        padding-right: 4px;
        line-height: 1.4;
      ">
        ${html}
      </div>
    `;
    layer.bindPopup(popupHtml, {
      autoPanPadding: L.point(20, 20),
      className: 'leaflet-popup-custom',
    });
    layer.on('popupopen', (e: any) => {
      e.popup
        .getElement()
        ?.querySelectorAll('details')
        .forEach((d: HTMLElement) => d.addEventListener('toggle', () => e.popup._adjustPan?.()));
    });
  }

  private buildEvaluationSummaryHtml(): string {
    if (!this.currentEvaluation) return '<p style="font-size:11px;color:#64748b;">Sin evaluación activa.</p>';
    const ev = this.currentEvaluation;
    const m = ev.metadata;
    const res = ev.resumenEjecutivo;
    const afect = ev.afectacionesAmbientales;
    const totalCapas = afect.length;
    const catA = afect.filter(a => a.categoria === 'A').length;
    const catB = afect.filter(a => a.categoria === 'B').length;
    return `
      <div style="font-size:11px; line-height:1.4;">
        <p><strong>${escapeHtml(m.codigoExpediente)}</strong> - ${escapeHtml(m.titularOSolicitante)}</p>
        <p>Área total: ${m.areaOficialHa.toLocaleString('es-CO')} ha | Hábil: ${res.areaDisponiblePreliminarHa.toLocaleString('es-CO')} ha (${res.porcentajeDisponible}%)</p>
        <p>Afectaciones: ${totalCapas} | Cat A: ${catA} | Cat B: ${catB}</p>
        <ul style="margin:4px 0 0 0; padding-left:14px;">
          ${afect.slice(0,8).map(a => `<li><strong>${escapeHtml(a.figura)}</strong> - ${a.areaAfectadaHa.toLocaleString('es-CO')} ha (${a.porcentajeAfectacion}%)</li>`).join('')}
          ${totalCapas > 8 ? `<li style="color:#64748b;">... y ${totalCapas - 8} más</li>` : ''}
        </ul>
      </div>
    `;
  }

  private lastEvaluationBounds: L.LatLngBounds | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Initializes the Leaflet map and registers all layers ONCE
   */
  public initMap(): void {
    if (this.map) return;

    const map = L.map(this.container, {
      center: [6.32484, -75.97999], // Default Antioquia
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    this.map = map;
    // Mejorar cursor para indicar interactividad
    if (this.map && this.map.getContainer) {
      this.map.getContainer().style.cursor = 'pointer';
    }

    // Apply initial base map
    this.setBaseMap(this.currentBaseMap);

    // Register Evaluation LayerGroups
    this.registerEvaluationGroups();

    // Register All 145+ Catalog Layers
    this.registerCatalogLayers();

    // Load full Distritos Mineros (all 119 official districts)
    this.loadAllDistritosMineros();

    // Set Resguardos Indígenas and Distritos Mineros active by default as requested
    this.activeLayerIds.add('eval-base-polygon');
    this.activeLayerIds.add('eval-exclusiones');
    this.activeLayerIds.add('eval-restricciones');
    this.activeLayerIds.add('eval-distritos');
    this.activeLayerIds.add('minminas-distritos-044');
    this.activeLayerIds.add('eval-indigenas');
    this.activeLayerIds.add('general-26');
    this.activeLayerIds.add('eval-titulos-circundantes');
    this.activeLayerIds.add('eval-solicitudes-circundantes');

    // Add initial active layers to map
    this.activeLayerIds.forEach((layerId) => {
      const layer = this.layerInstances.get(layerId);
      if (layer && !map.hasLayer(layer)) {
        layer.addTo(map);
      }
    });

    this.notifySubscribers();

    // Popup individual con identify de ArcGIS para capas vectoriales activas
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const activeIds = Array.from(this.activeLayerIds);
      const catalogActive = CATALOG_LAYERS.filter(l => activeIds.includes(l.id));
      
      // Primero hacer identify en capas ArcGIS MapServer activas
      const identifyPromises = catalogActive
        .filter(l => l.serviceUrl.includes('MapServer'))
        .map(async (layerItem) => {
          const layerInstance = this.layerInstances.get(layerItem.id);
          if (layerInstance instanceof ArcGisMapServerLayer && this.activeLayerIds.has(layerItem.id)) {
            try {
              const results = await layerInstance.identify(e.latlng, map);
              return { layerItem, results };
            } catch { return { layerItem, results: [] }; }
          }
          return { layerItem, results: [] };
        });

      const identifyResults = await Promise.all(identifyPromises);
      
      // Construir popup con resultados reales de identify
      let hasFeatures = false;
      const featureHtmlParts: string[] = [];
      
      for (const { layerItem, results } of identifyResults) {
        if (results && results.length > 0) {
          hasFeatures = true;
          for (const result of results.slice(0, 3)) { // Máx 3 features por capa
            const attrs = result.attributes || {};
            const layerName = layerItem.name || layerItem.id;
            const displayAttrs = Object.entries(attrs)
              .filter(([k]) => !k.toLowerCase().includes('shape') && !k.toLowerCase().includes('objectid') && !k.toLowerCase().includes('globalid'))
              .slice(0, 12); // Máx 12 atributos
            
            if (displayAttrs.length > 0) {
              featureHtmlParts.push(`
                <div style="margin-bottom: 8px; padding: 6px 8px; background: #f8fafc; border-radius: 6px; border-left: 3px solid ${layerItem.color || '#0ea5e9'};">
                  <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px; font-size: 12px;">${escapeHtml(layerName)}</div>
                  <ul style="margin: 0; padding-left: 14px; font-size: 11px; color: #334155;">
                    ${displayAttrs.map(([key, value]) => `
                      <li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(value))}</li>
                    `).join('')}
                  </ul>
                </div>
              `);
            }
          }
        }
      }

      // Popup global de capas activas + evaluación
      const evalSummary = this.currentEvaluation ? this.buildEvaluationSummaryHtml() : '';
      const catalogListHtml = catalogActive.map(l => `
        <li style="margin-bottom:4px;">
          <strong>${escapeHtml(l.name || l.id)}</strong><br/>
          <span style="color:#475569; font-size:10.5px;">${escapeHtml(`${l.mainCategory} / ${l.subCategory}`)}</span>
          ${l.description ? `<br/><span style="font-size:10px;">${escapeHtml(l.description)}</span>` : ''}
        </li>`).join('');

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 400px; max-height: 480px; overflow-y: auto;">
          ${hasFeatures ? `
            <div style="background: #15803d; color: white; padding: 4px 8px; border-radius: 5px; font-weight: bold; margin-bottom: 8px; display: inline-block;">
              ENTIDADES ENCONTRADAS EN ESTA UBICACIÓN
            </div>
            <div style="margin-bottom: 10px;">
              ${featureHtmlParts.join('')}
            </div>
            <hr style="margin: 8px 0; border-color: #e2e8f0;">
          ` : ''}
          <div style="background: #0284c7; color: white; padding: 4px 8px; border-radius: 5px; font-weight: bold; margin-bottom: 6px; display: inline-block;">
            CAPAS ACTIVAS (${activeIds.length})
          </div>
          <ul style="margin: 4px 0 0 0; padding-left: 14px; font-size: 11px;">
            ${catalogListHtml || `<li style="color:#64748b;">No hay capas de catálogo activas</li>`}
          </ul>
          ${evalSummary}
        </div>
      `;

      L.popup({ autoPanPadding: L.point(20,20), maxWidth: 440, className: 'leaflet-popup-custom' })
        .setLatLng(e.latlng)
        .setContent(popupHtml)
        .openOn(map);
    });

    // Mejorar cursor para indicar interactividad
    if (this.map && this.map.getContainer) {
      this.map.getContainer().style.cursor = 'pointer';
    }
  }

  private registerEvaluationGroups(): void {
    this.layerInstances.set('eval-base-polygon', this.evalBasePolyGroup);
    this.layerInstances.set('eval-exclusiones', this.evalExclusionesGroup);
    this.layerInstances.set('eval-restricciones', this.evalRestriccionesGroup);
    this.layerInstances.set('eval-distritos', this.evalDistritosGroup);
    this.layerInstances.set('eval-indigenas', this.evalIndigenasGroup);
    this.layerInstances.set('eval-rondas', this.evalRondasGroup);
    this.layerInstances.set('eval-titulos-circundantes', this.evalTitulosGroup);
    this.layerInstances.set('eval-solicitudes-circundantes', this.evalSolicitudesGroup);
    this.layerInstances.set('eval-area-habil', this.evalAreaHabilGroup);
    this.layerInstances.set('eval-zonas-sustraidas', this.evalZonasSustraidasGroup);

    // Defaults for evaluation layers
    EVALUATION_LAYERS_META.forEach((m) => {
      if (m.defaultVisible) {
        this.activeLayerIds.add(m.id);
      }
    });
  }

  private registerCatalogLayers(): void {
    CATALOG_LAYERS.forEach((item: CatalogLayerItem) => {
      let layerInstance: L.Layer;

      if (item.id === 'minminas-distritos-044' || item.serviceUrl === 'local') {
        // Complete official Distritos Mineros layer
        layerInstance = this.distritosOficialesGroup;
      } else if (item.serviceUrl.includes('MapServer')) {
        // High-performance dynamic ArcGIS MapServer layer
        layerInstance = new ArcGisMapServerLayer(item.serviceUrl, item.layerId, { opacity: 0.8 });
      } else {
        // Fallback or WMS / REST layer
        layerInstance = L.tileLayer.wms(item.serviceUrl, {
          layers: String(item.layerId),
          format: 'image/png',
          transparent: true,
          opacity: 0.8,
        });
      }

      this.layerInstances.set(item.id, layerInstance);

      if (item.defaultVisible) {
        this.activeLayerIds.add(item.id);
      }
    });
  }

  /**
   * Loads all 119 official Distritos Mineros polygons (Decreto 044 de 2024)
   * With rich informative popups explaining applicability and zoning
   */
  private async loadAllDistritosMineros(): Promise<void> {
    try {
      const resp = await fetch('/api/distritos-mineros');
      if (resp.ok) {
        const geojson = await resp.json();
        this.distritosGeoJsonData = geojson;
        this.populateDistritosLayer(geojson);
      }
    } catch (err) {
      console.warn('[MapController] Could not load /api/distritos-mineros:', err);
    }
  }

  private populateDistritosLayer(geojson: any): void {
    if (!geojson || !geojson.features) return;
    this.distritosOficialesGroup.clearLayers();

    const layer = L.geoJSON(geojson, {
      style: {
        color: '#0d9488', // teal-600
        weight: 1.8,
        fillColor: '#14b8a6', // teal-500
        fillOpacity: 0.22,
        dashArray: '5, 5',
      },
      onEachFeature: (feature, featLayer) => {
        const p = feature.properties || {};
        const nom = p.nombre_dis || p.nombre || p.NOMBRE_DIST_NORM || 'Distrito Minero Especial';
        const depto = p.departamen || p.departamento || p.DEPARTAMENTO_NORM || 'Colombia';
        const mpio = p.municipio || p.MUNICIPIO || 'Varios Municipios';

        featLayer.bindPopup(`
          <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 320px;">
            <div style="background: #0d9488; color: white; padding: 4px 8px; border-radius: 6px; font-weight: bold; margin-bottom: 6px; display: inline-block;">
              DISTRITO MINERO ESPECIAL (DECRETO 044 DE 2024)
            </div>
            <h4 style="margin: 0 0 3px 0; font-weight: bold; color: #0f766e; font-size: 13px;">${nom}</h4>
            <p style="margin: 2px 0;"><strong>Departamento:</strong> ${depto} • <strong>Municipio:</strong> ${mpio}</p>
            <p style="margin: 2px 0;"><strong>Norma Legal:</strong> Decreto 044 de 2024 / Resoluciones MinMinas</p>
            <div style="margin-top: 6px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 6px 8px; font-size: 11px; color: #115e59;">
              <strong style="color: #0f766e; display: block; margin-bottom: 3px;">¿SE PUEDE APLICAR A ESTA ÁREA? SÍ, BAJO CONDICIONES:</strong>
              <ul style="margin: 0; padding-left: 14px; line-height: 1.35;">
                <li><strong>Formalización Minera:</strong> Prioridad para diversificación productiva y formalización tradicional.</li>
                <li><strong>Mesa Territorial:</strong> Requiere articulación con la Mesa Territorial Minera coordinada por MinMinas.</li>
                <li><strong>Concertación:</strong> Nuevas propuestas deben ajustarse a los acuerdos de convivencia y desarrollo local.</li>
              </ul>
            </div>
          </div>
        `);
      },
    });

    this.distritosOficialesGroup.addLayer(layer);

    // If active, ensure it is added to map
    if (this.map && this.activeLayerIds.has('minminas-distritos-044')) {
      if (!this.map.hasLayer(this.distritosOficialesGroup)) {
        this.distritosOficialesGroup.addTo(this.map);
      }
    }
  }

  /**
   * Updates only the Evaluation Feature layers without re-initializing the map or catalog layers
   */
  public updateEvaluation(evaluation: EvaluationResult | null): void {
    if (!this.map || !evaluation) return;
    this.currentEvaluation = evaluation;

    // Clear previous evaluation features
    this.evalBasePolyGroup.clearLayers();
    this.evalExclusionesGroup.clearLayers();
    this.evalRestriccionesGroup.clearLayers();
    this.evalDistritosGroup.clearLayers();
    this.evalIndigenasGroup.clearLayers();
    this.evalRondasGroup.clearLayers();
    this.evalTitulosGroup.clearLayers();
    this.evalSolicitudesGroup.clearLayers();
    this.evalAreaHabilGroup.clearLayers();
    this.evalZonasSustraidasGroup.clearLayers();

    const m = evaluation.metadata;
    const ah = evaluation.areaHabilSugerida;
    const areaHabilHtml = ah
      ? `<div style="margin-top: 6px; padding: 5px 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 11px;">
          <strong style="color: #15803d;">ÁREA HÁBIL SUGERIDA</strong>
          <p style="margin: 2px 0;">Original: <strong>${ah.areaOriginalHa.toLocaleString('es-CO')} ha</strong></p>
          <p style="margin: 2px 0; color: #15803d;">Hábil: <strong>${ah.areaHabilHa.toLocaleString('es-CO')} ha (${ah.porcentajeHabil}%)</strong></p>
          <p style="margin: 2px 0; color: #b91c1c;">Sustraída: <strong>${ah.areaSustraidaHa.toLocaleString('es-CO')} ha (${ah.porcentajeSustraido}%)</strong></p>
          ${ah.capasSinGeometria > 0 ? `<p style="margin: 2px 0; color: #b45309;">${ah.capasSinGeometria} afectación(es) sin geometría no sustraídas.</p>` : ''}
          ${ah.capasNoVerificadas.length > 0 ? `<p style="margin: 2px 0; color: #b45309; font-weight: bold;">Área no verificada: ${ah.capasNoVerificadas.length} capa(s) restrictiva(s) no se pudieron consultar.</p>` : ''}
        </div>`
      : '';
    const baseGeom = evaluation.baseGeometry;

    const municipiosFormateados =
      m.municipiosDetalle && m.municipiosDetalle.length > 0
        ? m.municipiosDetalle.map((md) => `${md.municipio}: ${md.porcentaje}%`).join(', ')
        : m.municipios.join(', ');

    // 1. Base Concession Polygon (Popup Original Rich Format)
    if (baseGeom && baseGeom.geometry) {
      const baseLayer = L.geoJSON(baseGeom, {
        style: {
          color: m.excedeTopeLegal ? '#dc2626' : '#38bdf8',
          weight: 3.2,
          opacity: 0.95,
          fillColor: m.excedeTopeLegal ? '#ef4444' : '#0284c7',
          fillOpacity: 0.16,
        },
      });

      /* CP 2026-11-02: Popup base mejorado con estructura de tarjeta y scroll adaptativo */
this.bindScrollablePopup(baseLayer, `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; padding: 2px; max-width: 310px;">
          <div style="background: ${m.tipoRegistro === 'PROPUESTA_NUEVA' ? '#475569' : '#0284c7'}; color: white; padding: 3px 8px; border-radius: 5px; font-weight: bold; margin-bottom: 6px; display: inline-block;">
            ${m.tipoRegistro === 'PROPUESTA_NUEVA' ? 'PROPUESTA EN EVALUACIÓN PREVIA' : 'TÍTULO OFICIAL ANNA MINERÍA'}
          </div>
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #0369a1; font-size: 14px;">${m.codigoExpediente}</h4>
          <p style="margin: 2px 0;"><strong>Titular / Proponente:</strong> ${m.titularOSolicitante}</p>
          <p style="margin: 2px 0;"><strong>Superficie Oficial:</strong> ${m.areaOficialHa.toLocaleString('es-CO')} Ha</p>
          <p style="margin: 2px 0;"><strong>Escala Minera:</strong> <span style="color: #b45309; font-weight: bold;">${m.clasificacionMinera} Minería</span> (Decreto 1666/2016)</p>
          <p style="margin: 2px 0;"><strong>Departamento / Mpios:</strong> ${m.departamento} (${municipiosFormateados})</p>
          <p style="margin: 2px 0;"><strong>Minerales:</strong> ${m.minerales.slice(0, 4).join(', ')}...</p>
          <p style="margin: 2px 0;"><strong>Estado / Etapa en ANM:</strong> <span style="font-weight: bold;">${m.estadoAdministrativo}</span></p>
          ${
            m.distritoMineroDetalle
              ? `<div style="margin-top: 6px; padding: 4px 8px; background: #ccfbf1; color: #0f766e; border-radius: 5px; font-size: 11px;">
                  <strong>Distrito Minero Especial:</strong> ${m.distritoMineroDetalle.nombre} (${m.distritoMineroDetalle.porcentajeAfectacion}%)
                 </div>`
              : ''
          }
          ${
            m.excedeTopeLegal
              ? `<div style="margin-top: 6px; padding: 4px 8px; background: #fee2e2; color: #991b1b; border-radius: 5px; font-weight: bold; font-size: 11px;">
                  ALERTA ART. 24 LEY 685: Excede el límite de 10.000 Ha.
                 </div>`
              : ''
          }
          ${areaHabilHtml}
          ${buildLegalFrameworkPopupHtml()}
        </div>
      `);

      this.evalBasePolyGroup.addLayer(baseLayer);

      const bounds = baseLayer.getBounds();
      if (bounds.isValid()) {
        this.lastEvaluationBounds = bounds;
        this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }

    // 1b. Área hábil sugerida (verde) y zonas sustraídas (rojo)
    if (ah?.sustraidaGeoJSON) {
      const sustrLayer = L.geoJSON(ah.sustraidaGeoJSON, {
        style: { color: '#b91c1c', weight: 1.5, dashArray: '4 3', fillColor: '#dc2626', fillOpacity: 0.35 },
      });
      this.bindScrollablePopup(sustrLayer, `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 320px;">
          <div style="background: #b91c1c; color: white; padding: 3px 8px; border-radius: 5px; font-weight: bold; margin-bottom: 6px; display: inline-block;">ZONAS SUSTRAÍDAS</div>
          <p style="margin: 2px 0;">Unión de capas de exclusión/restricción intersectadas: <strong>${ah.areaSustraidaHa.toLocaleString('es-CO')} ha (${ah.porcentajeSustraido}%)</strong></p>
          <ul style="margin: 4px 0 0 0; padding-left: 14px; font-size: 11px;">
            ${ah.capasSustraidas.slice(0, 10).map((c) => `<li>${escapeHtml(String(c.nombre))}: ${c.areaHa.toLocaleString('es-CO')} ha</li>`).join('')}
          </ul>
          ${buildLegalFrameworkPopupHtml()}
        </div>
      `);
      this.evalZonasSustraidasGroup.addLayer(sustrLayer);
    }
    if (ah?.habilGeoJSON) {
      const habilLayer = L.geoJSON(ah.habilGeoJSON, {
        style: { color: '#15803d', weight: 2.5, fillColor: '#22c55e', fillOpacity: 0.35 },
      });
      this.bindScrollablePopup(habilLayer, `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 320px;">
          <div style="background: #15803d; color: white; padding: 3px 8px; border-radius: 5px; font-weight: bold; margin-bottom: 6px; display: inline-block;">ÁREA HÁBIL SUGERIDA</div>
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #15803d; font-size: 13px;">${m.codigoExpediente}</h4>
          ${areaHabilHtml}
          <p style="margin: 4px 0 0 0; font-size: 10.5px; color: #475569;">Sugerencia técnica: polígono consultado menos la unión geométrica de capas de exclusión y restricción. No reemplaza el recorte oficial de la ANM.</p>
          ${buildLegalFrameworkPopupHtml()}
        </div>
      `);
      this.evalAreaHabilGroup.addLayer(habilLayer);
    }

    // 2. Exclusiones (Cat. A - Rojo) con Instrucción de Aplicabilidad (Recorte Forzoso)
    const exclFeatures = evaluation.geometriasCortes?.exclusionesGeoJSON?.features || [];
    exclFeatures.forEach((feat: any) => {
      const lyr = L.geoJSON(feat, {
        style: {
          color: '#dc2626',
          weight: 2.5,
          fillColor: '#ef4444',
          fillOpacity: 0.65,
        },
      });
      const p = feat.properties || {};
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 320px;">
          <div style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 5px; font-weight: bold; margin-bottom: 6px; display: inline-block;">
            CATEGÍA A: EXCLUSIÓN MINERA ACREDITADA (ART. 34 LEY 685)
          </div>
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #991b1b; font-size: 13px;">${escapeHtml(String(p.FIGURA || 'Exclusión Minera Absoluta'))}</h4>
          <p style="margin: 2px 0;"><strong>Nombre Oficial:</strong> ${escapeHtml(String(p.DESCRIPTION || 'Sector Delimitado'))}</p>
          <p style="margin: 2px 0;"><strong>Norma Legal:</strong> ${escapeHtml(String(p.NORMA || 'Art. 34 Ley 685 / Ley 1930 de 2018 (Sentencia C-035/16)'))}</p>
          <div style="margin-top: 6px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 6px 8px; font-size: 11px; color: #991b1b; max-height: 180px; overflow-y: auto;">
            <strong style="display: block; margin-bottom: 3px;">¿SE PUEDE APLICAR A ESTA ÁREA? NO SOBRE EL SECTOR EXCLUIDO:</strong>
            <p style="margin: 0; line-height: 1.35;">
              Existe prohibición legal insubsanable. Para viabilizar la propuesta, el proponente debe realizar <strong>recorte forzoso voluntario o administrativo</strong> de las cuadrículas intersectadas y continuar el trámite únicamente sobre el área libre.
            </p>
          </div>
        </div>
      `;
      this.bindScrollablePopup(lyr, popupContent);
      this.evalExclusionesGroup.addLayer(lyr);
    });

    // 3. Restricciones (Cat. B - Ámbar) con Instrucción de Sustracción Forestal MADS
    const restrFeatures = evaluation.geometriasCortes?.restringidasGeoJSON?.features || [];
    restrFeatures.forEach((feat: any) => {
      const lyr = L.geoJSON(feat, {
        style: {
          color: '#d97706',
          weight: 2,
          fillColor: '#f59e0b',
          fillOpacity: 0.45,
        },
      });
      const p = feat.properties || {};
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 320px;">
          <div style="background: #f59e0b; color: #0f172a; padding: 4px 8px; border-radius: 5px; font-weight: bold; margin-bottom: 6px; display: inline-block;">
            CATEGÍA B: RESTRICCIÓN CONDICIONADA (ART. 35 LEY 685)
          </div>
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #b45309; font-size: 13px;">${escapeHtml(String(p.FIGURA || 'Restricción Minero-Ambiental'))}</h4>
          <p style="margin: 2px 0;"><strong>Nombre Oficial:</strong> ${escapeHtml(String(p.DESCRIPTION || 'Zona Restringida'))}</p>
          <p style="margin: 2px 0;"><strong>Norma Legal:</strong> ${escapeHtml(String(p.NORMA || 'Ley 2 de 1959 / Art. 35 Código de Minas'))}</p>
          <div style="margin-top: 6px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 6px 8px; font-size: 11px; color: #78350f; max-height: 180px; overflow-y: auto;">
            <strong style="color: #b45309; display: block; margin-bottom: 3px;">¿SE PUEDE APLICAR A ESTA ÁREA? SÍ, BAJO CONDICIÓN Y TRÁMITE:</strong>
            <ul style="margin: 0; padding-left: 14px; line-height: 1.35;">
              <li><strong>Sustracción Forestal (Ley 2da):</strong> La propuesta es admisible, pero se debe tramitar sustracción previa ante el MADS (Res. 1526/2012 y 110/2022) antes de exploración/explotación.</li>
              <li><strong>Centros Poblados:</strong> Requiere acuerdo previo y autorización formal del Concejo Municipal.</li>
            </ul>
          </div>
        </div>
      `;
      this.bindScrollablePopup(lyr, popupContent);
      this.evalRestriccionesGroup.addLayer(lyr);
    });

    // 4. Distritos Mineros Especiales Intersectados
    const distritosFeatures = evaluation.geometriasCortes?.distritosMinerosGeoJSON?.features || [];
    distritosFeatures.forEach((feat: any) => {
      const lyr = L.geoJSON(feat, {
        style: {
          color: '#0f766e',
          weight: 3,
          fillColor: '#0d9488',
          fillOpacity: 0.45,
          dashArray: '4, 4',
        },
      });
      const p = feat.properties || {};
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 320px;">
          <div style="background: #0d9488; color: white; padding: 4px 8px; border-radius: 5px; font-weight: bold; margin-bottom: 6px; display: inline-block;">
            DISTRITO MINERO ESPECIAL (DEC. 044 DE 2024)
          </div>
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #0f766e; font-size: 13px;">${p.NOMBRE_DIST_NORM || p.nombre_dis || 'Distrito Minero'}</h4>
          <p style="margin: 2px 0;"><strong>Departamento:</strong> ${p.DEPARTAMENTO_NORM || p.departamen || ''}</p>
          <p style="margin: 2px 0;"><strong>Área en Concurrencia:</strong> ${p.AREA_AFECTADA_HA || p.area_ha || 'Calculada'} Ha (${p.PORCENTAJE || 0}%)</p>
          <p style="margin: 2px 0;"><strong>Norma Legal:</strong> Decreto 044 de 2024 / Resoluciones MinMinas</p>
          <div style="margin-top: 6px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 6px 8px; font-size: 11px; color: #115e59; max-height: 160px; overflow-y: auto;">
            <strong style="color: #0f766e; display: block; margin-bottom: 3px;">¿SE PUEDE APLICAR A ESTA ÁREA? SÍ, CON CONCERTACIÓN:</strong>
            <ul style="margin: 0; padding-left: 14px; line-height: 1.35;">
              <li><strong>Prioridad de Formalización:</strong> Zonificación para reconversión y formalización de pequeña minería tradicional.</li>
              <li><strong>Mesas Territoriales:</strong> Nuevas concesiones medianas/grandes se supeditan a concertación territorial del MinMinas.</li>
            </ul>
          </div>
        </div>
      `;
      this.bindScrollablePopup(lyr, popupContent);
      this.evalDistritosGroup.addLayer(lyr);
    });

    // 5. Resguardos Indígenas (Verde Esmeralda) con Condiciones y Acuerdos
    const indigenasFeatures = evaluation.geometriasCortes?.indigenasGeoJSON?.features || [];
    indigenasFeatures.forEach((feat: any) => {
      const lyr = L.geoJSON(feat, {
        style: {
          color: '#059669',
          weight: 2.5,
          fillColor: '#10b981',
          fillOpacity: 0.4,
        },
      });
      const p = feat.properties || {};
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 320px;">
          <div style="background: #059669; color: white; padding: 4px 8px; border-radius: 5px; font-weight: bold; margin-bottom: 6px; display: inline-block;">
            RESGUARDO INDÍGENA (ART. 124 LEY 685 / CAPA 26 ANM)
          </div>
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #047857; font-size: 13px;">${p.NOMBRE || p.RESGUARDO || 'Resguardo Registrado'}</h4>
          <p style="margin: 2px 0;"><strong>Norma Legal:</strong> Convenio 169 OIT / Art. 124 Ley 685 de 2001</p>
          <div style="margin-top: 6px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 6px 8px; font-size: 11px; color: #065f46; max-height: 180px; overflow-y: auto;">
            <strong style="color: #047857; display: block; margin-bottom: 3px;">¿SE PUEDE APLICAR A ESTA ÁREA? SÍ, CON CONDICIONES Y ACUERDOS:</strong>
            <ul style="margin: 0; padding-left: 14px; line-height: 1.35;">
              <li><strong>Derecho de Prelación (Art. 124):</strong> La comunidad indígena tiene preferencia para solicitar la concesión.</li>
              <li><strong>Consulta Previa Obligatoria:</strong> Trámite ante la DANCP del MinInterior con acuerdos protocolizados.</li>
              <li><strong>Acuerdos y Concertación:</strong> Participación comunitaria, beneficios laborales y respeto a sitios sagrados con el Cabildo.</li>
            </ul>
          </div>
        </div>
      `;
      this.bindScrollablePopup(lyr, popupContent);
      this.evalIndigenasGroup.addLayer(lyr);
    });

    // 6. Rondas Hídricas (Capa 60)
    const rondasFeatures = evaluation.geometriasCortes?.rondasHidricasGeoJSON?.features || [];
    rondasFeatures.forEach((feat: any) => {
      const lyr = L.geoJSON(feat, {
        style: {
          color: '#0284c7',
          weight: 2,
          fillColor: '#38bdf8',
          fillOpacity: 0.35,
        },
      });
      const p = feat.properties || {};
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 300px;">
          <div style="background: #0284c7; color: white; padding: 4px 8px; border-radius: 5px; font-weight: bold; margin-bottom: 6px; display: inline-block;">
            RONDA HÍDRICA / DRENAJE PROTEGIDO (CAPA 60)
          </div>
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #0369a1; font-size: 13px;">${p.NOMBRE || 'Margen de Protección Hídrica'}</h4>
          <p style="margin: 2px 0;"><strong>Norma:</strong> Decreto 1076 de 2015 (Margen de 30 metros / ronda CAR)</p>
          <div style="margin-top: 6px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 6px 8px; font-size: 11px; color: #0369a1;">
            <strong>Condición Operativa:</strong> Franja de retiro obligatorio para no intervenir fuentes de agua y proteger nacimientos y cauces.
          </div>
        </div>
      `;
      this.bindScrollablePopup(lyr, popupContent);
      this.evalRondasGroup.addLayer(lyr);
    });

    // 7. Títulos Circundantes (TenureLayers Capa 4)
    const titulosFeatures = evaluation.geometriasCortes?.titulosCircundantesGeoJSON?.features || [];
    titulosFeatures.forEach((feat: any) => {
      const isDirect = feat.properties?.DIRECTO === true;
      const lyr = L.geoJSON(feat, {
        style: {
          color: isDirect ? '#7c3aed' : '#a855f7',
          weight: isDirect ? 2.5 : 1.5,
          fillColor: '#8b5cf6',
          fillOpacity: isDirect ? 0.5 : 0.25,
          dashArray: isDirect ? undefined : '5, 5',
        },
      });
      const p = feat.properties || {};
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 310px;">
          <div style="background: #7c3aed; color: white; padding: 4px 8px; border-radius: 5px; font-weight: bold; margin-bottom: 6px; display: inline-block;">
            ${isDirect ? 'CONFLICTO: TÍTULO SUPERPUESTO' : 'TÍTULO CIRCUNDANTE / ALREDEDOR (5 KM)'}
          </div>
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #581c87; font-size: 13px;">Expediente: ${p.CODIGO_EXPEDIENTE || p.TENURE_ID}</h4>
          <p style="margin: 2px 0;"><strong>Titular:</strong> ${p.SOLICITANTES_O_TITULARES || 'Registrado en ANM'}</p>
          <p style="margin: 2px 0;"><strong>Estado:</strong> ${p.TITULO_ESTADO || 'Activo'} • <strong>Área:</strong> ${p.AREA_HA || 'N/A'} Ha</p>
          <div style="margin-top: 6px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 6px 8px; font-size: 11px; color: #6b21a8;">
            <strong>Principio de Prelación (Art. 16 Ley 685):</strong> Primero en el tiempo, primero en el derecho. ${isDirect ? 'Superposición directa inadmisible sin renuncia o cesión.' : 'Título colindante vigente.'}
          </div>
        </div>
      `;
      this.bindScrollablePopup(lyr, popupContent);
      this.evalTitulosGroup.addLayer(lyr);
    });

    // 8. Solicitudes Circundantes (TenureLayers Capa 3)
    const solicitudesFeatures = evaluation.geometriasCortes?.solicitudesCircundantesGeoJSON?.features || [];
    solicitudesFeatures.forEach((feat: any) => {
      const lyr = L.geoJSON(feat, {
        style: {
          color: '#3b82f6',
          weight: 1.5,
          fillColor: '#60a5fa',
          fillOpacity: 0.2,
          dashArray: '3, 6',
        },
      });
      const p = feat.properties || {};
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 300px;">
          <div style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 5px; font-weight: bold; margin-bottom: 6px; display: inline-block;">
            SOLICITUD EN TRÁMITE CIRCUNDANTE (ANNA MINERÍA)
          </div>
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #1e3a8a; font-size: 13px;">Expediente: ${p.CODIGO_EXPEDIENTE || p.TENURE_ID}</h4>
          <p style="margin: 2px 0;"><strong>Solicitante:</strong> ${p.SOLICITANTES_O_TITULARES || 'En evaluación'}</p>
          <p style="margin: 2px 0;"><strong>Estado:</strong> ${p.TITULO_ESTADO || 'En trámite'}</p>
        </div>
      `;
      this.bindScrollablePopup(lyr, popupContent);
      this.evalSolicitudesGroup.addLayer(lyr);
    });
  }

  /**
   * DIRECTLY manipulates the Leaflet layer visibility on the map.
   * Completely decoupled from React re-renders!
   */
  public setLayerVisibility(layerId: string, visible: boolean): void {
    if (!this.map) return;
    const layer = this.layerInstances.get(layerId);
    if (!layer) return;

    if (visible) {
      if (!this.map.hasLayer(layer)) {
        layer.addTo(this.map);
      }
      this.activeLayerIds.add(layerId);
    } else {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
      this.activeLayerIds.delete(layerId);
    }

    this.notifySubscribers();
  }

  public isLayerVisible(layerId: string): boolean {
    return this.activeLayerIds.has(layerId);
  }

  public toggleLayer(layerId: string): boolean {
    const nextState = !this.isLayerVisible(layerId);
    this.setLayerVisibility(layerId, nextState);
    return nextState;
  }

  public focusLayer(layerId: string): boolean {
    if (!this.map) return false;
    const layer = this.layerInstances.get(layerId);
    if (!layer) return false;
    
    // Turn on the layer if not visible
    if (!this.isLayerVisible(layerId)) {
      this.setLayerVisibility(layerId, true);
    }
    
    // Try to fit bounds to the layer
    try {
      let bounds: L.LatLngBounds | null = null;
      if (layer instanceof L.LayerGroup || layer instanceof L.FeatureGroup) {
        bounds = layer.getBounds();
      } else if (typeof (layer as any).getBounds === 'function') {
        bounds = (layer as any).getBounds();
      }
      if (bounds && bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      }
    } catch {}
    
    return true;
  }

  public setBatchVisibility(layerIds: string[], visible: boolean): void {
    if (!this.map) return;
    layerIds.forEach((id) => {
      const layer = this.layerInstances.get(id);
      if (!layer) return;
      if (visible) {
        if (!this.map!.hasLayer(layer)) layer.addTo(this.map!);
        this.activeLayerIds.add(id);
      } else {
        if (this.map!.hasLayer(layer)) this.map!.removeLayer(layer);
        this.activeLayerIds.delete(id);
      }
    });
    this.notifySubscribers();
  }

  public setBaseMap(type: 'satellite' | 'dark' | 'topo'): void {
    this.currentBaseMap = type;
    if (!this.map) return;

    if (this.baseTileLayer) {
      this.map.removeLayer(this.baseTileLayer);
      this.baseTileLayer = null;
    }

    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let attribution = '&copy; Esri World Imagery';

    // CP 2026-11-02: Se reemplaza el proveedor Oscuro GIS (CartoDB dark_all) por OpenStreetMap Standard,
    // un mapa base gratuito, global, de alta legibilidad y sin restricciones de API keys.
    if (type === 'dark') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    } else if (type === 'topo') {
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap &copy; OpenTopoMap';
    }

    this.baseTileLayer = L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(this.map);
  }

  public getBaseMap(): 'satellite' | 'dark' | 'topo' {
    return this.currentBaseMap;
  }

  public fitEvaluationBounds(): void {
    if (this.map && this.lastEvaluationBounds?.isValid()) {
      this.map.fitBounds(this.lastEvaluationBounds, { padding: [50, 50], maxZoom: 14 });
    }
  }

  public subscribe(subscriber: LayerStateSubscriber): () => void {
    this.subscribers.add(subscriber);
    subscriber(new Set(this.activeLayerIds));
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notifySubscribers(): void {
    const copy = new Set(this.activeLayerIds);
    this.subscribers.forEach((sub) => {
      try {
        sub(copy);
      } catch (e) {
        console.error('Subscriber error:', e);
      }
    });
  }

  public destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.layerInstances.clear();
    this.activeLayerIds.clear();
    this.subscribers.clear();
    this.distritosGeoJsonData = null;
  }
}
