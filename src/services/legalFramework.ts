export const LEY_685_PDF_URL = 'https://www.anm.gov.co/sites/default/files/ley_685_2001_0.pdf';

export type GrupoLegal = 'ART_34' | 'ART_35' | 'ART_31_33' | 'MARITIMO_FLUVIAL' | 'HIDRICO';

export interface LegalSection {
  id: string;
  titulo: string;
  articulos: string;
  color: string;
  items: string[];
  nota?: string;
}

export const LEY_SEGUNDA_SECTION: LegalSection = {
  id: 'ley-segunda',
  titulo: 'Ley Segunda / Áreas de libre aprovechamiento',
  articulos: 'Ley 2 de 1959 · Ley 685 de 2001',
  color: '#16a34a',
  items: [
    'Son áreas liberadas por la ANM: NO son zonas excluidas de la minería.',
    'El acceso se da por el procedimiento de adjudicación que defina la ANM, no por el criterio de primero en el tiempo (primer llegado).',
    'Se diferencian de las zonas excluibles del art. 34 (prohibición legal de minería) y de las zonas de minería restringida del art. 35 (minería sujeta a autorizaciones o condiciones).',
  ],
  nota: 'En Reservas Forestales de Ley 2 de 1959 la exploración/explotación requiere sustracción previa ante el MADS.',
};

export const CODIGO_MINAS_SECTIONS: LegalSection[] = [
  {
    id: 'art-34',
    titulo: 'Zonas Excluibles de la Minería',
    articulos: 'Art. 34',
    color: '#dc2626',
    items: [
      'Parques Nacionales Naturales (PNN).',
      'Parques Naturales Regionales.',
      'Zonas de Reserva Forestal (protectoras y demás que declare la autoridad ambiental).',
      'Ecosistemas de páramo.',
    ],
  },
  {
    id: 'art-35',
    titulo: 'Zonas de Minería Restringida',
    articulos: 'Art. 35',
    color: '#f59e0b',
    items: [
      'Perímetros urbanos de ciudades o poblados.',
      'Áreas ocupadas por construcciones rurales.',
      'Zonas de interés arqueológico, histórico o cultural.',
      'Playas, zonas de bajamar y trayectos fluviales.',
      'Áreas ocupadas por obras públicas o adscritas a un servicio público.',
      'Zonas constituidas como indígenas, de comunidades negras o mixtas.',
    ],
  },
  {
    id: 'art-31-33',
    titulo: 'Reservas y Seguridad',
    articulos: 'Arts. 31 a 33',
    color: '#7c3aed',
    items: [
      'Reservas especiales y áreas reservadas por el Estado (art. 31-32).',
      'Zonas de seguridad nacional (art. 33).',
    ],
  },
  {
    id: 'art-64-145',
    titulo: 'Áreas marítimas y fluviales',
    articulos: 'Arts. 64 y 145',
    color: '#0284c7',
    items: [
      'Requieren concepto previo de la DIMAR.',
      'Concesión en cauce: hasta 2 km de longitud.',
      'Concesión con riberas: hasta 5 km de longitud y 5.000 ha.',
    ],
  },
];

export interface RestrictiveLayerDef {
  layerId: number;
  nombre: string;
  categoria: 'A' | 'B';
  grupoLegal: GrupoLegal;
  norma: string;
  articulo: string;
  autoridad: string;
  condicion: string;
}

const ART35_COND = 'Minería restringida: requiere autorización o concepto previo de la autoridad competente.';

/** General_Base layers (SIGM/General_Base/MapServer) not covered by Exclusive_Restriction/1-2 that condition mining. */
export const RESTRICTIVE_LAYER_REGISTRY: RestrictiveLayerDef[] = [
  { layerId: 49, nombre: 'Área no apta para la minería en la Sabana de Bogotá', categoria: 'A', grupoLegal: 'ART_34', norma: 'Ley 685 de 2001 / Res. MADS 2001 de 2016', articulo: 'Art. 34 Ley 685', autoridad: 'MADS', condicion: 'Exclusión de la actividad minera.' },
  { layerId: 50, nombre: 'Ecosistemas Marino Costeros (arrecifes, pastos marinos, manglares)', categoria: 'A', grupoLegal: 'ART_34', norma: 'Ley 685 de 2001 / Ley 1450 de 2011', articulo: 'Art. 34 Ley 685', autoridad: 'MADS', condicion: 'Exclusión de la actividad minera.' },
  { layerId: 66, nombre: 'Bosque Seco Tropical', categoria: 'A', grupoLegal: 'ART_34', norma: 'Sentencia C-035 de 2016 • Ley 1930 de 2018 • Art. 34 Ley 685', articulo: 'Art. 34 Código de Minas', autoridad: 'Corantioquia / MADS', condicion: 'Exclusión absoluta de minería - ecosistema crítico en peligro.' },
  { layerId: 83, nombre: 'Zonificación de Exclusión Actividad Minera', categoria: 'A', grupoLegal: 'ART_34', norma: 'Ley 685 de 2001', articulo: 'Art. 34 Ley 685', autoridad: 'Autoridad ambiental', condicion: 'Exclusión de la actividad minera.' },
  { layerId: 125, nombre: 'Perímetro Urbano', categoria: 'B', grupoLegal: 'ART_35', norma: 'Ley 685 de 2001', articulo: 'Art. 35 lit. a) Ley 685', autoridad: 'Concejo / Alcaldía Municipal', condicion: ART35_COND },
  { layerId: 124, nombre: 'Centro Poblado', categoria: 'B', grupoLegal: 'ART_35', norma: 'Ley 685 de 2001', articulo: 'Art. 35 lit. a) Ley 685', autoridad: 'Concejo / Alcaldía Municipal', condicion: ART35_COND },
  { layerId: 106, nombre: 'Construcción Rural', categoria: 'B', grupoLegal: 'ART_35', norma: 'Ley 685 de 2001', articulo: 'Art. 35 lit. b) Ley 685', autoridad: 'Propietario / Alcaldía Municipal', condicion: ART35_COND },
  { layerId: 78, nombre: 'Zonas Arqueológicas', categoria: 'B', grupoLegal: 'ART_35', norma: 'Ley 685 de 2001 / Ley 1185 de 2008', articulo: 'Art. 35 lit. c) Ley 685', autoridad: 'ICANH', condicion: ART35_COND },
  { layerId: 79, nombre: 'Sitios Arqueológicos', categoria: 'B', grupoLegal: 'ART_35', norma: 'Ley 685 de 2001 / Ley 1185 de 2008', articulo: 'Art. 35 lit. c) Ley 685', autoridad: 'ICANH', condicion: ART35_COND },
  { layerId: 80, nombre: 'Áreas Arqueológicas Protegidas', categoria: 'B', grupoLegal: 'ART_35', norma: 'Ley 685 de 2001 / Ley 1185 de 2008', articulo: 'Art. 35 lit. c) Ley 685', autoridad: 'ICANH', condicion: ART35_COND },
  { layerId: 85, nombre: 'Zonas de Utilidad Pública Restringidas', categoria: 'B', grupoLegal: 'ART_35', norma: 'Ley 685 de 2001', articulo: 'Art. 35 lit. e) Ley 685', autoridad: 'Entidad a cargo de la obra o servicio público', condicion: ART35_COND },
  { layerId: 9, nombre: 'Aeropuerto Polígono', categoria: 'B', grupoLegal: 'ART_35', norma: 'Ley 685 de 2001', articulo: 'Art. 35 lit. e) Ley 685', autoridad: 'Aerocivil', condicion: ART35_COND },
  { layerId: 6, nombre: 'Puerto Polígono', categoria: 'B', grupoLegal: 'ART_35', norma: 'Ley 685 de 2001', articulo: 'Art. 35 lit. e) Ley 685', autoridad: 'DIMAR / ANI', condicion: ART35_COND },
  { layerId: 84, nombre: 'Zonificación de Restricción Minera', categoria: 'B', grupoLegal: 'ART_35', norma: 'Ley 685 de 2001', articulo: 'Art. 35 Ley 685', autoridad: 'Autoridad ambiental', condicion: ART35_COND },
  { layerId: 112, nombre: 'Consejos Comunitarios Afrocolombianos', categoria: 'B', grupoLegal: 'ART_35', norma: 'Ley 685 de 2001 / Ley 70 de 1993', articulo: 'Art. 35 lit. f) Ley 685', autoridad: 'DANCP - MinInterior', condicion: 'Consulta previa obligatoria y derecho de prelación de la comunidad.' },
  { layerId: 27, nombre: 'Zonas Mineras Étnicas', categoria: 'B', grupoLegal: 'ART_35', norma: 'Ley 685 de 2001 (arts. 121-136)', articulo: 'Art. 35 lit. f) Ley 685', autoridad: 'ANM / DANCP', condicion: 'Derecho de prelación de la comunidad étnica y consulta previa.' },
  { layerId: 35, nombre: 'Zona Reservada con Potencial', categoria: 'B', grupoLegal: 'ART_31_33', norma: 'Ley 685 de 2001', articulo: 'Arts. 31-32 Ley 685', autoridad: 'ANM', condicion: 'Área reservada por el Estado; no disponible por solicitud ordinaria.' },
  { layerId: 33, nombre: 'Áreas Estratégicas Mineras', categoria: 'B', grupoLegal: 'ART_31_33', norma: 'Ley 685 de 2001 / Ley 1753 de 2015', articulo: 'Arts. 31-33 Ley 685', autoridad: 'ANM', condicion: 'Asignación mediante proceso de selección objetiva de la ANM.' },
  { layerId: 34, nombre: 'Áreas de Inversión del Estado', categoria: 'B', grupoLegal: 'ART_31_33', norma: 'Ley 685 de 2001', articulo: 'Arts. 31-33 Ley 685', autoridad: 'ANM', condicion: 'Área reservada por el Estado.' },
  { layerId: 127, nombre: 'Límite Marítimo Polígono', categoria: 'B', grupoLegal: 'MARITIMO_FLUVIAL', norma: 'Ley 685 de 2001', articulo: 'Arts. 64 y 145 Ley 685', autoridad: 'DIMAR', condicion: 'Requiere concepto previo de la DIMAR.' },
  { layerId: 101, nombre: 'Drenaje Doble (cauce)', categoria: 'B', grupoLegal: 'MARITIMO_FLUVIAL', norma: 'Ley 685 de 2001', articulo: 'Arts. 64 y 145 Ley 685', autoridad: 'Autoridad ambiental / DIMAR', condicion: 'Cauce: hasta 2 km; con riberas: hasta 5 km y 5.000 ha.' },
];

export const RESTRICTIVE_LAYER_IDS = RESTRICTIVE_LAYER_REGISTRY.map((l) => l.layerId);

export const GRUPO_LEGAL_LABEL: Record<GrupoLegal, string> = {
  ART_34: 'Art. 34 Excluible',
  ART_35: 'Art. 35 Restringida',
  ART_31_33: 'Arts. 31-33 Reservas/Seguridad',
  MARITIMO_FLUVIAL: 'Arts. 64/145 Marítimo-Fluvial',
  HIDRICO: 'Ronda hídrica',
};

export const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

const sectionHtml = (s: LegalSection) => `
  <div style="margin-top: 5px; border-left: 3px solid ${s.color}; padding: 2px 0 2px 6px;">
    <strong style="color: ${s.color};">${escapeHtml(s.titulo)}</strong> <span style="color: #64748b;">(${escapeHtml(s.articulos)})</span>
    <ul style="margin: 2px 0 0 0; padding-left: 14px;">${s.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
    ${s.nota ? `<em style="color: #475569;">${escapeHtml(s.nota)}</em>` : ''}
  </div>`;

/** HTML block for Leaflet popups: Ley Segunda + Código de Minas conditioning layers. */
export function buildLegalFrameworkPopupHtml(): string {
  return `
    <details style="margin-top: 6px; font-size: 10.5px; line-height: 1.35; color: #0f172a;">
      <summary style="cursor: pointer; font-weight: bold; color: #0369a1;">Marco legal: capas condicionantes (Ley 685 de 2001)</summary>
      <div style="max-height: 200px; overflow-y: auto; padding-right: 4px;">
      ${sectionHtml(LEY_SEGUNDA_SECTION)}
      ${CODIGO_MINAS_SECTIONS.map(sectionHtml).join('')}
      </div>
      <a href="${LEY_685_PDF_URL}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 5px; color: #0369a1; font-weight: bold;">Ley 685 de 2001 (PDF ANM)</a>
    </details>`;
}
