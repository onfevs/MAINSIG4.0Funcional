import * as turf from '@turf/turf';
import type { AreaHabilSugerida, CapaSustraida } from '../types/mining';
import type { GrupoLegal } from './legalFramework';

export interface SubtractionCandidate {
  geometry: any;
  nombre: string;
  categoria: 'A' | 'B';
  grupoLegal: GrupoLegal;
}

const isPolygonal = (g: any) => g && (g.type === 'Polygon' || g.type === 'MultiPolygon');
const toHa = (g: any) => (g ? Number((turf.area(g) / 10000).toFixed(4)) : 0);

/** Intersection of a layer geometry with the base polygon (null when they do not overlap). */
export function clipToBase(baseGeometry: any, layerGeometry: any): any | null {
  if (!isPolygonal(baseGeometry) || !isPolygonal(layerGeometry)) return null;
  try {
    const inter = turf.intersect(turf.featureCollection([turf.feature(baseGeometry), turf.feature(layerGeometry)]) as any);
    return inter && inter.geometry && turf.area(inter) > 0 ? inter.geometry : null;
  } catch {
    return null;
  }
}

function unionAll(geoms: any[]): any | null {
  if (geoms.length === 0) return null;
  let acc: any = turf.feature(geoms[0]);
  for (let i = 1; i < geoms.length; i++) {
    try {
      const u = turf.union(turf.featureCollection([acc, turf.feature(geoms[i])]) as any);
      if (u) acc = u;
    } catch {
      // keep accumulated geometry if a single union fails
    }
  }
  return acc.geometry;
}

/**
 * Área hábil sugerida = polígono consultado − ∪(capas de exclusión/restricción).
 * Uses a geometric union of the clipped layers, so overlaps are not double counted.
 */
export function computeAreaHabilSugerida(
  baseFeature: any,
  candidates: SubtractionCandidate[],
  capasNoVerificadas: string[] = []
): AreaHabilSugerida {
  const baseGeom = baseFeature?.geometry;
  const areaOriginalHa = isPolygonal(baseGeom) ? toHa(baseGeom) : 0;
  const capasSustraidas: CapaSustraida[] = [];
  const clipped: any[] = [];
  let capasSinGeometria = 0;

  candidates.forEach((c) => {
    if (!c.geometry) {
      capasSinGeometria++;
      return;
    }
    const inter = clipToBase(baseGeom, c.geometry);
    if (!inter) return;
    clipped.push(inter);
    capasSustraidas.push({ nombre: c.nombre, categoria: c.categoria, grupoLegal: c.grupoLegal, areaHa: toHa(inter) });
  });

  let sustraidaGeom = unionAll(clipped);
  let habilGeom: any = isPolygonal(baseGeom) ? baseGeom : null;
  if (habilGeom && sustraidaGeom) {
    try {
      const diff = turf.difference(turf.featureCollection([turf.feature(baseGeom), turf.feature(sustraidaGeom)]) as any);
      habilGeom = diff ? diff.geometry : null;
    } catch {
      sustraidaGeom = null;
    }
  }

  const areaHabilHa = habilGeom ? toHa(habilGeom) : 0;
  const areaSustraidaHa = Number(Math.max(0, areaOriginalHa - areaHabilHa).toFixed(4));
  const pct = (v: number) => (areaOriginalHa > 0 ? Number(((v / areaOriginalHa) * 100).toFixed(2)) : 0);

  return {
    habilGeoJSON: habilGeom ? { type: 'Feature', properties: { FIGURA: 'Área hábil sugerida' }, geometry: habilGeom } : null,
    sustraidaGeoJSON: sustraidaGeom ? { type: 'Feature', properties: { FIGURA: 'Zonas sustraídas' }, geometry: sustraidaGeom } : null,
    areaOriginalHa,
    areaHabilHa,
    areaSustraidaHa,
    porcentajeHabil: pct(areaHabilHa),
    porcentajeSustraido: pct(areaSustraidaHa),
    capasSustraidas: capasSustraidas.sort((a, b) => b.areaHa - a.areaHa),
    capasSinGeometria,
    capasNoVerificadas,
  };
}
