import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Layers,
  Maximize2,
  Download,
  Map as MapIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { EvaluationResult } from '../types/mining';
import { MapController } from '../services/mapController';
import { LayerCatalogPanel } from './LayerCatalogPanel';
import { LegalFrameworkPanel } from './LegalFrameworkPanel';
import { AreaHabilSummary } from './AreaHabilSummary';

interface InteractiveMapProps {
  evaluation: EvaluationResult | null;
  onExportGeoJson: () => void;
  onCaptureMapImage?: (url: string) => void;
  onFocusLayer?: (layerId: string) => void;
  onFocusLayerComplete?: () => void;
  pendingFocusLayer?: string | null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  evaluation,
  onExportGeoJson,
  onCaptureMapImage,
  onFocusLayer,
  onFocusLayerComplete,
  pendingFocusLayer,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapControllerRef = useRef<MapController | null>(null);

  const [activeBaseMap, setActiveBaseMap] = useState<'satellite' | 'dark' | 'topo'>('satellite');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [activeLayersCount, setActiveLayersCount] = useState<number>(9);
  const [isBasePolygonVisible, setIsBasePolygonVisible] = useState<boolean>(true);

  // 1. Decoupled Map & Layer Initialization (Executes ONCE on mount)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const controller = new MapController(mapContainerRef.current);
    controller.initMap();
    mapControllerRef.current = controller;

    // Subscribe to active layer state changes
    const unsubscribe = controller.subscribe((activeSet) => {
      setActiveLayersCount(activeSet.size);
      setIsBasePolygonVisible(activeSet.has('eval-base-polygon'));
    });

    // If an initial evaluation is already available on mount, populate it
    if (evaluation) {
      controller.updateEvaluation(evaluation);
    }

    return () => {
      unsubscribe();
      controller.destroy();
      mapControllerRef.current = null;
    };
  }, []);

  // 2. Decoupled Evaluation Update (Updates features ONLY, never re-initializing map or catalog)
  useEffect(() => {
    if (mapControllerRef.current) {
      mapControllerRef.current.updateEvaluation(evaluation);
    }
  }, [evaluation]);

  // Base map switcher
  const handleBaseMapChange = useCallback((type: 'satellite' | 'dark' | 'topo') => {
    setActiveBaseMap(type);
    mapControllerRef.current?.setBaseMap(type);
  }, []);

  // Center button
  const handleCenter = useCallback(() => {
    mapControllerRef.current?.fitEvaluationBounds();
  }, []);

  // Master Toggle for the Evaluated / Consulted Polygon
  const handleToggleBasePolygon = useCallback(() => {
    if (mapControllerRef.current) {
      mapControllerRef.current.toggleLayer('eval-base-polygon');
    }
  }, []);

  // Focus a specific layer on the map
  const handleFocusLayer = useCallback((layerId: string) => {
    if (mapControllerRef.current) {
      mapControllerRef.current.focusLayer(layerId);
    }
  }, []);

  // Expose focusLayer to parent via callback
  useEffect(() => {
    if (onFocusLayer) {
      onFocusLayer(handleFocusLayer);
    }
  }, [handleFocusLayer, onFocusLayer]);

  // Execute pending focus layer when map is ready
  useEffect(() => {
    if (pendingFocusLayer && mapControllerRef.current) {
      mapControllerRef.current.focusLayer(pendingFocusLayer);
      if (onFocusLayerComplete) {
        onFocusLayerComplete();
      }
    }
  }, [pendingFocusLayer, onFocusLayerComplete]);

  const exclCount = evaluation?.geometriasCortes?.exclusionesGeoJSON?.features?.length || 0;
  const restrCount = evaluation?.geometriasCortes?.restringidasGeoJSON?.features?.length || 0;
  const distritosCount = evaluation?.geometriasCortes?.distritosMinerosGeoJSON?.features?.length || 0;
  const titulosCount = evaluation?.geometriasCortes?.titulosCircundantesGeoJSON?.features?.length || 0;

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px] sm:h-[680px] select-none">
      {/* Top Map Control Bar */}
      <div className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <MapIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-200 truncate">
                Visor SIG Oficial: Catálogo Integral y Evaluación
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono shrink-0">
                EPSG:9377 / WGS84
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              145+ Capas ANM, 119 Distritos Mineros y Determinantes Ambientales
            </p>
          </div>
        </div>

        {/* Center / Actions Bar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Master Toggle for Loaded / Consulted Polygon */}
          <button
            onClick={handleToggleBasePolygon}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition shadow-sm min-h-[44px] ${
              isBasePolygonVisible
                ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 border-sky-400 shadow-sky-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={
              isBasePolygonVisible
                ? 'Ocultar el polígono de la concesión o propuesta evaluada'
                : 'Mostrar el polígono de la concesión o propuesta evaluada'
            }
            aria-label={isBasePolygonVisible ? 'Ocultar polígono evaluado' : 'Mostrar polígono evaluado'}
          >
            {isBasePolygonVisible ? (
              <Eye className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className="hidden sm:inline">Polígono Evaluado:</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase ${
                isBasePolygonVisible ? 'bg-slate-950 text-sky-300 font-extrabold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isBasePolygonVisible ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Base Map Style Toggles */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => handleBaseMapChange('satellite')}
              className={`px-2.5 py-2 rounded transition min-h-[36px] ${
                activeBaseMap === 'satellite'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Vista satelital"
            >
              Satélite
            </button>
            <button
              onClick={() => handleBaseMapChange('dark')}
              className={`px-2.5 py-2 rounded transition min-h-[36px] ${
                activeBaseMap === 'dark'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Vista oscura GIS"
            >
              Oscuro GIS
            </button>
            <button
              onClick={() => handleBaseMapChange('topo')}
              className={`px-2.5 py-2 rounded transition min-h-[36px] ${
                activeBaseMap === 'topo'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Vista topográfica"
            >
              Topográfico
            </button>
          </div>

          {/* Toggle Full Layer Catalog Panel */}
          <button
            onClick={() => setIsCatalogOpen(!isCatalogOpen)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition min-h-[44px] ${
              isCatalogOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Abrir catálogo jerárquico de capas Código de Minas"
            aria-label={isCatalogOpen ? 'Cerrar catálogo de capas' : 'Abrir catálogo de capas'}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Capas ({activeLayersCount})</span>
          </button>

          {/* Centrar */}
          <button
            onClick={handleCenter}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition min-h-[44px]"
            title="Centrar en el polígono evaluado"
            aria-label="Centrar mapa en polígono evaluado"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Centrar</span>
          </button>

          {/* Export GeoJSON */}
          <button
            onClick={onExportGeoJson}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition min-h-[44px]"
            title="Descargar capas en formato GeoJSON"
            aria-label="Exportar GeoJSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Exportar GeoJSON</span>
            <span className="sm:hidden">Exportar</span>
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full relative z-0"></div>

      {/* Área hábil sugerida + Marco legal Ley 685 (panel flotante) */}
      <div className="absolute top-[76px] right-4 z-10 w-80 max-w-[calc(100%-2rem)] flex flex-col items-end gap-2">
        <button
          onClick={() => setIsLegalOpen((v) => !v)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-950/90 backdrop-blur-md border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 rounded-xl shadow-xl text-xs font-semibold transition"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Área hábil y marco legal</span>
        </button>
        {isLegalOpen && (
          <div className="w-full max-h-[480px] overflow-y-auto bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl space-y-3">
            <AreaHabilSummary areaHabil={evaluation?.areaHabilSugerida} compact />
            <LegalFrameworkPanel />
          </div>
        )}
      </div>

      {/* Decoupled Hierarchical Layer Catalog Panel */}
      <LayerCatalogPanel
        mapController={mapControllerRef.current}
        evaluation={evaluation}
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
      />

      {/* Floating Quick Action Bar (Bottom Left) */}
      {!isCatalogOpen && (
        <div className="absolute bottom-4 left-4 z-10 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          {/* Quick Toggle Polígono Evaluado */}
          <button
            onClick={handleToggleBasePolygon}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl backdrop-blur-md border text-xs font-semibold shadow-xl transition min-h-[44px] ${
              isBasePolygonVisible
                ? 'bg-sky-950/90 border-sky-500/80 text-sky-300 hover:bg-sky-900/90'
                : 'bg-slate-950/90 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Encender / Apagar Polígono Evaluado"
            aria-label={isBasePolygonVisible ? 'Ocultar polígono base' : 'Mostrar polígono base'}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isBasePolygonVisible ? 'bg-sky-400 shadow-sm shadow-sky-400' : 'bg-slate-600'
              }`}
            ></span>
            <span className="hidden sm:inline">Polígono Base: {isBasePolygonVisible ? 'ON' : 'OFF'}</span>
            <span className="sm:hidden">Base: {isBasePolygonVisible ? 'ON' : 'OFF'}</span>
          </button>

          {/* Open Catalog */}
          <button
            onClick={() => setIsCatalogOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 hover:border-amber-500 text-slate-200 hover:text-white rounded-xl shadow-xl text-xs font-semibold transition group min-h-[44px]"
            aria-label="Abrir catálogo de capas"
          >
            <Layers className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
            <span className="hidden sm:inline">Capas Intersectadas y Catálogo</span>
            <span className="sm:hidden">Capas</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              {activeLayersCount} activas
            </span>
          </button>
        </div>
      )}

      {/* Floating Evaluation Info Badge (Bottom Right) */}
      {evaluation && (
        <div className="absolute bottom-4 right-4 z-10 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-2xl text-xs flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 max-w-[calc(100%-2rem)] sm:max-w-none">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Expediente / Placa</p>
            <p className="font-mono font-bold text-amber-400 text-sm">
              {evaluation.metadata.codigoExpediente}
            </p>
          </div>
          <div className="hidden sm:block h-7 w-px bg-slate-800"></div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Escala Minera</p>
            <p className="font-mono font-bold text-slate-200">
              {evaluation.metadata.clasificacionMinera} Minería
            </p>
          </div>
          <div className="hidden sm:block h-7 w-px bg-slate-800"></div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Superposiciones</p>
            <div className="flex items-center space-x-1.5 text-[11px] font-mono">
              <span className="text-rose-400 font-bold" title="Exclusiones Cat. A">{exclCount} Excl</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-bold" title="Restricciones Cat. B">{restrCount} Restr</span>
              <span className="text-slate-600">•</span>
              <span className="text-teal-400 font-bold" title="Distritos Mineros (Dec 044)">{distritosCount > 0 ? 'Distrito' : 'Nacional'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-purple-400 font-bold" title="Títulos Circundantes">{titulosCount} Tít</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
