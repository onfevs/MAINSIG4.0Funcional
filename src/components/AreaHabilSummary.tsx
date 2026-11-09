import React from 'react';
import { AreaHabilSugerida } from '../types/mining';
import { GRUPO_LEGAL_LABEL, GrupoLegal } from '../services/legalFramework';

interface AreaHabilSummaryProps {
  areaHabil?: AreaHabilSugerida;
  compact?: boolean;
}

const fmt = (v: number) => v.toLocaleString('es-CO', { maximumFractionDigits: 2 });

export const AreaHabilSummary: React.FC<AreaHabilSummaryProps> = ({ areaHabil, compact = false }) => {
  if (!areaHabil) return null;
  const { areaOriginalHa, areaHabilHa, areaSustraidaHa, porcentajeHabil, porcentajeSustraido, capasSustraidas, capasSinGeometria, capasNoVerificadas } =
    areaHabil;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-white">Área hábil sugerida (recorte geométrico)</h4>
        <span className="text-[10px] text-slate-400">Polígono − ∪ capas de exclusión/restricción</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2">
          <p className="text-[10px] uppercase font-bold text-sky-300">Original</p>
          <p className="font-mono font-bold text-sky-200">{fmt(areaOriginalHa)} ha</p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2">
          <p className="text-[10px] uppercase font-bold text-emerald-300">Hábil</p>
          <p className="font-mono font-bold text-emerald-200">
            {fmt(areaHabilHa)} ha <span className="text-[10px]">({porcentajeHabil}%)</span>
          </p>
        </div>
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2">
          <p className="text-[10px] uppercase font-bold text-rose-300">Sustraída</p>
          <p className="font-mono font-bold text-rose-200">
            {fmt(areaSustraidaHa)} ha <span className="text-[10px]">({porcentajeSustraido}%)</span>
          </p>
        </div>
      </div>
      {!compact && capasSustraidas.length > 0 && (
        <ul className="text-[11px] text-slate-300 space-y-1 max-h-40 overflow-y-auto">
          {capasSustraidas.map((c, i) => (
            <li key={`${c.nombre}-${i}`} className="flex justify-between gap-2">
              <span className="truncate">
                <span className={c.categoria === 'A' ? 'text-rose-400' : 'text-amber-400'}>
                  {GRUPO_LEGAL_LABEL[c.grupoLegal as GrupoLegal] || c.grupoLegal}
                </span>{' '}
                · {c.nombre}
              </span>
              <span className="font-mono text-slate-400 shrink-0">{fmt(c.areaHa)} ha</span>
            </li>
          ))}
        </ul>
      )}
      {capasNoVerificadas?.length > 0 && (
        <p className="text-[10px] font-bold text-amber-300" title={capasNoVerificadas.join(', ')}>
          Área no verificada: {capasNoVerificadas.length} capa(s) restrictiva(s) no se pudieron consultar en ANM (
          {capasNoVerificadas.slice(0, 3).join(', ')}
          {capasNoVerificadas.length > 3 ? '…' : ''}).
        </p>
      )}
      {capasSinGeometria > 0 && (
        <p className="text-[10px] text-amber-300">
          {capasSinGeometria} afectación(es) sin geometría oficial disponible no se sustrajeron del polígono.
        </p>
      )}
    </div>
  );
};
