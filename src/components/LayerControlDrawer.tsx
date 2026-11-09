import React, { useState } from 'react';
import {
  Layers,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Building2,
  FileCheck,
  CheckSquare,
  Square,
  Info,
  X,
  Sparkles,
  MapPin,
  Lock,
} from 'lucide-react';
import { CATALOG_GROUPS, ANM_145_CATALOG_LAYERS, CatalogLayer } from '../services/anmCatalog';

interface LayerControlDrawerProps {
  activeLayerIds: Record<string, boolean>;
  onToggleLayer: (layerId: string, visible?: boolean) => void;
  onToggleAllGroup: (groupId: string, visible: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
  afectacionesCount: number;
  conflictos10kmCount: number;
}

export const LayerControlDrawer: React.FC<LayerControlDrawerProps> = ({
  activeLayerIds,
  onToggleLayer,
  onToggleAllGroup,
  isOpen,
  onClose,
  afectacionesCount,
  conflictos10kmCount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    EXCLUSION: true,
    RESTRICCION: true,
    TENENCIA: true,
    DISTRITOS: true,
    ETNICAS: true,
    CARTOGRAFIA: false,
  });

  if (!isOpen) return null;

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Filter catalog layers by search term
  const filteredLayers = ANM_145_CATALOG_LAYERS.filter((layer) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      layer.name.toLowerCase().includes(term) ||
      layer.code.toLowerCase().includes(term) ||
      layer.norma.toLowerCase().includes(term) ||
      layer.autoridad.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col font-sans transition-all duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center space-x-2.5">
          <Layers className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Controlador de Capas ANM & GIS
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                145+ Capas
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Vínculo de visibilidad por capas según el Código de Minas
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

      {/* Search Input Bar & Master Toggle Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/40 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar entre 145+ capas (páramos, títulos 10km, distritos...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono">
            {Object.values(activeLayerIds).filter(Boolean).length} / 145 Encendidas
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                CATALOG_GROUPS.forEach((g) => onToggleAllGroup(g.id, true));
              }}
              className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded font-bold transition"
            >
              Encender Todas
            </button>
            <button
              onClick={() => {
                CATALOG_GROUPS.forEach((g) => onToggleAllGroup(g.id, false));
              }}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition"
            >
              Apagar Todas
            </button>
          </div>
        </div>
      </div>

      {/* Layers Catalog Groups */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
        {CATALOG_GROUPS.map((group) => {
          const groupLayers = filteredLayers.filter((l) => l.group === group.id);
          if (groupLayers.length === 0) return null;

          const isExpanded = expandedGroups[group.id];
          const activeInGroupCount = groupLayers.filter((l) => activeLayerIds[l.id]).length;
          const allActive = activeInGroupCount === groupLayers.length;

          return (
            <div
              key={group.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition"
            >
              {/* Group Accordion Header */}
              <div
                onClick={() => toggleGroupExpand(group.id)}
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition select-none"
              >
                <div className="flex items-center space-x-2 shrink min-w-0">
                  <button className="text-slate-400 hover:text-white transition">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{group.title}</h4>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border ${group.badgeColor} font-semibold inline-block mt-0.5`}>
                      {group.badge}
                    </span>
                  </div>
                </div>

                {/* Group Master Toggle Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeInGroupCount}/{groupLayers.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAllGroup(group.id, !allActive);
                    }}
                    className="p-1 text-slate-400 hover:text-amber-400 transition"
                    title={allActive ? 'Desactivar todo el grupo' : 'Activar todo el grupo'}
                  >
                    {allActive ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Group Layer Items */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-950/60 p-2 space-y-1.5 divide-y divide-slate-800/40">
                  {groupLayers.map((layer) => {
                    const isChecked = Boolean(activeLayerIds[layer.id]);

                    return (
                      <div
                        key={layer.id}
                        className="pt-1.5 first:pt-0 flex items-start justify-between gap-2 text-xs group hover:bg-slate-900/40 p-1.5 rounded-lg transition"
                      >
                        <div className="space-y-0.5 shrink min-w-0">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`chk-${layer.id}`}
                              checked={isChecked}
                              disabled={layer.siempreActiva}
                              onChange={(e) => onToggleLayer(layer.id, e.target.checked)}
                              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer disabled:opacity-50"
                            />
                            <label
                              htmlFor={`chk-${layer.id}`}
                              className="font-bold text-slate-200 cursor-pointer hover:text-amber-400 transition truncate"
                            >
                              {layer.name}
                            </label>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pl-6 text-[10px] text-slate-400">
                            <span className="font-mono text-amber-400 font-semibold">{layer.code}</span>
                            <span>•</span>
                            <span className="text-slate-300">{layer.norma}</span>
                            {layer.esExclusiva && (
                              <span className="bg-rose-950 text-rose-300 border border-rose-800 px-1 py-0.2 rounded font-bold">
                                Exclusión Absoluta
                              </span>
                            )}
                            {layer.siempreActiva && (
                              <span className="bg-teal-950 text-teal-300 border border-teal-800 px-1 py-0.2 rounded font-bold flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Siempre Activo
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 pl-6 leading-tight line-clamp-2">
                            {layer.descripcion}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Drawer Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Capas dinámicas de AnnA Minería REST & RUNAP</span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-400 transition"
        >
          Aplicar y Ver Mapa
        </button>
      </div>
    </div>
  );
};
