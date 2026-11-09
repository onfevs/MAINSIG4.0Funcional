import React, { useState } from 'react';
import { Scale, BookOpen, ExternalLink, Search, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { COLOMBIAN_LEGAL_RULES } from '../services/legalRulesDb';
import { LegalRule } from '../types/mining';

export const LegalEngineTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRule, setSelectedRule] = useState<LegalRule>(COLOMBIAN_LEGAL_RULES[0]);

  const filtered = COLOMBIAN_LEGAL_RULES.filter(
    (r) =>
      r.figura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.norma.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.articulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.autoridadCompetente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <span>Motor de Inteligencia Jurídica Minero-Ambiental de Colombia</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Base normativa estructurada con fundamentos legales verificables, sentencias constitucionales y regímenes de sustracción.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar norma, artículo o ley..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Main Two-column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Rules Sidebar List */}
        <div className="lg:col-span-5 space-y-2 max-h-[620px] overflow-y-auto pr-1">
          {filtered.map((rule) => {
            const isSelected = selectedRule.id === rule.id;
            return (
              <button
                key={rule.id}
                onClick={() => setSelectedRule(rule)}
                className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      rule.tipoRestriccion === 'A'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {rule.tipoRestriccion === 'A' ? 'Cat. A (Exclusión)' : 'Cat. B (Restricción)'}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    {rule.vigencia}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100">{rule.figura}</h4>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {rule.norma} • {rule.articulo}
                </p>
              </button>
            );
          })}
        </div>

        {/* Rule Detail View */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                  DISPOSICIÓN JURÍDICA ESTRUCTURADA
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedRule.figura}</h3>
              </div>
              <a
                href={selectedRule.urlOficial}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 font-medium transition"
              >
                <span>Norma Oficial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Normativa Aplicable:</span>
                <span className="font-bold text-slate-100 mt-0.5 block">{selectedRule.norma}</span>
                <span className="text-slate-400 font-mono text-[11px] mt-0.5 block">{selectedRule.articulo}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Autoridad Competente:</span>
                <span className="font-bold text-slate-100 mt-0.5 block">{selectedRule.autoridadCompetente}</span>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Texto Legal Relevante:</span>
              </h5>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-serif italic border-l-4 border-l-amber-500">
                "{selectedRule.textoRelevante}"
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Condiciones de Aplicación y Procedimiento:
              </h5>
              <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                {selectedRule.condicionesAplicacion}
              </p>
            </div>

            {selectedRule.sentenciasRelacionadas && selectedRule.sentenciasRelacionadas.length > 0 && (
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Línea Jurisprudencial Constitucional:
                </h5>
                <ul className="space-y-1 text-xs text-slate-400">
                  {selectedRule.sentenciasRelacionadas.map((s, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
            <span>Regla Jurídica: {selectedRule.id}</span>
            <span className="font-mono">Fecha Expedición: {selectedRule.fechaExpedicion}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
