import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Filter,
  Sparkles,
  ShieldAlert,
  Database,
  Grid,
  MapPin,
  X,
  AlertTriangle,
  Landmark,
  Trees,
  Scale,
  Target,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { MapController } from '../services/mapController';
import {
  CATALOG_LAYERS,
  EVALUATION_LAYERS_META,
  CatalogLayerItem,
} from '../services/mapLayersCatalog';
import { EvaluationResult } from '../types/mining';
import { RESTRICTIVE_LAYER_REGISTRY, GRUPO_LEGAL_LABEL } from '../services/legalFramework';

const RESTRICTIVE_LAYER_BY_ID = new Map(RESTRICTIVE_LAYER_REGISTRY.map((d) => [d.layerId, d]));

interface LayerCatalogPanelProps {
  mapController: MapController | null;
  evaluation: EvaluationResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LayerCatalogPanel: React.FC<LayerCatalogPanelProps> = ({
  mapController,
  evaluation,
  isOpen,
  onClose,
}) => {
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('INTERSECTADAS');
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Accordion state for collapsible categories
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    '🎯 Capas Intersectadas de Interés': true,
    '🚨 Categoría A: Exclusiones Absolutas (Art. 34 Código de Minas)': true,
    '⚠️ Categoría B: Restricciones Condicionadas (Art. 35 Código de Minas)': true,
    '🏛️ Distritos Mineros Especiales (Decreto 044 de 2024)': true,
    '🌿 Resguardos Indígenas y Territorios Étnicos (Art. 124 Código de Minas)': true,
    '⛏️ Tenencia Minera y Prelación Temporal (Art. 16 Código de Minas)': true,
  });

  // Subscribe to MapController active layers state for UI checkbox rendering
  useEffect(() => {
    if (!mapController) return;
    const unsubscribe = mapController.subscribe((activeSet) => {
      setActiveLayers(activeSet);
    });
    return unsubscribe;
  }, [mapController]);

  // Scroll category bar with arrow buttons
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const offset = direction === 'left' ? -180 : 180;
      categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Check which features intersect with the active evaluation and provide legal guidance
  const intersectionStats = useMemo(() => {
    if (!evaluation) return {};

    const stats: Record<
      string,
      {
        intersects: boolean;
        badgeText: string;
        badgeColor: string;
        comoAplicar: string;
        areaHa?: number;
        pct?: number;
      }
    > = {};

    const exclCount = evaluation.geometriasCortes?.exclusionesGeoJSON?.features?.length || 0;
    const restrCount = evaluation.geometriasCortes?.restringidasGeoJSON?.features?.length || 0;
    const distritosCount = evaluation.geometriasCortes?.distritosMinerosGeoJSON?.features?.length || 0;
    const indigenasCount = evaluation.geometriasCortes?.indigenasGeoJSON?.features?.length || 0;
    const rondasCount = evaluation.geometriasCortes?.rondasHidricasGeoJSON?.features?.length || 0;
    const titulosCount = evaluation.geometriasCortes?.titulosCircundantesGeoJSON?.features?.length || 0;
    const solCount = evaluation.geometriasCortes?.solicitudesCircundantesGeoJSON?.features?.length || 0;

    stats['eval-base-polygon'] = {
      intersects: true,
      badgeText: `Polígono Evaluado: ${evaluation.metadata.areaOficialHa} Ha`,
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      comoAplicar: `Expediente ${evaluation.metadata.codigoExpediente} (${evaluation.metadata.clasificacionMinera} Minería). Sujeto a balance de áreas libres descontando exclusiones acreditadas.`,
      areaHa: evaluation.metadata.areaOficialHa,
    };

    const ah = evaluation.areaHabilSugerida;
    if (ah) {
      stats['eval-area-habil'] = {
        intersects: true,
        badgeText: `ÁREA HÁBIL: ${ah.areaHabilHa} Ha • ${ah.porcentajeHabil}%`,
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
        comoAplicar: `Polígono consultado (${ah.areaOriginalHa} Ha) menos la unión geométrica de capas de exclusión/restricción (${ah.areaSustraidaHa} Ha sustraídas).`,
        areaHa: ah.areaHabilHa,
        pct: ah.porcentajeHabil,
      };
      if (ah.areaSustraidaHa > 0) {
        stats['eval-zonas-sustraidas'] = {
          intersects: true,
          badgeText: `SUSTRAÍDA: ${ah.areaSustraidaHa} Ha • ${ah.porcentajeSustraido}%`,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
          comoAplicar: ah.capasSustraidas.map((c) => `${c.nombre} (${c.areaHa} Ha)`).join(' · '),
          areaHa: ah.areaSustraidaHa,
          pct: ah.porcentajeSustraido,
        };
      }
    }

    // Capas restrictivas adicionales de General_Base (RESTRICTIVE_LAYER_REGISTRY)
    RESTRICTIVE_LAYER_REGISTRY.forEach((def) => {
      const hits = evaluation.afectacionesAmbientales.filter(
        (a) => a.servicioOrigen === `SIGM/General_Base/MapServer/${def.layerId}`
      );
      if (hits.length === 0) return;
      const ha = Number(hits.reduce((s, a) => s + a.areaAfectadaHa, 0).toFixed(4));
      const pct = Number(hits.reduce((s, a) => s + a.porcentajeAfectacion, 0).toFixed(2));
      stats[`general-${def.layerId}`] = {
        intersects: true,
        badgeText: `${def.categoria === 'A' ? '🚨' : '⚠️'} ${GRUPO_LEGAL_LABEL[def.grupoLegal]} (${ha} Ha • ${pct}%)`,
        badgeColor:
          def.categoria === 'A'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        comoAplicar: `${def.articulo}: ${def.condicion} Autoridad: ${def.autoridad}.`,
        areaHa: ha,
        pct,
      };
    });

    if (exclCount > 0) {
      const ha = evaluation.resumenEjecutivo.areaExclusionesAcreditadasHa;
      const pct = evaluation.resumenEjecutivo.porcentajeExclusion;
      stats['eval-exclusiones'] = {
        intersects: true,
        badgeText: `🚨 SUPERPOSICIÓN DIRECTA (${ha} Ha • ${pct}%)`,
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
        comoAplicar:
          '¿Cómo se puede aplicar? NO es posible titular sobre el sector excluido (Art. 34 Ley 685 / Ley 1930). Se debe solicitar recorte forzoso de celdas coincidentes y continuar únicamente sobre el área libre remanente.',
        areaHa: ha,
        pct,
      };
      stats['exclusive-2'] = stats['eval-exclusiones'];
    }

    if (restrCount > 0) {
      const ha = evaluation.resumenEjecutivo.areaRestriccionesCondicionadasHa;
      const pct = evaluation.resumenEjecutivo.porcentajeRestricciones;
      stats['eval-restricciones'] = {
        intersects: true,
        badgeText: `⚠️ RESTRICCIÓN CONDICIONADA (${ha} Ha • ${pct}%)`,
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        comoAplicar:
          '¿Cómo se puede aplicar? SÍ es admisible para concesión, pero exige sustracción forestal previa ante MADS (Res. 1526/2012 y 110/2022) o autorización municipal antes de cualquier labor operativa.',
        areaHa: ha,
        pct,
      };
      stats['exclusive-1'] = stats['eval-restricciones'];
    }

    if (distritosCount > 0 || evaluation.metadata.distritoMineroDetalle) {
      const d = evaluation.metadata.distritoMineroDetalle;
      stats['eval-distritos'] = {
        intersects: true,
        badgeText: `🏛️ CONCURRENCIA DISTRITAL (${d?.porcentajeAfectacion || 0}%)`,
        badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/50',
        comoAplicar:
          '¿Cómo se puede aplicar? SÍ aplica, priorizando reconversión y formalización de minería tradicional. Nuevas propuestas se articulan con la Mesa Territorial Minera del MinMinas (Decreto 044 de 2024).',
        pct: d?.porcentajeAfectacion,
      };
      stats['minminas-distritos-044'] = stats['eval-distritos'];
    }

    if (indigenasCount > 0) {
      stats['eval-indigenas'] = {
        intersects: true,
        badgeText: '🌿 PRESENCIA ÉTNICA (CONSULTA PREVIA OBLIGATORIA)',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
        comoAplicar:
          '¿Cómo se puede aplicar? SÍ se puede aplicar con acuerdos: La comunidad tiene derecho de prelación preferente (Art. 124 Ley 685); requiere agotar Consulta Previa formal ante la DANCP del MinInterior y protocolizar acuerdos de beneficios y salvaguardas culturales.',
      };
      stats['general-26'] = stats['eval-indigenas'];
    }

    if (rondasCount > 0) {
      stats['eval-rondas'] = {
        intersects: true,
        badgeText: '💧 RONDA HÍDRICA (FRANJA RETIRO 30M)',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
        comoAplicar:
          '¿Cómo se puede aplicar? Se debe respetar la franja de amortiguación mínima de 30 metros de cuerpos hídricos (Dec. 1076/2015) sin intervenir el cauce.',
      };
      stats['general-60'] = stats['eval-rondas'];
    }

    if (titulosCount > 0) {
      stats['eval-titulos-circundantes'] = {
        intersects: true,
        badgeText: `⚡ ${titulosCount} TÍTULOS CIRCUNDANTES (5 KM)`,
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
        comoAplicar:
          '¿Cómo se puede aplicar? Principio de prelación temporal (Art. 16 Ley 685). Se deben respetar los linderos adjudicados del titular previo.',
      };
      stats['tenure-4'] = stats['eval-titulos-circundantes'];
    }

    if (solCount > 0) {
      stats['eval-solicitudes-circundantes'] = {
        intersects: true,
        badgeText: `📋 ${solCount} SOLICITUDES EN TRÁMITE`,
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
        comoAplicar:
          'Solicitudes radicadas previamente en AnnA Minería que tienen prelación en la asignación de cuadrículas.',
      };
      stats['tenure-3'] = stats['eval-solicitudes-circundantes'];
    }

    return stats;
  }, [evaluation]);

  // Prioritize and classify all layers
  const prioritizedLayersUnified = useMemo(() => {
    const evalLayers: CatalogLayerItem[] = EVALUATION_LAYERS_META.map((em) => {
      let cat = '⛏️ Tenencia Minera y Prelación Temporal (Art. 16 Código de Minas)';

      if (em.id === 'eval-exclusiones' || em.id === 'eval-zonas-sustraidas') {
        cat = '🚨 Categoría A: Exclusiones Absolutas (Art. 34 Código de Minas)';
      } else if (em.id === 'eval-restricciones' || em.id === 'eval-rondas') {
        cat = '⚠️ Categoría B: Restricciones Condicionadas (Art. 35 Código de Minas)';
      } else if (em.id === 'eval-distritos') {
        cat = '🏛️ Distritos Mineros Especiales (Decreto 044 de 2024)';
      } else if (em.id === 'eval-indigenas') {
        cat = '🌿 Resguardos Indígenas y Territorios Étnicos (Art. 124 Código de Minas)';
      }

      return {
        id: em.id,
        name: em.name,
        serviceName: 'Evaluación Activa',
        serviceUrl: 'local',
        layerId: 0,
        mainCategory: cat,
        subCategory: em.subCategory,
        defaultVisible: em.defaultVisible,
        color: em.color,
        description: em.description,
      };
    });

    const catalogReclassified: CatalogLayerItem[] = CATALOG_LAYERS.map((cl) => {
      let cat = cl.mainCategory;

      const registryDef = cl.serviceName === 'General_Base' ? RESTRICTIVE_LAYER_BY_ID.get(cl.layerId) : undefined;

      // CP 2026-11-02: Identificar capas étnicas por ID, nombre, subcategoría o servicio Origen
      const esCapaEtnica =
        cl.id === 'general-26' ||
        cl.id === 'general-27' ||
        cl.id === 'general-28' ||
        cl.serviceName === 'MinInterior' ||
        cl.subCategory.toLowerCase().includes('étnic') ||
        cl.subCategory.toLowerCase().includes('indígena') ||
        cl.subCategory.toLowerCase().includes('resguardo') ||
        cl.name.toLowerCase().includes('resguardo') ||
        cl.name.toLowerCase().includes('étnic');

      if (cl.id === 'minminas-distritos-044') {
        cat = '🏛️ Distritos Mineros Especiales (Decreto 044 de 2024)';
      } else if (registryDef) {
        cat =
          registryDef.categoria === 'A'
            ? '🚨 Categoría A: Exclusiones Absolutas (Art. 34 Código de Minas)'
            : '⚠️ Categoría B: Restricciones Condicionadas (Art. 35 Código de Minas)';
      } else if (cl.id === 'exclusive-2' || cl.name.includes('Excluibles') || cl.subCategory.includes('Excluibles')) {
        cat = '🚨 Categoría A: Exclusiones Absolutas (Art. 34 Código de Minas)';
      } else if (cl.id === 'exclusive-1' || cl.name.includes('Restringidas') || cl.subCategory.includes('Restringidas')) {
        cat = '⚠️ Categoría B: Restricciones Condicionadas (Art. 35 Código de Minas)';
      } else if (cl.serviceName === 'TenureLayers') {
        cat = '⛏️ Tenencia Minera y Prelación Temporal (Art. 16 Código de Minas)';
      } else if (esCapaEtnica) {
        cat = '🌿 Resguardos Indígenas y Territorios Étnicos (Art. 124 Código de Minas)';
      } else if (cl.serviceName === 'Cuadricula') {
        cat = '📐 Cuadrícula Minera Nacional (ANM)';
      } else if (cl.serviceName === 'RUNAP') {
        cat = '🌲 Áreas Protegidas RUNAP / SINAP';
      } else {
        cat = '🗺️ Cartografía General (Informativa)';
      }

      return {
        ...cl,
        mainCategory: cat,
      };
    });

    return [...evalLayers, ...catalogReclassified];
  }, []);

  // CP 2026-11-02: Normaliza el texto de búsqueda eliminando tildes, diéresis y eñes para coincidencias robustas
  const normalizeText = (text: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Filtered layers based on selected tab or search query
  const filteredLayers = useMemo(() => {
    const qNormalized = normalizeText(searchQuery);

    return prioritizedLayersUnified.filter((layer) => {
      // CP 2026-11-02: Si el usuario está escribiendo en el buscador, la búsqueda es GLOBAL en todo el catálogo
      if (qNormalized) {
        const coincideNombre = normalizeText(layer.name).includes(qNormalized);
        const coincideSub = normalizeText(layer.subCategory).includes(qNormalized);
        const coincideServicio = normalizeText(layer.serviceName).includes(qNormalized);
        const coincideId = normalizeText(layer.id).includes(qNormalized);
        const coincideDesc = layer.description ? normalizeText(layer.description).includes(qNormalized) : false;

        return coincideNombre || coincideSub || coincideServicio || coincideId || coincideDesc;
      }

      // Si no hay búsqueda, aplicamos el filtro de categorías de la pestaña activa
      if (selectedCategory === 'INTERSECTADAS') {
        const isInter = Boolean(intersectionStats[layer.id]?.intersects);
        if (!isInter) return false;
      } else if (selectedCategory !== 'ALL') {
        if (layer.mainCategory !== selectedCategory) return false;
      }

      return true;
    });
  }, [prioritizedLayersUnified, searchQuery, selectedCategory, intersectionStats]);

  // Strict Legal Priority Order for Group Headers
  const LEGAL_CATEGORY_ORDER = [
    '🚨 Categoría A: Exclusiones Absolutas (Art. 34 Código de Minas)',
    '⚠️ Categoría B: Restricciones Condicionadas (Art. 35 Código de Minas)',
    '🏛️ Distritos Mineros Especiales (Decreto 044 de 2024)',
    '🌿 Resguardos Indígenas y Territorios Étnicos (Art. 124 Código de Minas)',
    '⛏️ Tenencia Minera y Prelación Temporal (Art. 16 Código de Minas)',
    '📐 Cuadrícula Minera Nacional (ANM)',
    '🌲 Áreas Protegidas RUNAP / SINAP',
    '🗺️ Cartografía General (Informativa)',
  ];

  // Group filtered layers
  const groupedLayers = useMemo(() => {
    const groups: Record<string, Record<string, CatalogLayerItem[]>> = {};

    filteredLayers.forEach((layer) => {
      const cat =
        selectedCategory === 'INTERSECTADAS'
          ? '🎯 Capas Intersectadas de Interés'
          : layer.mainCategory;
      const sub = layer.subCategory || 'General';

      if (!groups[cat]) groups[cat] = {};
      if (!groups[cat][sub]) groups[cat][sub] = [];
      groups[cat][sub].push(layer);
    });

    // If on "INTERSECTADAS", sort intersecting layers by priority
    if (groups['🎯 Capas Intersectadas de Interés']) {
      return groups;
    }

    const result: Record<string, Record<string, CatalogLayerItem[]>> = {};
    LEGAL_CATEGORY_ORDER.forEach((cat) => {
      if (groups[cat] && Object.keys(groups[cat]).length > 0) {
        result[cat] = groups[cat];
      }
    });

    Object.keys(groups).forEach((cat) => {
      if (!result[cat] && Object.keys(groups[cat]).length > 0) {
        result[cat] = groups[cat];
      }
    });

    return result;
  }, [filteredLayers, selectedCategory]);

  // Direct toggle manipulation on Leaflet map
  const handleToggleLayer = (layerId: string) => {
    if (!mapController) return;
    mapController.toggleLayer(layerId);
  };

  const handleToggleBatch = (layers: CatalogLayerItem[], activate: boolean) => {
    if (!mapController) return;
    const ids = layers.map((l) => l.id);
    mapController.setBatchVisibility(ids, activate);
  };

  const handleActivateRecommended = () => {
    if (!mapController) return;
    const recommended = [
      'eval-area-habil',
      'eval-zonas-sustraidas',
      'eval-base-polygon',
      'eval-exclusiones',
      'eval-restricciones',
      'eval-distritos',
      'minminas-distritos-044',
      'eval-indigenas',
      'general-26',
      'eval-titulos-circundantes',
      'eval-solicitudes-circundantes',
      'tenure-4',
      'tenure-3',
      'exclusive-1',
      'exclusive-2',
    ];
    mapController.setBatchVisibility(recommended, true);
  };

  const handleDeactivateAll = () => {
    if (!mapController) return;
    mapController.setBatchVisibility(Array.from(activeLayers), false);
  };

  const toggleGroupExpand = (cat: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const totalActive = activeLayers.size;
  const isBasePolygonChecked = activeLayers.has('eval-base-polygon');
  const intersectingCount = Object.keys(intersectionStats).length;

  if (!isOpen) return null;

  return (
    <div className="absolute top-14 left-4 z-20 w-[430px] max-w-[calc(100vw-2rem)] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[620px] overflow-hidden text-xs text-slate-200 animate-fade-in font-sans">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
              Catálogo Jerárquico Código de Minas
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                {prioritizedLayersUnified.length}+
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Prioridad legal: Cat. A, Cat. B, Distritos (Dec. 044) y Étnico
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Cerrar panel de capas"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Master Toggle Card: Polígono Evaluado / Consultado */}
      <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full border-2 border-sky-400 bg-sky-400/30"></span>
          <div>
            <span className="font-bold text-white text-[11px] block">
              Polígono Evaluado / Consultado
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {evaluation?.metadata.codigoExpediente || 'Expediente Base'} • {evaluation?.metadata.areaOficialHa} Ha
            </span>
          </div>
        </div>

        <button
          onClick={() => handleToggleLayer('eval-base-polygon')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border transition ${
            isBasePolygonChecked
              ? 'bg-sky-500 text-slate-950 border-sky-400 font-extrabold shadow-sm'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
          title="Encender o apagar el polígono base evaluado"
        >
          {isBasePolygonChecked ? <Eye className="w-3 h-3 text-slate-950" /> : <EyeOff className="w-3 h-3" />}
          <span>{isBasePolygonChecked ? 'ACTIVO' : 'APAGADO'}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-slate-800 space-y-2 bg-slate-950">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar capas o determinantes legales (ej: páramo, resguardo, distrito)..."
            className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Carousel with Navigation Arrows */}
        <div className="relative flex items-center">
          <button
            onClick={() => scrollCategories('left')}
            className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 mr-1 shadow-sm shrink-0"
            title="Desplazar categorías a la izquierda"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={categoryScrollRef}
            className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5 text-[10px]"
          >
            {/* Primary Tab: Intersectadas de Interés */}
            <button
              onClick={() => setSelectedCategory('INTERSECTADAS')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition flex items-center gap-1 font-bold ${
                selectedCategory === 'INTERSECTADAS'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-800/60 hover:bg-amber-900/50'
              }`}
            >
              <Target className="w-3 h-3" />
              <span>Intersectadas de Interés ({intersectingCount})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('🚨 Categoría A: Exclusiones Absolutas (Art. 34 Código de Minas)')}
              className={`px-2 py-1 rounded-md whitespace-nowrap transition ${
                selectedCategory.includes('Categoría A')
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-slate-900 text-rose-300 hover:text-white border border-rose-900/50'
              }`}
            >
              Cat. A Exclusiones
            </button>

            <button
              onClick={() => setSelectedCategory('⚠️ Categoría B: Restricciones Condicionadas (Art. 35 Código de Minas)')}
              className={`px-2 py-1 rounded-md whitespace-nowrap transition ${
                selectedCategory.includes('Categoría B')
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-amber-300 hover:text-white border border-amber-900/50'
              }`}
            >
              Cat. B Restricciones
            </button>

            <button
              onClick={() => setSelectedCategory('🏛️ Distritos Mineros Especiales (Decreto 044 de 2024)')}
              className={`px-2 py-1 rounded-md whitespace-nowrap transition ${
                selectedCategory.includes('Distritos')
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-teal-300 hover:text-white border border-teal-900/50'
              }`}
            >
              Distritos Mineros (Dec 044)
            </button>

            <button
              onClick={() => setSelectedCategory('🌿 Resguardos Indígenas y Territorios Étnicos (Art. 124 Código de Minas)')}
              className={`px-2 py-1 rounded-md whitespace-nowrap transition ${
                selectedCategory.includes('Resguardos')
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'bg-slate-900 text-emerald-300 hover:text-white border border-emerald-900/50'
              }`}
            >
              Resguardos / Étnico
            </button>

            <button
              onClick={() => setSelectedCategory('⛏️ Tenencia Minera y Prelación Temporal (Art. 16 Código de Minas)')}
              className={`px-2 py-1 rounded-md whitespace-nowrap transition ${
                selectedCategory.includes('Tenencia')
                  ? 'bg-purple-500 text-white font-bold'
                  : 'bg-slate-900 text-purple-300 hover:text-white border border-purple-900/50'
              }`}
            >
              Tenencia Minera
            </button>

            <button
              onClick={() => setSelectedCategory('📐 Cuadrícula Minera Nacional (ANM)')}
              className={`px-2 py-1 rounded-md whitespace-nowrap transition ${
                selectedCategory.includes('Cuadrícula')
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Cuadrícula Minera
            </button>

            <button
              onClick={() => setSelectedCategory('🌲 Áreas Protegidas RUNAP / SINAP')}
              className={`px-2 py-1 rounded-md whitespace-nowrap transition ${
                selectedCategory.includes('RUNAP')
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              RUNAP SINAP
            </button>

            <button
              onClick={() => setSelectedCategory('🗺️ Cartografía General (Informativa)')}
              className={`px-2 py-1 rounded-md whitespace-nowrap transition ${
                selectedCategory.includes('Cartografía')
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Informativa / Base
            </button>

            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2 py-1 rounded-md whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Todas (160)
            </button>
          </div>

          <button
            onClick={() => scrollCategories('right')}
            className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 ml-1 shadow-sm shrink-0"
            title="Desplazar categorías a la derecha"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {totalActive} capas activas
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleActivateRecommended}
              className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
            >
              <Sparkles className="w-3 h-3" />
              <span>Recomendadas</span>
            </button>
            <button
              onClick={handleDeactivateAll}
              className="text-slate-400 hover:text-rose-400 transition"
            >
              Desactivar Todas
            </button>
          </div>
        </div>
      </div>

      {/* Layers Scrollable Tree Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-slate-800/60">
        {Object.keys(groupedLayers).length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No se encontraron capas que coincidan con la búsqueda.
          </div>
        ) : (
          Object.entries(groupedLayers).map(([mainCat, subCats]) => {
            const allCatLayers = Object.values(subCats).flat();
            const activeInCat = allCatLayers.filter((l) => activeLayers.has(l.id)).length;
            const isExpanded = expandedGroups[mainCat] ?? true;
            const hasIntersectingInCat = allCatLayers.some((l) => intersectionStats[l.id]?.intersects);

            return (
              <div key={mainCat} className="pt-2 first:pt-0 space-y-2">
                {/* Main Category Header with Priority Styling */}
                <div
                  className={`flex items-center justify-between px-2.5 py-1.8 rounded-lg cursor-pointer border transition ${
                    mainCat.includes('Intersectadas')
                      ? 'bg-amber-950/40 border-amber-600/70 hover:border-amber-500 shadow-md'
                      : mainCat.includes('Categoría A')
                      ? 'bg-rose-950/30 border-rose-900/60 hover:border-rose-700'
                      : mainCat.includes('Categoría B')
                      ? 'bg-amber-950/30 border-amber-900/60 hover:border-amber-700'
                      : mainCat.includes('Distritos')
                      ? 'bg-teal-950/30 border-teal-900/60 hover:border-teal-700'
                      : mainCat.includes('Resguardos')
                      ? 'bg-emerald-950/30 border-emerald-900/60 hover:border-emerald-700'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
                  }`}
                  onClick={() => toggleGroupExpand(mainCat)}
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="font-bold text-white text-[11px] truncate">
                      {mainCat}
                    </span>
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-300 shrink-0">
                      {allCatLayers.length}
                    </span>
                    {hasIntersectingInCat && !mainCat.includes('Intersectadas') && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse shrink-0">
                        DETECTADA
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        activeInCat > 0
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {activeInCat} activas
                    </span>
                    <button
                      onClick={() => handleToggleBatch(allCatLayers, activeInCat < allCatLayers.length)}
                      className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
                      title={activeInCat < allCatLayers.length ? 'Activar grupo' : 'Desactivar grupo'}
                    >
                      {activeInCat < allCatLayers.length ? 'Todo' : 'Ninguna'}
                    </button>
                  </div>
                </div>

                {/* Subcategories & Layers List */}
                {isExpanded && (
                  <div className="pl-2 space-y-2 text-xs">
                    {Object.entries(subCats).map(([subName, layers]) => (
                      <div key={subName} className="space-y-1">
                        {subName !== 'General' && Object.keys(subCats).length > 1 && (
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pl-1 pt-1 border-l-2 border-amber-500/30 flex items-center justify-between">
                            <span>{subName}</span>
                            <span className="text-[9px] font-mono text-slate-500">({layers.length})</span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          {layers.map((layer) => {
                            const isChecked = activeLayers.has(layer.id);
                            const interStat = intersectionStats[layer.id];

                            return (
                              <div
                                key={layer.id}
                                className={`flex flex-col p-2 rounded-lg transition border ${
                                  interStat?.intersects
                                    ? isChecked
                                      ? 'bg-slate-900 border-amber-500/60 shadow-md'
                                      : 'bg-slate-900/80 border-slate-700/80'
                                    : isChecked
                                    ? 'bg-slate-900/90 text-white font-medium border-slate-700/60'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border-transparent'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{
                                        backgroundColor: layer.color || '#38bdf8',
                                        boxShadow: isChecked
                                          ? `0 0 8px ${layer.color || '#38bdf8'}`
                                          : 'none',
                                      }}
                                    ></span>
                                    <div className="truncate">
                                      <span className="truncate block text-[11px] leading-tight text-white font-medium">
                                        {layer.name}
                                      </span>
                                      {layer.layerId > 0 && (
                                        <span className="text-[9px] font-mono text-slate-500">
                                          Capa {layer.layerId} • {layer.serviceName}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleLayer(layer.id)}
                                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 shrink-0 cursor-pointer"
                                  />
                                </div>

                                {/* Intersection Alert Badge */}
                                {interStat?.intersects && (
                                  <div className="mt-1 pl-4.5 space-y-1">
                                    <span
                                      className={`inline-block text-[9.5px] font-bold px-2 py-0.5 rounded border ${interStat.badgeColor}`}
                                    >
                                      {interStat.badgeText}
                                    </span>

                                    {/* Clear applicability explanation */}
                                    <div className="text-[10px] bg-slate-950 p-1.5 rounded border border-slate-800 text-slate-300 leading-snug">
                                      {interStat.comoAplicar}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info with guidance */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1 text-amber-400">
          <span>💡 Clic en cada polígono para consultar sus condiciones y acuerdos</span>
        </span>
        <span className="text-slate-500">EPSG:9377</span>
      </div>
    </div>
  );
};
