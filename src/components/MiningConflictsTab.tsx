import React, { useState, useMemo, useCallback, memo } from 'react';
import { TrendingDown, Shield, AlertOctagon, Info, FileSpreadsheet, Layers, MapPin } from 'lucide-react';
import { AreaHabilSugerida, MiningConflictItem } from '../types/mining';
import { AreaHabilSummary } from './AreaHabilSummary';

interface MiningConflictsTabProps {
  conflictos: MiningConflictItem[];
  areaHabil?: AreaHabilSugerida;
}

const MiningConflictsTabComponent: React.FC<MiningConflictsTabProps> = ({ conflictos, areaHabil }) => {
  const [filterRel, setFilterRel] = useState<'ALL' | 'DIRECTO' | 'CIRCUNDANTE'>('ALL');

  const directos = useMemo(() => conflictos.filter((c) => c.tipoRelacion === 'SUPERPOSICION_DIRECTA'), [conflictos]);
  const circundantes = useMemo(() => conflictos.filter((c) => c.tipoRelacion === 'COLINDANTE_CIRCUNDANTE'), [conflictos]);

  const filtered = useMemo(() => {
    return conflictos.filter((c) => {
      if (filterRel === 'DIRECTO') return c.tipoRelacion === 'SUPERPOSICION_DIRECTA';
      if (filterRel === 'CIRCUNDANTE') return c.tipoRelacion === 'COLINDANTE_CIRCUNDANTE';
      return true;
    });
  }, [conflictos, filterRel]);

  const handleFilterChange = useCallback((rel: 'ALL' | 'DIRECTO' | 'CIRCUNDANTE') => {
    setFilterRel(rel);
  }, []);

  return (
    <div className="space-y-5">
      {/* Informative Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Restricciones de Tenencia Minera y Derechos Circundantes (TenureLayers ANM)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                {conflictos.length} expedientes detectados
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              En el derecho minero colombiano rige el principio de <strong>prelación temporal</strong> (Art. 16 Código de Minas:
              <em> "Primero en el tiempo, primero en el derecho"</em>). Cualquier superposición con un contrato de concesión vigente o
              una propuesta válidamente radicada impide la concesión sobre las celdas coincidentes. Asimismo, los títulos y solicitudes
              colindantes o circundantes delimitan los linderos y la disponibilidad de la cuadrícula minera oficial.
            </p>
          </div>
        </div>
      </div>

      <AreaHabilSummary areaHabil={areaHabil} />

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => handleFilterChange('ALL')}
          className={`px-3 py-1.5 rounded-lg transition font-medium ${
            filterRel === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Mostrar todos los derechos"
        >
          Todos los Derechos ({conflictos.length})
        </button>
        <button
          onClick={() => handleFilterChange('DIRECTO')}
          className={`px-3 py-1.5 rounded-lg transition font-medium ${
            filterRel === 'DIRECTO' ? 'bg-purple-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Filtrar superposiciones directas"
        >
          Superposiciones Directas ({directos.length})
        </button>
        <button
          onClick={() => handleFilterChange('CIRCUNDANTE')}
          className={`px-3 py-1.5 rounded-lg transition font-medium ${
            filterRel === 'CIRCUNDANTE' ? 'bg-slate-800 text-slate-200 font-bold shadow' : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Filtrar títulos circundantes"
        >
          Títulos y Solicitudes Alrededor ({circundantes.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
          <h4 className="text-sm font-bold text-white">Sin Registros en esta Categoría</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            No se identificaron tenencias mineras en este filtro dentro del sector consultado.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, index) => {
            const isDirect = c.tipoRelacion === 'SUPERPOSICION_DIRECTA';
            return (
              <div
                key={c.id}
                className={`bg-slate-900 border rounded-xl p-4 shadow-lg transition hover:scale-[1.01] animate-scale-in ${
                  isDirect
                    ? 'border-purple-600/50 hover:border-purple-500 border-l-4 border-l-purple-500 bg-purple-950/10'
                    : 'border-slate-800 hover:border-slate-700 border-l-4 border-l-slate-600'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isDirect
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      PLACA: {c.placaConflicto}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{c.tipoDerecho}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isDirect ? 'bg-rose-500/20 text-rose-300' : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {isDirect ? 'SUPERPOSICIÓN DIRECTA' : 'CIRCUNDANTE EN CUADRÍCULA (5 KM)'}
                    </span>
                  </div>

                  <div className="text-right">
                    {isDirect ? (
                      <>
                        <span className="text-sm font-bold font-mono text-purple-400">{c.areaSuperpuestaHa} Ha</span>
                        <span className="text-xs text-slate-400 font-mono ml-2">({c.porcentajeSuperposicion}% superpuesto)</span>
                      </>
                    ) : (
                      <span className="text-xs font-mono text-slate-400">
                        Distancia aproximada: {c.distanciaKm?.toFixed(1) || '1.5'} km
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[11px] block">Titular / Solicitante:</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block font-mono">{c.titular}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[11px] block">Estado y Modalidad:</span>
                    <span className="font-semibold text-amber-400 mt-0.5 block">
                      {c.estado} • {c.modalidad || 'Concesión'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[11px] block">Minerales de Interés:</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block font-mono line-clamp-1">
                      {c.minerales || 'Cobre, Oro, Polimetálicos'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-lg text-xs text-slate-300 mt-2">
                  <strong className="text-slate-200">Consecuencia Jurídica:</strong> {c.observacionJuridica}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const MiningConflictsTab = memo(MiningConflictsTabComponent);
