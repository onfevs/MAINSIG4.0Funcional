import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Filter,
  Search,
  ExternalLink,
  Building2,
  BookOpen,
  Scissors,
  CheckCircle,
} from 'lucide-react';
import { OverlapAnalysisItem, CategoryType } from '../types/mining';

interface EnvironmentalRestrictionsTabProps {
  afectaciones: OverlapAnalysisItem[];
}

const EnvironmentalRestrictionsTabComponent: React.FC<EnvironmentalRestrictionsTabProps> = ({ afectaciones }) => {
  const [filterCat, setFilterCat] = useState<'ALL' | 'A' | 'B'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return afectaciones.filter((item) => {
      const matchesCat = filterCat === 'ALL' || item.categoria === filterCat;
      const matchesSearch =
        item.figura.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nombreOficial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.normaLegal.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [afectaciones, filterCat, searchTerm]);

  const handleFilterChange = useCallback((cat: 'ALL' | 'A' | 'B') => {
    setFilterCat(cat);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Recorte Por Capa - Tabla Resumen de Recorte Individual (Esquema Adjunto Usuario) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <Scissors className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Recorte por Capa - Matriz de Recorte Individual por Restricción
              </h3>
              <p className="text-xs text-slate-400">
                Superficie y porcentaje recortado por cada determinante ambiental y legal
              </p>
            </div>
          </div>
          <span className="text-xs bg-slate-950 text-amber-400 border border-slate-800 font-mono px-2.5 py-1 rounded-lg">
            {afectaciones.length} Capas Intersectadas
          </span>
        </div>

        {/* Tabla Exacta con Formato del Adjunto - Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <th className="p-3">Categoría / Tipo</th>
                <th className="p-3">Figura Ambiental / Capa</th>
                <th className="p-3 text-right">Área Recortada (Ha)</th>
                <th className="p-3 text-right">Porcentaje (%)</th>
                <th className="p-3">Norma Legal y Respaldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {afectaciones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                    Sin afectaciones o recortes detectados en las capas ambientales oficializadas.
                  </td>
                </tr>
              ) : (
                afectaciones.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.categoria === 'A'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.categoria === 'A' ? 'Exclusión Ambiental' : 'Restricción Ley 2da'}
                      </span>
                    </td>
                    <td className="p-3 font-bold font-sans text-white">
                      {item.nombreOficial || item.figura}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-400">
                      {item.areaAfectadaHa.toLocaleString('es-CO')} Ha
                    </td>
                    <td className="p-3 text-right font-bold text-cyan-300">
                      {item.porcentajeAfectacion}%
                    </td>
                    <td className="p-3 font-sans text-slate-300">
                      {item.normaLegal} ({item.articulo})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-3">
          {afectaciones.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-sans bg-slate-950 rounded-xl">
              Sin afectaciones o recortes detectados en las capas ambientales oficializadas.
            </div>
          ) : (
            afectaciones.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-950 border rounded-xl p-4 space-y-3 ${
                  item.categoria === 'A'
                    ? 'border-rose-900/40'
                    : 'border-amber-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.categoria === 'A'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {item.categoria === 'A' ? 'Exclusión Ambiental' : 'Restricción Ley 2da'}
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {item.porcentajeAfectacion}%
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Figura Ambiental</p>
                  <p className="text-sm font-bold text-white">{item.nombreOficial || item.figura}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Área Recortada</p>
                    <p className="text-sm font-bold text-amber-400 font-mono">
                      {item.areaAfectadaHa.toLocaleString('es-CO')} Ha
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Norma Legal</p>
                    <p className="text-sm font-semibold text-slate-200">
                      {item.normaLegal}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filtrar por figura, nombre o norma..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            aria-label="Filtrar restricciones"
          />
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs self-stretch sm:self-auto justify-center">
          <button
            onClick={() => handleFilterChange('ALL')}
            className={`px-3 py-1 rounded transition ${filterCat === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            aria-label="Mostrar todas las restricciones"
          >
            Todas ({afectaciones.length})
          </button>
          <button
            onClick={() => handleFilterChange('A')}
            className={`px-3 py-1 rounded transition ${filterCat === 'A' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            aria-label="Filtrar por exclusiones Categoría A"
          >
            Cat. A: Exclusiones ({afectaciones.filter((a) => a.categoria === 'A').length})
          </button>
          <button
            onClick={() => handleFilterChange('B')}
            className={`px-3 py-1 rounded transition ${filterCat === 'B' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            aria-label="Filtrar por restricciones Categoría B"
          >
            Cat. B: Restricciones ({afectaciones.filter((a) => a.categoria === 'B').length})
          </button>
        </div>
      </div>

      {/* Detailed Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-sm font-semibold text-slate-300">No se encontraron restricciones con los filtros seleccionados.</p>
          <p className="text-xs text-slate-500 mt-1">El área evaluada no presenta afectaciones registradas en este subconjunto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item, index) => (
            <div
              key={item.id}
              className={`bg-slate-900 border rounded-xl p-5 shadow-lg transition-all hover:scale-[1.01] animate-scale-in ${
                item.categoria === 'A'
                  ? 'border-rose-900/40 hover:border-rose-500/50 border-l-4 border-l-rose-500'
                  : 'border-amber-900/40 hover:border-amber-500/50 border-l-4 border-l-amber-500'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded ${
                      item.categoria === 'A'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {item.categoria === 'A' ? 'CATEGORÍA A • EXCLUSIÓN MINERA TOTAL' : 'CATEGORÍA B • RESTRICCIÓN CONDICIONADA'}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-semibold">{item.figura}</span>
                </div>

                <div className="flex items-center space-x-2 text-right">
                  <span className="text-sm font-bold font-mono text-white">{item.areaAfectadaHa} Ha</span>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      item.categoria === 'A' ? 'bg-rose-950 text-rose-300' : 'bg-amber-950 text-amber-300'
                    }`}
                  >
                    {item.porcentajeAfectacion}% de la solicitud
                  </span>
                </div>
              </div>

              <h4 className="text-base font-bold text-white mb-2">{item.nombreOficial}</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 my-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Norma Legal y Artículo:</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {item.normaLegal} ({item.articulo})
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Acto Administrativo / Delimitación:</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">{item.actoAdministrativo}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Autoridad Ambiental Competente:</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">{item.autoridadCompetente}</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 mt-2 text-xs">
                <p className="text-slate-300">
                  <strong className="text-slate-200">Efecto Jurídico:</strong> {item.actividadProhibidaOCondicionada}
                </p>
                {item.procedimientoRequerido && (
                  <p className="text-amber-300/90 mt-1">
                    <strong>Trámite / Requisito Habilitante:</strong> {item.procedimientoRequerido}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const EnvironmentalRestrictionsTab = memo(EnvironmentalRestrictionsTabComponent);
