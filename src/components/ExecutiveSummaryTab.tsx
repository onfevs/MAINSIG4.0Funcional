import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  Layers,
  MapPin,
  Calendar,
  User,
  Scale,
  FileCheck,
  Check,
  X,
  Clock,
  Table,
  Eye,
  MousePointer,
} from 'lucide-react';
import { EvaluationResult } from '../types/mining';
import { extractVertices } from '../services/clippingEngine';

interface ExecutiveSummaryTabProps {
  evaluation: EvaluationResult;
  onFocusLayer?: (layerId: string) => void;
  onTabChange?: (tab: string) => void;
}

export const ExecutiveSummaryTab: React.FC<ExecutiveSummaryTabProps> = ({ evaluation, onFocusLayer, onTabChange }) => {
  const m = evaluation.metadata;
  const r = evaluation.resumenEjecutivo;
  const v = evaluation.viabilidadGeneral;
  const e = evaluation.etapasEvaluadas;
  const af = evaluation.afectacionesAmbientales;

  const [showVertices, setShowVertices] = useState(false);
  const vertices = extractVertices(evaluation.baseGeometry, 100);

  // Calcular departamento real si es COLOMBIA (fallback)
  const getRealDepartamento = () => {
    if (m.departamento && m.departamento !== 'COLOMBIA') return m.departamento;
    if (m.municipiosDetalle && m.municipiosDetalle.length > 0) {
      const deptos = [...new Set(m.municipiosDetalle.map(md => md.departamento).filter(Boolean))];
      return deptos.join(', ') || 'Sin determinar';
    }
    return 'Sin determinar';
  };

  return (
    <div className="space-y-6">
      {/* 1. Main Status Verdict Banner */}
      <div
        className={`rounded-2xl p-4 sm:p-6 border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
          v === 'NO_VIABLE_EXCLUSION'
            ? 'bg-rose-950/40 border-rose-600/40 text-rose-100'
            : v === 'NO_VIABLE_CONFLICTO'
            ? 'bg-purple-950/40 border-purple-600/40 text-purple-100'
            : v === 'VIABILIDAD_CONDICIONADA'
            ? 'bg-amber-950/40 border-amber-600/40 text-amber-100'
            : 'bg-emerald-950/40 border-emerald-600/40 text-emerald-100'
        }`}
      >
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              v === 'NO_VIABLE_EXCLUSION'
                ? 'bg-rose-600 text-white'
                : v === 'NO_VIABLE_CONFLICTO'
                ? 'bg-purple-600 text-white'
                : v === 'VIABILIDAD_CONDICIONADA'
                ? 'bg-amber-600 text-slate-950'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {v === 'NO_VIABLE_EXCLUSION' && <ShieldAlert className="w-5 h-5 sm:w-7 sm:h-7" />}
            {v === 'NO_VIABLE_CONFLICTO' && <TrendingDown className="w-5 h-5 sm:w-7 sm:h-7" />}
            {v === 'VIABILIDAD_CONDICIONADA' && <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7" />}
            {v === 'SIN_IMPEDIMENTO' && <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span
                className={`text-[10px] sm:text-xs uppercase font-extrabold px-2 py-0.5 rounded tracking-wide ${
                  v === 'NO_VIABLE_EXCLUSION'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : v === 'NO_VIABLE_CONFLICTO'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : v === 'VIABILIDAD_CONDICIONADA'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {v === 'NO_VIABLE_EXCLUSION' ? 'A (EXCLUSIÓN)' : v === 'VIABILIDAD_CONDICIONADA' ? 'B (CONDICIONADA)' : v === 'NO_VIABLE_CONFLICTO' ? 'CONFLICTO ANM' : 'C (SIN RESTRICCIÓN)'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono">ID: {evaluation.evalId}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mt-1 tracking-tight">
              {v === 'NO_VIABLE_EXCLUSION' && 'NO VIABLE POR EXCLUSIÓN MINERA IDENTIFICADA'}
              {v === 'NO_VIABLE_CONFLICTO' && 'NO VIABLE POR CONFLICTO DE TENENCIA PREVIA'}
              {v === 'VIABILIDAD_CONDICIONADA' && 'VIABILIDAD CONDICIONADA A VERIFICACIONES O AUTORIZACIONES'}
              {v === 'SIN_IMPEDIMENTO' && 'SIN IMPEDIMENTO IDENTIFICADO EN LA EVALUACIÓN PRELIMINAR'}
            </h3>
            <p className="text-[11px] sm:text-xs opacity-90 mt-1 leading-relaxed">
              {v === 'NO_VIABLE_EXCLUSION' &&
                'El polígono intersecta determinantes ambientales con fuerza de prohibición legal insubsanable (Páramos Ley 1930/2018, Bosque Seco Tropical Sentencia C-035/16 o PNN Art. 34 Código de Minas). Debe efectuarse recorte forzoso.'}
              {v === 'NO_VIABLE_CONFLICTO' &&
                'Existen cuadrículas superpuestas con derechos mineros inscritos o solicitudes vigentes anteriores que gozan de prelación legal bajo el Art. 16 de la Ley 685 de 2001.'}
              {v === 'VIABILIDAD_CONDICIONADA' &&
                'No presenta exclusiones absolutas, pero se encuentra afectado por zonas de reserva forestal (Ley 2/1959), distritos de manejo o comunidades étnicas que exigen trámites habilitantes.'}
              {v === 'SIN_IMPEDIMENTO' &&
                'No se detectaron intersecciones con exclusiones ni conflictos en las bases oficiales consultadas. Continúa sujeta a verificación de cuadrícula y trámite ambiental ordinario.'}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800 text-right shrink-0 w-full sm:w-auto">
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">CORREDOR DISPONIBLE</p>
          <p className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
            {r.areaDisponiblePreliminarHa} <span className="text-xs font-normal text-slate-400">Ha</span>
          </p>
          <p className="text-[10px] text-emerald-300 font-mono mt-0.5 font-bold">
            {r.porcentajeDisponible}% del total
          </p>
        </div>
      </div>

      {/* 2. Key Metrics Grid - Clickable cards to focus map layers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Requested */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs mb-1">
            <span className="truncate">Superficie Solicitada</span>
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-slate-100">{r.areaTotalHa}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Hectáreas Totales (100%)</p>
          </div>
          <div className="mt-2 text-[9px] sm:text-[10px] text-slate-500 font-mono border-t border-slate-800/80 pt-1.5 flex justify-between">
            <span>Tope: 10.000 Ha</span>
            <span className={m.excedeTopeLegal ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {m.excedeTopeLegal ? 'Excede' : 'Cumple'}
            </span>
          </div>
        </div>

        {/* Exclusions Cat A - Clickable */}
        <button
          type="button"
          onClick={() => { onTabChange?.('map'); onFocusLayer?.('eval-exclusiones'); }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg flex flex-col justify-between hover:border-rose-500/50 hover:bg-rose-950/20 transition-all cursor-pointer group"
          title="Enfocar capas de Exclusiones Cat. A en el mapa"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs mb-1">
            <span className="truncate">Exclusiones Cat. A</span>
            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-rose-400">{r.areaExclusionesAcreditadasHa}</p>
            <p className="text-[10px] sm:text-[11px] text-rose-300 font-semibold">{r.porcentajeExclusion}% Recorte</p>
          </div>
          <div className="mt-2 text-[9px] sm:text-[10px] text-slate-500 font-mono border-t border-slate-800/80 pt-1.5 flex justify-between">
            <span>Detectadas: {r.totalExclusionesDetectadas}</span>
            <span className="text-rose-400">Prohibición</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-sky-400/0 group-hover:text-sky-400 transition-opacity mt-1">
            <MousePointer className="w-3 h-3" />
            <span>Click para ir a la capa</span>
          </div>
        </button>

        {/* Restrictions Cat B - Clickable */}
        <button
          type="button"
          onClick={() => { onTabChange?.('map'); onFocusLayer?.('eval-restricciones'); }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg flex flex-col justify-between hover:border-amber-500/50 hover:bg-amber-950/20 transition-all cursor-pointer group"
          title="Enfocar capas de Restricciones Cat. B en el mapa"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs mb-1">
            <span className="truncate">Restricciones Cat. B</span>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-amber-400">{r.areaRestriccionesCondicionadasHa}</p>
            <p className="text-[10px] sm:text-[11px] text-amber-300 font-semibold">{r.porcentajeRestricciones}% Trámite</p>
          </div>
          <div className="mt-2 text-[9px] sm:text-[10px] text-slate-500 font-mono border-t border-slate-800/80 pt-1.5 flex justify-between">
            <span>Detectadas: {r.totalRestriccionesDetectadas}</span>
            <span className="text-amber-400">Sustracción</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-sky-400/0 group-hover:text-sky-400 transition-opacity mt-1">
            <MousePointer className="w-3 h-3" />
            <span>Click para ir a la capa</span>
          </div>
        </button>

        {/* Available Remanente CTM12 - Clickable */}
        <button
          type="button"
          onClick={() => { onTabChange?.('map'); onFocusLayer?.('eval-area-habil'); }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg flex flex-col justify-between bg-gradient-to-br from-emerald-950/20 to-transparent hover:border-emerald-500/50 hover:bg-emerald-950/30 transition-all cursor-pointer group"
          title="Enfocar Área Hábil Sugerida en el mapa"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs mb-1">
            <span className="truncate">Área Libre CTM12</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">{r.areaDisponiblePreliminarHa}</p>
            <p className="text-[10px] sm:text-[11px] text-emerald-300 font-bold">{r.porcentajeDisponible}% Libre</p>
          </div>
          <div className="mt-2 text-[9px] sm:text-[10px] text-slate-500 font-mono border-t border-slate-800/80 pt-1.5 flex justify-between">
            <span>Origen CTM12</span>
            <span className="text-emerald-400 font-bold">Susceptible</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-sky-400/0 group-hover:text-sky-400 transition-opacity mt-1">
            <MousePointer className="w-3 h-3" />
            <span>Click para ir a la capa</span>
          </div>
        </button>
      </div>

      {/* 3. Desglose de Afectaciones por Categoría (Clickable) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Detalle de Afectaciones Detectadas (Click para enfocar capa)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Cat A */}
          <div className="bg-rose-950/30 border border-rose-800/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Categoría A - Exclusión Absoluta ({af.filter(a => a.categoria === 'A').length})</span>
            </div>
            {af.filter(a => a.categoria === 'A').length === 0 ? (
              <p className="text-[11px] text-slate-500">Sin exclusiones detectadas</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {af.filter(a => a.categoria === 'A').map((a, idx) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => { onTabChange?.('map'); onFocusLayer?.('eval-exclusiones'); }}
                    className="w-full text-left p-2 bg-slate-900/60 border border-slate-800 rounded hover:border-rose-500/50 hover:bg-rose-950/30 transition text-[10px]"
                    title={`Enfocar: ${a.figura}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-rose-200 truncate pr-2">{a.figura}</span>
                      <span className="font-mono text-rose-400 shrink-0">{a.areaAfectadaHa.toLocaleString('es-CO')} ha ({a.porcentajeAfectacion}%)</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span className="truncate pr-2">{a.nombreOficial}</span>
                      <span className="shrink-0 text-[9px]">{a.capaNombre}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Cat B */}
          <div className="bg-amber-950/30 border border-amber-800/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Categoría B - Restricción Condicionada ({af.filter(a => a.categoria === 'B').length})</span>
            </div>
            {af.filter(a => a.categoria === 'B').length === 0 ? (
              <p className="text-[11px] text-slate-500">Sin restricciones detectadas</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {af.filter(a => a.categoria === 'B').map((a, idx) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => { onTabChange?.('map'); onFocusLayer?.('eval-restricciones'); }}
                    className="w-full text-left p-2 bg-slate-900/60 border border-slate-800 rounded hover:border-amber-500/50 hover:bg-amber-950/30 transition text-[10px]"
                    title={`Enfocar: ${a.figura}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-amber-200 truncate pr-2">{a.figura}</span>
                      <span className="font-mono text-amber-400 shrink-0">{a.areaAfectadaHa.toLocaleString('es-CO')} ha ({a.porcentajeAfectacion}%)</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span className="truncate pr-2">{a.nombreOficial}</span>
                      <span className="shrink-0 text-[9px]">{a.capaNombre}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-[10px] text-slate-500 italic">
          Nota: Los porcentajes de Cat. B pueden sumar más del 100% por superposición entre capas.
        </p>
      </div>

      {/* 4. Mining Workflow Evaluation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          <span>Matriz de Viabilidad por Etapas del Ciclo Minero</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">1. Radicación Propuesta</span>
                {e.presentacionPropuesta.viable ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Viable
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    <X className="w-3 h-3" /> No Viable
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{e.presentacionPropuesta.condicion}</p>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">Art. 16 y 270 Ley 685/2001</p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">2. Otorgamiento Contrato</span>
                {e.otorgamientoContrato.viable ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Viable
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    <X className="w-3 h-3" /> No Viable
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{e.otorgamientoContrato.condicion}</p>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">Art. 45 a 56 Ley 685/2001</p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">3. Fase de Exploración</span>
                {e.exploracionMinera.viable ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Permitida
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3" /> Condicionada
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{e.exploracionMinera.condicion}</p>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">Guías Minero-Ambientales</p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">4. Fase de Explotación</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Clock className="w-3 h-3" /> Req. Licencia
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{e.explotacionMinera.condicion}</p>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">Ley 99/1993 Art. 49</p>
          </div>
        </div>
      </div>

      {/* 4. Territorial Identification & Municipal Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Localización Territorial Oficial y Jurisdicción</span>
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Departamento(s):</span>
              <span className="font-semibold text-slate-200 text-right">{getRealDepartamento()}</span>
            </div>

            <div className="py-1 border-b border-slate-800/80">
              <div className="flex justify-between text-slate-400 mb-1.5">
                <span>Distribución por Municipio:</span>
                <span className="text-[10px] text-amber-400 font-mono">% de Área</span>
              </div>
              <div className="space-y-1.5">
                {m.municipiosDetalle && m.municipiosDetalle.length > 0 ? (
                  m.municipiosDetalle.map((md, idx) => (
                    <div key={idx} className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/70">
                      <div className="flex justify-between text-xs font-medium text-slate-200 mb-1">
                        <span>{md.municipio}</span>
                        <span className="font-mono text-amber-400 font-bold">{md.porcentaje}% ({md.areaHa} Ha)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, md.porcentaje)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="font-semibold text-slate-200">{m.municipios.join(', ')}</span>
                )}
              </div>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Titular / Solicitante:</span>
              <span className="font-mono text-slate-200 text-right max-w-[180px] truncate" title={m.titularOSolicitante}>
                {m.titularOSolicitante}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Estado / Etapa ANM:</span>
              <span className="font-bold text-amber-300 text-right">{m.estadoAdministrativo}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Escala (Dec. 1666/16):</span>
              <span className="font-bold text-sky-400 text-right">{m.clasificacionMinera} Minería</span>
            </div>

            {m.distritoMineroDetalle && (
              <div className="p-2 bg-teal-950/40 border border-teal-600/40 rounded-lg">
                <div className="flex items-center justify-between text-[11px] font-bold text-teal-300">
                  <span>Distrito Minero Especial:</span>
                  <span className="font-mono">{m.distritoMineroDetalle.porcentajeAfectacion}%</span>
                </div>
                <p className="text-[11px] text-teal-100 font-semibold mt-0.5">{m.distritoMineroDetalle.nombre}</p>
                <p className="text-[10px] text-teal-400/80 mt-0.5">Decreto 044 de 2024 / MinMinas</p>
              </div>
            )}
          </div>
        </div>

        {/* Conclusions and Legal Directives */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conclusiones Jurídicas y Advertencias Legales</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {r.conclusionesClave.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <span className="font-bold block mb-0.5">ADVERTENCIA LEGAL OBLIGATORIA:</span>
            {r.advertenciasLegales[0] ||
              'La ausencia de restricciones detectadas no concede derecho adquirido de adjudicación ni reemplaza el estudio ambiental de campo ni los trámites ante la ANM y Corporaciones Autónomas Regionales.'}
          </div>
        </div>
      </div>

      {/* 5. Coordenadas de los Vértices del Polígono (WGS84 y Plano CTM12 / EPSG:9377) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Table className="w-4 h-4 text-amber-400" />
            <span>Cuadro de Coordenadas de los Vértices del Plano (WGS84 y CTM12 EPSG:9377)</span>
          </h4>
          <button
            onClick={() => setShowVertices(!showVertices)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-bold border border-slate-700 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showVertices ? 'Ocultar Coordenadas' : `Ver Vertices (${vertices.length})`}</span>
          </button>
        </div>

        {showVertices && (
          <div className="overflow-x-auto max-h-72 scrollbar-thin border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="p-2.5">Vértice #</th>
                  <th className="p-2.5">Latitud (WGS84)</th>
                  <th className="p-2.5">Longitud (WGS84)</th>
                  <th className="p-2.5 text-cyan-400">Este X (m CTM12)</th>
                  <th className="p-2.5 text-cyan-400">Norte Y (m CTM12)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {vertices.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-2 font-bold text-amber-400">{v.id}</td>
                    <td className="p-2 text-slate-200">{v.lat.toFixed(6)}°</td>
                    <td className="p-2 text-slate-200">{v.lng.toFixed(6)}°</td>
                    <td className="p-2 text-cyan-300 font-semibold">{v.esteCTM12.toLocaleString('es-CO')} m</td>
                    <td className="p-2 text-cyan-300 font-semibold">{v.norteCTM12.toLocaleString('es-CO')} m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
