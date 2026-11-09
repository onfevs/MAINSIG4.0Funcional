import React, { useState } from 'react';
import { X, MapPin, ShieldAlert, AlertTriangle, Layers, Database, ChevronRight, Sparkles } from 'lucide-react';
import { wgs84ToCTM12 } from '../services/clippingEngine';
import { AreaHabilSugerida } from '../types/mining';
import { LegalFrameworkPanel } from './LegalFrameworkPanel';
import { AreaHabilSummary } from './AreaHabilSummary';

export interface IntersectedFeature {
  capaNombre: string;
  categoria: 'EXCLUSION_A' | 'RESTRICCION_B' | 'TENENCIA_ANM' | 'ETNICOS' | 'HIDRICOS_SOCIALES' | 'BASE';
  atributos: Record<string, any>;
  color: string;
}

interface MapIdentifyPanelProps {
  clickedPoint: { lat: number; lng: number } | null;
  intersectedFeatures: IntersectedFeature[];
  onClose: () => void;
  areaHabil?: AreaHabilSugerida;
}

export const MapIdentifyPanel: React.FC<MapIdentifyPanelProps> = ({
  clickedPoint,
  intersectedFeatures,
  onClose,
  areaHabil,
}) => {
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<number>(0);

  if (!clickedPoint) return null;

  const ctm = wgs84ToCTM12(clickedPoint.lng, clickedPoint.lat);
  const selectedFeature = intersectedFeatures[selectedFeatureIndex];

  return (
    <div className="absolute top-4 right-4 z-30 w-80 sm:w-96 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[580px]">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white">Consulta Espacial Multicapa (Drill-Down)</h4>
            <p className="text-[10px] text-slate-400 font-mono">
              {intersectedFeatures.length} capa(s) intersectada(s)
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Coordinate HUD */}
      <div className="px-3.5 py-2 bg-slate-900/40 border-b border-slate-800/80 flex justify-between text-[10px] font-mono text-slate-300">
        <div>
          <span className="text-slate-500">WGS84: </span>
          <span className="text-amber-400 font-bold">{clickedPoint.lat.toFixed(5)}°, {clickedPoint.lng.toFixed(5)}°</span>
        </div>
        <div>
          <span className="text-slate-500">CTM12 X: </span>
          <span className="text-cyan-400 font-bold">{ctm.este.toLocaleString()} m</span>
        </div>
      </div>

      {/* Main Body */}
      {intersectedFeatures.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 space-y-2">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <p>No se encontraron capas o restricciones registradas en la coordenada seleccionada.</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* List of Intersected Layers */}
          <div className="p-2 border-b border-slate-800 bg-slate-950 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
            {intersectedFeatures.map((feat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFeatureIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition shrink-0 flex items-center space-x-1.5 ${
                  selectedFeatureIndex === idx
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: feat.color || '#f59e0b' }}
                ></span>
                <span className="max-w-[120px] truncate">{feat.capaNombre}</span>
              </button>
            ))}
          </div>

          {/* Selected Layer Attribute Details */}
          {selectedFeature && (
            <div className="p-3.5 flex-1 overflow-y-auto space-y-3">
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                    {selectedFeature.capaNombre}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedFeature.categoria}
                  </span>
                </div>
              </div>

              {/* Atributos Table */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Atributos Registrados
                </span>
                <div className="bg-slate-900/60 rounded-xl border border-slate-800 divide-y divide-slate-800/60 text-xs">
                  {Object.entries(selectedFeature.atributos)
                    .filter(([key]) => key !== 'OBJECTID' && key !== 'Shape' && key !== 'geometry')
                    .slice(0, 12)
                    .map(([key, val], i) => (
                      <div key={i} className="p-2 flex justify-between gap-2">
                        <span className="text-slate-400 font-mono text-[10px]">{key}:</span>
                        <span className="text-slate-200 font-semibold text-[11px] text-right break-words max-w-[180px]">
                          {val !== null && val !== undefined ? String(val) : 'N/A'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Área hábil sugerida + marco legal Ley 685 */}
      <div className="p-3 border-t border-slate-800 space-y-3 max-h-80 overflow-y-auto">
        <AreaHabilSummary areaHabil={areaHabil} compact />
        <LegalFrameworkPanel />
      </div>
    </div>
  );
};
