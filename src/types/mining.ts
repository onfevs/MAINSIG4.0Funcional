/**
 * Tipos de datos fundamentales para Minería Legal GIS Colombia
 * Plataforma inteligente de evaluación de viabilidad jurídica, ambiental y territorial
 */

export type CategoryType = 'A' | 'B' | 'C' | 'D';

export type ViabilityStatus =
  | 'NO_VIABLE_EXCLUSION'
  | 'NO_VIABLE_CONFLICTO'
  | 'VIABILIDAD_CONDICIONADA'
  | 'SIN_IMPEDIMENTO'
  | 'NO_DETERMINABLE';

export type UserRole =
  | 'admin'
  | 'sig_specialist'
  | 'tenement_specialist'
  | 'mining_lawyer'
  | 'general_user';

export interface MiningGeometry {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: Record<string, any>;
}

export interface MunicipalIntersection {
  departamento: string;
  municipio: string;
  codigoMunicipio?: string;
  areaHa: number;
  porcentaje: number;
}

export interface MiningTenureMetadata {
  codigoExpediente: string; // ej: IJN-11331
  placa: string;
  tipoRegistro: 'TITULO_VIGENTE' | 'SOLICITUD_VIGENTE' | 'SOLICITUD_TRAMITE' | 'ARE' | 'PROPUESTA_NUEVA';
  titularOSolicitante: string;
  fechaRadicacion: string;
  clasificacionMinera: 'Pequeña' | 'Mediana' | 'Grande' | 'No Especificada';
  excedeTopeLegal?: boolean;
  areaOficialHa: number;
  minerales: string[];
  departamento: string;
  municipios: string[];
  municipiosDetalle?: MunicipalIntersection[]; // Con porcentaje y área exacta
  veredas: string[];
  sistemaReferencia: string;
  estadoAdministrativo: string;
  etapaMinera?: string; // Explotación, Exploración, Construcción y Montaje, Evaluación Previa
  fuenteOficial: string;
  distritoMineroDetalle?: {
    nombre: string;
    departamento: string;
    areaAfectadaHa: number;
    porcentajeAfectacion: number;
    estadoNormativo: string;
  };
}

export interface OverlapAnalysisItem {
  id: string;
  categoria: CategoryType;
  figura: string;
  nombreOficial: string;
  servicioOrigen: string;
  capaNombre: string;
  areaAfectadaHa: number;
  porcentajeAfectacion: number;
  normaLegal: string;
  articulo: string;
  actoAdministrativo: string;
  autoridadCompetente: string;
  tipoAfectacion: 'EXCLUSION_TOTAL' | 'RESTRICCION_CONDICIONADA' | 'CONFLICTO_TENENCIA' | 'INFORMATIVA';
  actividadProhibidaOCondicionada: string;
  procedimientoRequerido?: string;
  geometry?: any;
  clippedGeometry?: any; // Recorte individual por cada restricción
}

export interface MiningConflictItem {
  id: string;
  placaConflicto: string;
  expediente: string;
  tipoDerecho: 'Título Minero Concedido' | 'Solicitud en Trámite' | 'Área de Reserva Especial' | 'Área Estratégica Minera';
  titular: string;
  estado: string;
  areaSuperpuestaHa: number;
  porcentajeSuperposicion: number;
  tipoRelacion: 'SUPERPOSICION_DIRECTA' | 'COLINDANTE_CIRCUNDANTE';
  distanciaKm?: number;
  minerales?: string;
  modalidad?: string;
  fuente: string;
  fechaConsulta: string;
  observacionJuridica: string;
  geometry?: any;
}

export type CanClaimStatus = 'SI_LIBRE' | 'CONDICIONADO' | 'NO_EXCLUSION' | 'EN_EVALUACION';

export interface LayerAdmissibilityItem {
  id: string;
  layerId: string;
  nombreCapa: string;
  categoriaAnnA: string;
  concurreConPoligono: boolean;
  areaAfectadaHa: number;
  porcentajeAfectacion: number;
  sePuedePedir: CanClaimStatus;
  etiquetaEstado?: string;
  fundamentoJuridico: string;
  articuloCodigoMinas?: string;
  motivoJuridico: string;
  consecuenciaRadicacion?: string;
  autoridadCompetente: string;
  procedimientoRequerido?: string;
  esExclusiva: boolean;
}

export interface CapaSustraida {
  nombre: string;
  categoria: 'A' | 'B';
  grupoLegal: string;
  areaHa: number;
}

export interface AreaHabilSugerida {
  habilGeoJSON: any | null;
  sustraidaGeoJSON: any | null;
  areaOriginalHa: number;
  areaHabilHa: number;
  areaSustraidaHa: number;
  porcentajeHabil: number;
  porcentajeSustraido: number;
  capasSustraidas: CapaSustraida[];
  capasSinGeometria: number;
  capasNoVerificadas: string[];
}

export interface EvaluationResult {
  evalId: string;
  timestamp: string;
  metadata: MiningTenureMetadata;
  baseGeometry: any;
  viabilidadGeneral: ViabilityStatus;
  resumenEjecutivo: {
    areaTotalHa: number;
    areaExclusionesAcreditadasHa: number; // Unión geométrica única sin duplicados
    porcentajeExclusion: number;
    areaRestriccionesCondicionadasHa: number;
    porcentajeRestricciones: number;
    areaConflictosMinerosHa: number;
    porcentajeConflictos: number;
    areaDisponiblePreliminarHa: number;
    porcentajeDisponible: number;
    totalExclusionesDetectadas: number;
    totalRestriccionesDetectadas: number;
    totalConflictosDetectados: number;
    conclusionesClave: string[];
    advertenciasLegales: string[];
  };
  afectacionesAmbientales: OverlapAnalysisItem[];
  conflictosMineros: MiningConflictItem[];
  admisibilidadPorCapa?: LayerAdmissibilityItem[];
  etapasEvaluadas: {
    presentacionPropuesta: { viable: boolean; condicion: string };
    otorgamientoContrato: { viable: boolean; condicion: string };
    exploracionMinera: { viable: boolean; condicion: string };
    explotacionMinera: { viable: boolean; condicion: string };
    licenciaAmbiental: { viable: boolean; condicion: string };
    consultaPrevia: { obligatoria: boolean; entidad: string; condicion: string };
    sustraccionForestal: { requerida: boolean; entidad: string; norma: string };
  };
  areaHabilSugerida?: AreaHabilSugerida;
  geometriasCortes: {
    exclusionesFeatureCollection?: any;
    restriccionesFeatureCollection?: any;
    conflictosFeatureCollection?: any;
    areaRemanenteFeatureCollection?: any;
    exclusionesGeoJSON?: any;
    restringidasGeoJSON?: any;
    titulosCircundantesGeoJSON?: any;
    solicitudesCircundantesGeoJSON?: any;
    distritosMinerosGeoJSON?: any;
    indigenasGeoJSON?: any;
    rondasHidricasGeoJSON?: any;
    municipiosGeoJSON?: any;
  };
  auditoria: {
    usuario: string;
    rol: string;
    serviciosConsultados: {
      servicio: string;
      capa: string;
      registros: number;
      estado: 'OK' | 'FALLO' | 'CACHE';
      duracionMs: number;
    }[];
    sistemasCoordenadas: string;
    versionMotorJuridico: string;
  };
}

export interface LegalRule {
  id: string;
  figura: string;
  tipoRestriccion: CategoryType;
  norma: string;
  articulo: string;
  textoRelevante: string;
  urlOficial: string;
  fechaExpedicion: string;
  vigencia: 'VIGENTE' | 'CONDICIONADA' | 'DEROGADA_PARCIALMENTE';
  sentenciasRelacionadas: string[];
  etapaMineraAfectada: string[];
  autoridadCompetente: string;
  procedimientoRequerido?: string;
  condicionesAplicacion: string;
}

export interface ServiceCatalogItem {
  id: string;
  nombre: string;
  tipo: 'ArcGIS_REST' | 'WMS' | 'WFS' | 'GeoServer';
  url: string;
  categoria: 'MINERA' | 'AMBIENTAL' | 'TERRITORIAL' | 'ETNICA';
  estado: 'ACTIVO' | 'DEGRADADO' | 'PENDIENTE';
  capasRegistradas: number;
  ultimaVerificacion: string;
}
