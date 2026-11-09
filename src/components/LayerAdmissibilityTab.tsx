import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Scale,
  Search,
  Filter,
  FileCheck,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { EvaluationResult, LayerAdmissibilityItem, CanClaimStatus } from '../types/mining';
import { AreaHabilSummary } from './AreaHabilSummary';

interface LayerAdmissibilityTabProps {
  evaluation: EvaluationResult;
}

export const LayerAdmissibilityTab: React.FC<LayerAdmissibilityTabProps> = ({ evaluation }) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | CanClaimStatus | 'INTERSECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<LayerAdmissibilityItem | null>(null);

  const items = evaluation.admisibilidadPorCapa || [];

  const noCount = items.filter((i) => i.sePuedePedir === 'NO_EXCLUSION').length;
  const condCount = items.filter((i) => i.sePuedePedir === 'CONDICIONADO').length;
  const siCount = items.filter((i) => i.sePuedePedir === 'SI_LIBRE').length;
  const intersectedCount = items.filter((i) => i.concurreConPoligono).length;

  const filteredItems = items.filter((item) => {
    if (filterStatus === 'INTERSECTED' && !item.concurreConPoligono) return false;
    if (filterStatus !== 'ALL' && filterStatus !== 'INTERSECTED' && item.sePuedePedir !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.nombreCapa.toLowerCase().includes(q) ||
        item.categoriaAnnA.toLowerCase().includes(q) ||
        item.fundamentoJuridico.toLowerCase().includes(q) ||
        item.motivoJuridico.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <AreaHabilSummary areaHabil={evaluation.areaHabilSugerida} />

      {/* Top Banner / Explanation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 via-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PROYECCIÓN JURÍDICA INTEGRAL • CÓDIGO DE MINAS LEY 685 DE 2001
              </span>
              <span className="text-xs text-slate-400 font-mono">
                15+ Capas Oficiales AnnA Minería
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Scale className="w-6 h-6 text-amber-400" />
              ¿Se Puede Pedir? — Matriz de Admisibilidad y Restricciones por Capa
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Dictamen jurídico automatizado que evalúa cada una de las capas del catálogo oficial de la Agencia Nacional de Minería (ANM) cruzadas con el polígono. Indica taxativamente si una zona es <strong>admisible para radicar propuesta</strong>, si está <strong>sujeta a trámite condicionante previo</strong>, o si constituye una <strong>causal de exclusión legal absoluta</strong>.
            </p>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-red-950/60 border border-red-800/80 rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] uppercase font-bold text-red-300">🚫 No Se Puede Pedir</p>
              <p className="text-xl font-black text-red-400">{noCount}</p>
              <p className="text-[9px] text-red-400/80">Exclusiones Absolutas</p>
            </div>
            <div className="bg-amber-950/60 border border-amber-800/80 rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] uppercase font-bold text-amber-300">⚠️ Condicionado</p>
              <p className="text-xl font-black text-amber-400">{condCount}</p>
              <p className="text-[9px] text-amber-400/80">Trámite Habilitante</p>
            </div>
            <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-300">✅ Sí Se Puede Pedir</p>
              <p className="text-xl font-black text-emerald-400">{siCount}</p>
              <p className="text-[9px] text-emerald-400/80">Susceptible / Libre</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              filterStatus === 'ALL'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Todas ({items.length})
          </button>
          <button
            onClick={() => setFilterStatus('INTERSECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'INTERSECTED'
                ? 'bg-sky-600 text-white shadow'
                : 'text-sky-400 hover:text-sky-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Superpuestas con el Polígono ({intersectedCount})
          </button>
          <button
            onClick={() => setFilterStatus('NO_EXCLUSION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'NO_EXCLUSION'
                ? 'bg-red-600 text-white shadow'
                : 'text-red-400 hover:text-red-300 hover:bg-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            No se puede pedir ({noCount})
          </button>
          <button
            onClick={() => setFilterStatus('CONDICIONADO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'CONDICIONADO'
                ? 'bg-amber-600 text-white shadow'
                : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Condicionado ({condCount})
          </button>
          <button
            onClick={() => setFilterStatus('SI_LIBRE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === 'SI_LIBRE'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sí se puede pedir ({siCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por capa, norma o artículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Main Table / Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          {filteredItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`bg-slate-900 border rounded-xl p-4 transition cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-amber-500 ring-1 ring-amber-500/50 bg-slate-850'
                    : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                {/* Left Colored Accent Bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    item.sePuedePedir === 'NO_EXCLUSION'
                      ? 'bg-red-500'
                      : item.sePuedePedir === 'CONDICIONADO'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                ></div>

                <div className="pl-2 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {item.categoriaAnnA}
                      </span>
                      <h3 className="text-sm font-bold text-white">{item.nombreCapa}</h3>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                        item.sePuedePedir === 'NO_EXCLUSION'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : item.sePuedePedir === 'CONDICIONADO'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {item.sePuedePedir === 'NO_EXCLUSION' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                      {item.sePuedePedir === 'CONDICIONADO' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      {item.sePuedePedir === 'SI_LIBRE' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{item.etiquetaEstado}</span>
                    </div>
                  </div>

                  {/* Legal Motive & Overlap stats */}
                  <p className="text-xs text-slate-300 leading-relaxed">{item.motivoJuridico}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
                    <div className="flex items-center gap-3 text-slate-400 font-mono">
                      <span>
                        <strong className="text-slate-300">Norma:</strong> {item.articuloCodigoMinas}
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-slate-300">Autoridad:</strong> {item.autoridadCompetente}
                      </span>
                    </div>

                    {item.concurreConPoligono ? (
                      <span className="text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 text-[10px]">
                        Superpuesta en polígono {item.areaAfectadaHa ? `(${item.areaAfectadaHa} Ha • ${item.porcentajeAfectacion}%)` : ''}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">No intersecta el polígono base</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
              No se encontraron capas que coincidan con el criterio seleccionado.
            </div>
          )}
        </div>

        {/* Right Detail Panel (Deep Legal Analysis) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedItem ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 sticky top-6">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-amber-400">
                    Ficha Técnica Jurídica
                  </span>
                  <h4 className="text-base font-bold text-white mt-1">{selectedItem.nombreCapa}</h4>
                  <p className="text-xs text-slate-400">{selectedItem.categoriaAnnA}</p>
                </div>
              </div>

              {/* Status Header */}
              <div
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  selectedItem.sePuedePedir === 'NO_EXCLUSION'
                    ? 'bg-red-950/40 border-red-800/60 text-red-200'
                    : selectedItem.sePuedePedir === 'CONDICIONADO'
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                  {selectedItem.sePuedePedir === 'NO_EXCLUSION' && <XCircle className="w-4 h-4 text-red-400" />}
                  {selectedItem.sePuedePedir === 'CONDICIONADO' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {selectedItem.sePuedePedir === 'SI_LIBRE' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  <span>{selectedItem.etiquetaEstado}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{selectedItem.consecuenciaRadicacion}</p>
              </div>

              {/* Legal Details */}
              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Fundamento Legal Específico</p>
                  <p className="font-semibold text-slate-200 mt-0.5">{selectedItem.fundamentoJuridico}</p>
                  <p className="text-amber-400 text-[11px] mt-0.5 font-mono">{selectedItem.articuloCodigoMinas}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">¿Por qué?</p>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{selectedItem.motivoJuridico}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Procedimiento / Trámite Exigido</p>
                  <p className="text-slate-300 mt-0.5 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    {selectedItem.procedimientoRequerido}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Autoridad Competente</p>
                  <p className="text-slate-200 font-semibold mt-0.5">{selectedItem.autoridadCompetente}</p>
                </div>
              </div>

              {/* Status in Current Polygon */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Impacto en el Polígono Actual</p>
                {selectedItem.concurreConPoligono ? (
                  <div className="space-y-1">
                    <p className="text-amber-400 font-bold">Afectación directa detectada</p>
                    <p className="text-slate-300">
                      Superficie en concurrencia: {selectedItem.areaAfectadaHa || 'Calculada'} Ha ({selectedItem.porcentajeAfectacion || 0}%)
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400">
                    El polígono analizado no registra superposición directa con esta figura en las coordenadas ingresadas.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs space-y-3 sticky top-6">
              <FileCheck className="w-8 h-8 text-amber-400/60 mx-auto" />
              <h4 className="font-bold text-slate-200">Seleccione una Capa</h4>
              <p className="text-slate-400 leading-relaxed">
                Haga clic en cualquiera de las capas del catálogo para ver el dictamen jurídico completo, los artículos del Código de Minas aplicables, la autoridad competente y los trámites habilitantes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
