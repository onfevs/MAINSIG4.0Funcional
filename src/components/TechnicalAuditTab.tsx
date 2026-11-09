import React from 'react';
import { Activity, ShieldCheck, Database, Clock, Compass, Terminal, FileCode } from 'lucide-react';
import { EvaluationResult } from '../types/mining';

interface TechnicalAuditTabProps {
  evaluation: EvaluationResult;
}

export const TechnicalAuditTab: React.FC<TechnicalAuditTabProps> = ({ evaluation }) => {
  const { auditoria, metadata } = evaluation;

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center space-x-2 text-slate-400 mb-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Sistema de Coordenadas</span>
          </div>
          <p className="text-sm font-bold text-slate-100 font-mono">CTM12 (EPSG:9377)</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Origen Nacional de Colombia (Res. IGAC 471/2020) con proyección elipsoidal GRS80.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center space-x-2 text-slate-400 mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Trazabilidad y Calidad</span>
          </div>
          <p className="text-sm font-bold text-slate-100 font-mono">ISO 19115 / W3C Provenance</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Registro de fecha, duración en milisegundos y sellado temporal de cada capa.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center space-x-2 text-slate-400 mb-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Versión del Motor</span>
          </div>
          <p className="text-sm font-bold text-slate-100 font-mono">Motor Minería Legal v7.5</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Algoritmo de disolución y recorte sin duplicación de áreas coincidentes.
          </p>
        </div>
      </div>

      {/* Services Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Registro de Servicios REST y Capas Consultadas</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Servicio de Origen</th>
                <th className="py-2.5 px-3">Capa Evaluada</th>
                <th className="py-2.5 px-3">Registros</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-right">Tiempo (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {auditoria.serviciosConsultados.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{s.servicio}</td>
                  <td className="py-2.5 px-3 text-slate-300 font-sans">{s.capa}</td>
                  <td className="py-2.5 px-3 text-amber-400">{s.registros}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {s.estado}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{s.duracionMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geometry and Quality Assurance Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
        <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
          <FileCode className="w-4 h-4 text-cyan-400" />
          Control de Calidad Geométrico (QA / QC)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400">
          <div>
            <p>• <strong>Topología Válida:</strong> Polígono cerrado sin autointersecciones críticas ni picos nulos.</p>
            <p>• <strong>Unión Geométrica de Exclusiones:</strong> Disolución realizada con Shapely/Turf para evitar sumatoria doble.</p>
          </div>
          <div>
            <p>• <strong>Factor de Escala:</strong> k=0.9992 aplicado en proyección CTM12 para minimización de deformación planar.</p>
            <p>• <strong>Control de Límite Temporal:</strong> Verificación de radicación frente al RMN (Registro Minero Nacional).</p>
          </div>
        </div>
      </div>
    </div>
  );
};
