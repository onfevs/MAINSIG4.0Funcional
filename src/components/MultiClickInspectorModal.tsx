import React from 'react';
import {
  X,
  MapPin,
  Layers,
  ShieldAlert,
  Building2,
  FileText,
  Compass,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export interface MultiClickFeatureResult {
  layerGroupTitle: string;
  category: 'A' | 'B' | 'TENENCIA' | 'DISTRITO' | 'ETNICA' | 'BASE';
  layerName: string;
  properties: Record<string, any>;
  normaLegal?: string;
  autoridad?: string;
}

interface MultiClickInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  latLng: { lat: number; lng: number } | null;
  features: MultiClickFeatureResult[];
}

export const MultiClickInspectorModal: React.FC<MultiClickInspectorModalProps> = ({
  isOpen,
  onClose,
  latLng,
  features,
}) => {
  if (!isOpen || !latLng) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-[460px] bg-slate-950/95 backdrop-blur-xl border-r border-slate-800 shadow-2xl flex flex-col font-sans transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <MapPin className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Inspección de Coordenadas
              <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-extrabold font-mono">
                {features.length} Capas Intersectadas
              </span>
            </h3>
            <p className="text-[11px] font-mono text-amber-400/90">
              WGS84: {latLng.lat.toFixed(5)}°, {latLng.lng.toFixed(5)}°
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {features.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Compass className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-xs">No se detectaron restricciones ni títulos en este punto específico.</p>
          </div>
        ) : (
          features.map((item, idx) => {
            const p = item.properties;

            return (
              <div
                key={idx}
                className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2 shadow-lg"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                      item.category === 'A'
                        ? 'bg-red-500/20 text-rose-300 border border-red-500/30'
                        : item.category === 'B'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : item.category === 'DISTRITO'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {item.layerGroupTitle}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Capa #{idx + 1}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{item.layerName}</span>
                </h4>

                {item.normaLegal && (
                  <p className="text-[11px] text-slate-300">
                    <strong className="text-slate-400">Norma Legal:</strong> {item.normaLegal}
                  </p>
                )}

                {/* Attributes Table */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-[11px] space-y-1 font-mono text-slate-300 overflow-x-auto">
                  {Object.entries(p).map(([key, val]) => {
                    if (val === null || val === undefined || typeof val === 'object') return null;
                    return (
                      <div key={key} className="flex justify-between gap-2 border-b border-slate-900 py-0.5 last:border-0">
                        <span className="text-slate-500 font-semibold">{key}:</span>
                        <span className="text-slate-200 text-right truncate max-w-[220px]">{String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90 text-xs flex justify-between items-center">
        <span className="text-slate-400 text-[11px]">Proyección Oficial EPSG:9377 (CTM12)</span>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition"
        >
          Cerrar Inspección
        </button>
      </div>
    </div>
  );
};
