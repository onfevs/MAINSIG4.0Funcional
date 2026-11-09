import * as turf from '@turf/turf';
import proj4 from 'proj4';

// Define MAGNA-SIRGAS / Origen Nacional CTM12 (EPSG:9377)
proj4.defs(
  'EPSG:9377',
  '+proj=tmerc +lat_0=4.0 +lon_0=-73.0 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
);

export interface PolygonVertex {
  id: number;
  lat: number;
  lng: number;
  esteCTM12: number;
  norteCTM12: number;
}

export interface ClippingResult {
  originalGeoJSON: any;
  remanenteGeoJSON: any | null;
  exclusionesGeoJSON: any | null;
  areaOriginalHa: number;
  areaExcluidaHa: number;
  areaRemanenteHa: number;
  porcentajeRemanente: number;
  porcentajeExcluido: number;
  verticesWGS84: PolygonVertex[];
  verticesRemanente: PolygonVertex[];
}

export function esriGeometryToGeoJSON(geom: any): any {
  if (!geom) return null;
  if (geom.rings && geom.rings.length > 0) {
    return { type: 'Polygon', coordinates: geom.rings };
  }
  return null;
}

/**
 * Calculates exact geodetic area in hectares using Turf
 */
export function calculateAreaHa(geometry: any): number {
  if (!geometry) return 0;
  try {
    const areaSqMeters = turf.area(geometry);
    return Number((areaSqMeters / 10000).toFixed(4));
  } catch (err) {
    console.warn('Error calculating area:', err);
    return 0;
  }
}

/**
 * Converts a WGS84 coordinate [longitude, latitude] to EPSG:9377 (CTM12)
 */
export function wgs84ToCTM12(lng: number, lat: number): { este: number; norte: number } {
  try {
    const [este, norte] = proj4('EPSG:4326', 'EPSG:9377', [lng, lat]);
    return {
      este: Number(este.toFixed(2)),
      norte: Number(norte.toFixed(2)),
    };
  } catch (e) {
    return { este: 0, norte: 0 };
  }
}

/**
 * Extracts and projects vertices from a GeoJSON feature
 */
export function extractVertices(feature: any, maxVertices: number = 100): PolygonVertex[] {
  if (!feature) return [];
  try {
    const coords = turf.coordAll(feature);
    const uniqueCoords: [number, number][] = [];
    const seen = new Set<string>();

    coords.forEach(([lng, lat]) => {
      const key = `${lng.toFixed(6)},${lat.toFixed(6)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCoords.push([lng, lat]);
      }
    });

    return uniqueCoords.slice(0, maxVertices).map(([lng, lat], idx) => {
      const ctm = wgs84ToCTM12(lng, lat);
      return {
        id: idx + 1,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        esteCTM12: ctm.este,
        norteCTM12: ctm.norte,
      };
    });
  } catch (e) {
    console.warn('Error extracting vertices:', e);
    return [];
  }
}

/**
 * Safe polygon difference wrapper supporting Turf v6 and Turf v7
 */
export function safePolygonDifference(polyA: any, polyB: any): any {
  if (!polyA || !polyB) return polyA;

  try {
    // Try Turf v7 FeatureCollection format
    const fc = (turf as any).featureCollection([polyA, polyB]);
    const diff = (turf as any).difference(fc);
    if (diff) return diff;
  } catch (e1) {}

  try {
    // Try Turf v6 two-argument format
    const diff = (turf as any).difference(polyA, polyB);
    if (diff) return diff;
  } catch (e2) {}

  return polyA;
}

/**
 * Advanced Clipping Engine
 * Performs precise geometric subtraction of Category A Exclusions + Tropical Dry Forest (BST)
 */
export function computeClippedRemanente(
  baseFeature: any,
  exclusionesCollection?: any,
  bstCollection?: any
): ClippingResult {
  const areaOriginalHa = calculateAreaHa(baseFeature.geometry);
  const verticesWGS84 = extractVertices(baseFeature, 100);

  const exclusionFeatures: any[] = [];

  if (exclusionesCollection?.features) {
    exclusionesCollection.features.forEach((f: any) => {
      if (f.geometry) exclusionFeatures.push(f);
    });
  }

  if (bstCollection?.features) {
    bstCollection.features.forEach((f: any) => {
      if (f.geometry) exclusionFeatures.push(f);
    });
  }

  if (exclusionFeatures.length === 0) {
    return {
      originalGeoJSON: baseFeature,
      remanenteGeoJSON: baseFeature,
      exclusionesGeoJSON: { type: 'FeatureCollection', features: [] },
      areaOriginalHa,
      areaExcluidaHa: 0,
      areaRemanenteHa: areaOriginalHa,
      porcentajeRemanente: 100.0,
      porcentajeExcluido: 0.0,
      verticesWGS84,
      verticesRemanente: verticesWGS84,
    };
  }

  let currentRemanente: any = baseFeature;

  try {
    for (const exclFeat of exclusionFeatures) {
      if (!currentRemanente || !currentRemanente.geometry) break;

      const hasIntersect = turf.booleanIntersects(currentRemanente, exclFeat);
      if (hasIntersect) {
        try {
          const simplifiedBase = turf.simplify(currentRemanente, { tolerance: 0.000005, highQuality: true });
          const simplifiedExcl = turf.simplify(exclFeat, { tolerance: 0.000005, highQuality: true });

          const diff = safePolygonDifference(simplifiedBase, simplifiedExcl);
          if (diff && diff !== simplifiedBase) {
            currentRemanente = diff;
          }
        } catch (errDiff) {
          console.warn('Difference error during clipping iteration:', errDiff);
        }
      }
    }
  } catch (errLoop) {
    console.error('Error during clipping engine execution:', errLoop);
  }

  const areaRemanenteHa = currentRemanente ? calculateAreaHa(currentRemanente.geometry || currentRemanente) : 0;
  const areaExcluidaHa = Number(Math.max(0, areaOriginalHa - areaRemanenteHa).toFixed(4));

  const pctRemanente = areaOriginalHa > 0 ? Number(((areaRemanenteHa / areaOriginalHa) * 100).toFixed(2)) : 0;
  const pctExcluido = areaOriginalHa > 0 ? Number(((areaExcluidaHa / areaOriginalHa) * 100).toFixed(2)) : 0;

  const verticesRemanente = currentRemanente ? extractVertices(currentRemanente, 100) : [];

  return {
    originalGeoJSON: baseFeature,
    remanenteGeoJSON: currentRemanente,
    exclusionesGeoJSON: { type: 'FeatureCollection', features: exclusionFeatures },
    areaOriginalHa,
    areaExcluidaHa,
    areaRemanenteHa,
    porcentajeRemanente: pctRemanente,
    porcentajeExcluido: pctExcluido,
    verticesWGS84,
    verticesRemanente,
  };
}
