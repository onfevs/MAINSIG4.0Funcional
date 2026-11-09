import React, { useState } from 'react';
import { Layers, X, Eye, EyeOff, Sliders, ShieldAlert, AlertTriangle, MapPin, Database, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';

export interface LayerConfig {
  id: string;
  nombre: string;
  categoria: 'EXCLUSION_A' | 'RESTRICCION_B' | 'TENENCIA_ANM' | 'ETNICOS' | 'HIDRICOS_SOCIALES' | 'BASE';
  visible: boolean;
  opacity: number; // 0 to 1
  color: string;
  descripcion: string;
  registrosCount?: number;
}

interface LayerCatalogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  layers: LayerConfig[];
  onToggleLayer: (id: string, visible: boolean) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onResetLayers: () => void;
}

export const LayerCatalogDrawer: React.FC<LayerCatalogDrawerProps> = ({
  isOpen,
  onClose,
  layers,
  onToggleLayer,
  onChangeOpacity,
  onResetLayers,
}) => {
  const [openAccordion, setOpenAccordion] = useState<string>('EXCLUSION_A');

  if (!isOpen) return null;

  const categories: { id: LayerConfig['categoria']; title: string; icon: React.ReactNode; colorClass: string }[] = [
    { id: 'EXCLUSION_A', title: 'Exclusiones Absolutas (Cat. A)', icon: <ShieldAlert className="w-4 h-4 text-rose-500" />, colorClass: 'border-rose-500/30 bg-rose-500/10 text-rose-300' },
    { id: 'RESTRICCION_B', title: 'Restricciones Condicionadas (Cat. B)', icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, colorClass: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
    { id: 'TENENCIA_ANM', title: 'Tenencia y Solicitudes Mineras (ANM)', icon: <Database className="w-4 h-4 text-purple-400" />, colorClass: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
    { id: 'ETNICOS', title: 'Territorios Étnicos y Comunidades', icon: <Sparkles className="w-4 h-4 text-emerald-400" />, colorClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
    { id: 'HIDRICOS_SOCIALES', title: 'Recursos Hídricos y Arqueología', icon: <MapPin className="w-4 h-4 text-cyan-400" />, colorClass: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' },
    { id: 'BASE', title: 'Cartografía Base y Límites', icon: <Layers className="w-4 h-4 text-sky-400" />, colorClass: 'border-sky-500/30 bg-sky-500/10 text-sky-300' },
  ];

  const visibleCount = layers.filter((l) => l.visible).length;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Catálogo de 22+ Capas AnnA</h3>
            <p className="text-[11px] text-slate-400">
              Activas: <span className="text-amber-400 font-bold font-mono">{visibleCount}</span> / {layers.length} capas
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onResetLayers}
            className="px-2 py-1 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
            title="Restablecer visibilidad predeterminada"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Layer Accordion List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {categories.map((cat) => {
          const catLayers = layers.filter((l) => l.categoria === cat.id);
          const isAccordionOpen = openAccordion === cat.id;
          const activeInCat = catLayers.filter((l) => l.visible).length;

          return (
            <div key={cat.id} className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              {/* Accordion Trigger */}
              <button
                onClick={() => setOpenAccordion(isAccordionOpen ? '' : cat.id)}
                className="w-full p-3 flex items-center justify-between hover:bg-slate-800/60 transition text-left"
              >
                <div className="flex items-center space-x-2.5">
                  {cat.icon}
                  <span className="text-xs font-bold text-slate-200">{cat.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${cat.colorClass}`}>
                    {activeInCat}/{catLayers.length}
                  </span>
                  {isAccordionOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Accordion Content */}
              {isAccordionOpen && (
                <div className="p-2.5 border-t border-slate-800/80 space-y-2 bg-slate-950/40">
                  {catLayers.map((layer) => (
                    <div
                      key={layer.id}
                      className={`p-2.5 rounded-lg border transition ${
                        layer.visible
                          ? 'bg-slate-900 border-slate-700'
                          : 'bg-slate-950/80 border-slate-800/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 border border-black/30 shadow-sm"
                            style={{ backgroundColor: layer.color }}
                          ></span>
                          <span className="text-xs font-semibold text-slate-100 truncate" title={layer.nombre}>
                            {layer.nombre}
                          </span>
                        </div>
                        <button
                          onClick={() => onToggleLayer(layer.id, !layer.visible)}
                          className={`p-1 rounded transition shrink-0 ${
                            layer.visible
                              ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
                        >
                          {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-1 leading-tight">{layer.descripcion}</p>

                      {/* Opacity Slider */}
                      {layer.visible && (
                        <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                            <Sliders className="w-3 h-3 text-slate-400" /> Opacidad
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={layer.opacity}
                            onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                            className="w-28 accent-amber-500 h-1 bg-slate-800 rounded cursor-pointer"
                          />
                          <span className="text-[10px] font-mono text-amber-400 font-bold w-8 text-right">
                            {Math.round(layer.opacity * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80 text-[11px] text-slate-400 text-center font-mono">
        Conexión directa: MapServer ANM & MADS
      </div>
    </div>
  );
};
