/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useReducer, useCallback, useMemo, useRef } from 'react';
import {
  FileText,
  Map as MapIcon,
  ShieldAlert,
  TrendingDown,
  Scale,
  Terminal,
  Download,
  Database,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { Header } from './components/Header';
import { PlacaSearchPanel } from './components/PlacaSearchPanel';
import { InteractiveMap } from './components/InteractiveMap';
import { ExecutiveSummaryTab } from './components/ExecutiveSummaryTab';
import { EnvironmentalRestrictionsTab } from './components/EnvironmentalRestrictionsTab';
import { RESTRICTIVE_LAYER_IDS } from './services/legalFramework';
import { MiningConflictsTab } from './components/MiningConflictsTab';
import { LegalEngineTab } from './components/LegalEngineTab';
import { TechnicalAuditTab } from './components/TechnicalAuditTab';
import { ServiceCatalogModal } from './components/ServiceCatalogModal';
import { ExportModal } from './components/ExportModal';
import * as turf from '@turf/turf';

import { EvaluationResult, UserRole } from './types/mining';
import { evaluateMiningArea } from './services/gisEngine';
import { OFFICIAL_BENCHMARKS } from './services/officialBenchmarks';
import { exportGeoJson } from './services/reportGenerator';

type TabType = 'summary' | 'map' | 'environmental' | 'mining' | 'legal' | 'audit';

interface AppState {
  userRole: UserRole;
  activeTab: TabType;
  evaluation: EvaluationResult | null;
  isEvaluating: boolean;
  evaluationStep: string;
  isServiceModalOpen: boolean;
  isExportModalOpen: boolean;
  mapImageDataUrl: string;
  pendingFocusLayer: string | null;
}

type AppAction =
  | { type: 'SET_USER_ROLE'; payload: UserRole }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_EVALUATION'; payload: EvaluationResult | null }
  | { type: 'SET_EVALUATING'; payload: boolean }
  | { type: 'SET_EVALUATION_STEP'; payload: string }
  | { type: 'TOGGLE_SERVICE_MODAL'; payload?: boolean }
  | { type: 'TOGGLE_EXPORT_MODAL'; payload?: boolean }
  | { type: 'SET_MAP_IMAGE_URL'; payload: string }
  | { type: 'SET_PENDING_FOCUS_LAYER'; payload: string | null };

const initialState: AppState = {
  userRole: 'sig_specialist',
  activeTab: 'summary',
  evaluation: null,
  isEvaluating: false,
  evaluationStep: '',
  isServiceModalOpen: false,
  isExportModalOpen: false,
  mapImageDataUrl: '',
  pendingFocusLayer: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER_ROLE':
      return { ...state, userRole: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_EVALUATION':
      return { ...state, evaluation: action.payload };
    case 'SET_EVALUATING':
      return { ...state, isEvaluating: action.payload };
    case 'SET_EVALUATION_STEP':
      return { ...state, evaluationStep: action.payload };
    case 'TOGGLE_SERVICE_MODAL':
      return { ...state, isServiceModalOpen: action.payload ?? !state.isServiceModalOpen };
    case 'TOGGLE_EXPORT_MODAL':
      return { ...state, isExportModalOpen: action.payload ?? !state.isExportModalOpen };
    case 'SET_MAP_IMAGE_URL':
      return { ...state, mapImageDataUrl: action.payload };
    case 'SET_PENDING_FOCUS_LAYER':
      return { ...state, pendingFocusLayer: action.payload };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const focusLayerRef = useRef<(layerId: string) => void>(() => {});

  const handleFocusLayerReady = useCallback((fn: (layerId: string) => void) => {
    focusLayerRef.current = fn;
  }, []);

  // Initialize with IJN-11331 (Official active concession in Antioquia requested by user)
  useEffect(() => {
    const defaultCase = OFFICIAL_BENCHMARKS.find((b) => b.codigoExpediente === 'IJN-11331') || OFFICIAL_BENCHMARKS[0];
    const initialResult = evaluateMiningArea(defaultCase.geojsonPolygon, defaultCase.codigoExpediente, state.userRole);
    dispatch({ type: 'SET_EVALUATION', payload: initialResult });
  }, []);

  const handleEvaluate = useCallback(async (fallbackGeometry: any, code: string) => {
    dispatch({ type: 'SET_EVALUATING', payload: true });
    dispatch({ type: 'SET_EVALUATION_STEP', payload: 'Conectando a TenureLayers de AnnA Minería (Capas 3, 4 y 5)...' });

    try {
      // 1. Query live AnnA Minería REST backend endpoint
      const tenureResp = await fetch('/api/anm/search-tenure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      let liveTenure: any = null;
      if (tenureResp.ok) {
        liveTenure = await tenureResp.json();
      }

      dispatch({ type: 'SET_EVALUATION_STEP', payload: 'Consultando Áreas Excluibles y Restringidas (Exclusive_Restriction/MapServer)...' });

      let targetFeature: any = null;
      let bbox: any = null;

      if (liveTenure && liveTenure.found && liveTenure.geometry) {
        targetFeature = {
          type: 'Feature',
          properties: liveTenure.attributes,
          geometry: liveTenure.geometry,
        };
      } else {
        targetFeature = fallbackGeometry;
      }

      // Calculate exact bbox using Turf for any geometry (Polygon, MultiPolygon, Shapefile)
      try {
        const b = turf.bbox(targetFeature);
        if (b && b.length === 4 && !isNaN(b[0])) {
          bbox = { minX: b[0], minY: b[1], maxX: b[2], maxY: b[3] };
        }
      } catch (errBbox) {
        console.warn('Could not compute bbox with turf:', errBbox);
      }

      dispatch({ type: 'SET_EVALUATION_STEP', payload: 'Cruzando con Páramos Delimitados, SINAP, Ley 2da y Centros Poblados...' });

      let liveRestrictions: any = null;
      if (bbox) {
        try {
          const restrResp = await fetch('/api/anm/query-restrictions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bbox, extraLayers: RESTRICTIVE_LAYER_IDS }),
          });
          if (restrResp.ok) {
            liveRestrictions = await restrResp.json();
          }
        } catch (e) {
          console.warn('Error fetching live restrictions, using preloaded baseline', e);
        }
      }

      dispatch({ type: 'SET_EVALUATION_STEP', payload: 'Calculando intersecciones, áreas en CTM12 y balance jurídico...' });

      const result = evaluateMiningArea(targetFeature, code, state.userRole, liveRestrictions);
      dispatch({ type: 'SET_EVALUATION', payload: result });
    } catch (err) {
      console.error('Error during live ANM evaluation:', err);
      // Fallback to local verified evaluator
      const result = evaluateMiningArea(fallbackGeometry, code, state.userRole);
      dispatch({ type: 'SET_EVALUATION', payload: result });
    } finally {
      dispatch({ type: 'SET_EVALUATING', payload: false });
      dispatch({ type: 'SET_EVALUATION_STEP', payload: '' });
    }
  }, [state.userRole]);

  const handleRoleChange = useCallback((role: UserRole) => {
    dispatch({ type: 'SET_USER_ROLE', payload: role });
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  const handleTabChangeWithFocus = useCallback((tab: TabType, layerId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    if (layerId) {
      dispatch({ type: 'SET_PENDING_FOCUS_LAYER', payload: layerId });
    }
  }, []);

  const handleOpenServices = useCallback(() => {
    dispatch({ type: 'TOGGLE_SERVICE_MODAL', payload: true });
  }, []);

  const handleOpenExport = useCallback(() => {
    dispatch({ type: 'TOGGLE_EXPORT_MODAL', payload: true });
  }, []);

  const handleCloseServiceModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_SERVICE_MODAL', payload: false });
  }, []);

  const handleCloseExportModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_EXPORT_MODAL', payload: false });
  }, []);

  const handleCaptureMapImage = useCallback((url: string) => {
    dispatch({ type: 'SET_MAP_IMAGE_URL', payload: url });
  }, []);

  const handleExportGeoJson = useCallback(() => {
    if (state.evaluation) {
      exportGeoJson(state.evaluation);
    }
  }, [state.evaluation]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        userRole={state.userRole}
        onRoleChange={handleRoleChange}
        onOpenServices={handleOpenServices}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search and Input Module */}
        <PlacaSearchPanel
          onEvaluate={handleEvaluate}
          isEvaluating={state.isEvaluating}
          evaluationStep={state.evaluationStep}
        />

        {/* Results Section */}
        {state.evaluation && (
          <div className="space-y-4">
            {/* Navigation Tabs and Top Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                  onClick={() => handleTabChange('summary')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap snap-start shrink-0 ${
                    state.activeTab === 'summary'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  aria-label="Ver resumen ejecutivo"
                  aria-current={state.activeTab === 'summary' ? 'page' : undefined}
                >
                  <FileText className="w-4 h-4" />
                  <span>Resumen Ejecutivo</span>
                </button>

                <button
                  onClick={() => handleTabChange('map')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap snap-start shrink-0 ${
                    state.activeTab === 'map'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  aria-label="Ver mapa interactivo GIS"
                  aria-current={state.activeTab === 'map' ? 'page' : undefined}
                >
                  <MapIcon className="w-4 h-4" />
                  <span>Mapa Interactivo GIS</span>
                </button>

                <button
                  onClick={() => handleTabChange('environmental')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap snap-start shrink-0 ${
                    state.activeTab === 'environmental'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  aria-label="Ver restricciones ambientales"
                  aria-current={state.activeTab === 'environmental' ? 'page' : undefined}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Restricciones Ambientales</span>
                  {state.evaluation.afectacionesAmbientales.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/40 font-mono">
                      {state.evaluation.afectacionesAmbientales.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange('mining')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap snap-start shrink-0 ${
                    state.activeTab === 'mining'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  aria-label="Ver restricciones mineras"
                  aria-current={state.activeTab === 'mining' ? 'page' : undefined}
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>Restricciones Mineras</span>
                  {state.evaluation.conflictosMineros.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/40 font-mono">
                      {state.evaluation.conflictosMineros.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange('legal')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap snap-start shrink-0 ${
                    state.activeTab === 'legal'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  aria-label="Ver motor jurídico"
                  aria-current={state.activeTab === 'legal' ? 'page' : undefined}
                >
                  <Scale className="w-4 h-4" />
                  <span>Motor Jurídico</span>
                </button>

                <button
                  onClick={() => handleTabChange('audit')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap snap-start shrink-0 ${
                    state.activeTab === 'audit'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  aria-label="Ver informe técnico"
                  aria-current={state.activeTab === 'audit' ? 'page' : undefined}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Informe Técnico</span>
                </button>
              </div>

              {/* Reports Download Button */}
              <button
                onClick={handleOpenExport}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition shrink-0"
                aria-label="Generar informes PDF y Excel"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Generar Informes (PDF / Excel)</span>
                <span className="sm:hidden">Exportar</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="pt-2">
              <div className="animate-fade-in" key={state.activeTab}>
                {state.activeTab === 'summary' && <ExecutiveSummaryTab evaluation={state.evaluation} onFocusLayer={focusLayerRef.current} onTabChange={handleTabChangeWithFocus} />}
                {state.activeTab === 'map' && (
                  <InteractiveMap
                    evaluation={state.evaluation}
                    onExportGeoJson={handleOpenExport}
                    onCaptureMapImage={handleCaptureMapImage}
                    onFocusLayer={handleFocusLayerReady}
                    onFocusLayerComplete={() => dispatch({ type: 'SET_PENDING_FOCUS_LAYER', payload: null })}
                    pendingFocusLayer={state.pendingFocusLayer}
                  />
                )}
                {state.activeTab === 'environmental' && (
                  <EnvironmentalRestrictionsTab afectaciones={state.evaluation.afectacionesAmbientales} />
                )}
                {state.activeTab === 'mining' && (
                  <MiningConflictsTab conflictos={state.evaluation.conflictosMineros} areaHabil={state.evaluation.areaHabilSugerida} />
                )}
                {state.activeTab === 'legal' && <LegalEngineTab />}
                {state.activeTab === 'audit' && <TechnicalAuditTab evaluation={state.evaluation} />}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            MINERÍA LEGAL GIS COLOMBIA © 2026 • Sistema de Apoyo a la Decisión Minero-Ambiental
          </p>
          <p className="flex items-center gap-1 font-mono text-[11px]">
            <span>Proyección Oficial: EPSG:9377 (CTM12)</span>
            <span>•</span>
            <span>AnnA Minería REST</span>
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ServiceCatalogModal
        isOpen={state.isServiceModalOpen}
        onClose={handleCloseServiceModal}
      />

      <ExportModal
        isOpen={state.isExportModalOpen}
        onClose={handleCloseExportModal}
        evaluation={state.evaluation}
        mapImageDataUrl={state.mapImageDataUrl}
      />
    </div>
  );
}
