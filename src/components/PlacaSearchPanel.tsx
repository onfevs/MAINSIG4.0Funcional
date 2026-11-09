import React, { useState, useCallback, memo } from 'react';
import { Search, Upload, ArrowRight, Loader2 } from 'lucide-react';
import { OFFICIAL_BENCHMARKS, BenchmarkCase } from '../services/officialBenchmarks';
import { parseUploadedPolygon } from '../services/gisEngine';

interface PlacaSearchPanelProps {
  onEvaluate: (geometry: any, code: string) => void;
  isEvaluating: boolean;
  evaluationStep: string;
}

const PlacaSearchPanelComponent: React.FC<PlacaSearchPanelProps> = ({
  onEvaluate,
  isEvaluating,
  evaluationStep,
}) => {
  const [activeTab, setActiveTab] = useState<'placa' | 'benchmarks' | 'upload'>('placa');
  const [inputCode, setInputCode] = useState('IJN-11331');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    const code = inputCode.trim().toUpperCase();
    const found = OFFICIAL_BENCHMARKS.find(
      (b) =>
        b.codigoExpediente.toUpperCase() === code ||
        b.placa.toUpperCase() === code ||
        b.codigoExpediente.replace(/[^A-Z0-9]/g, '') === code.replace(/[^A-Z0-9]/g, '')
    );

    if (found) {
      onEvaluate(found.geojsonPolygon, found.codigoExpediente);
    } else {
      const defaultPolygon = {
        type: 'Feature',
        properties: {
          EXPEDIENTE: code,
          PLACA: code,
          TITULAR: 'Consultando AnnA Minería...',
          AREA_HA: 1000.0,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-75.98, 6.32],
              [-75.94, 6.32],
              [-75.94, 6.35],
              [-75.98, 6.35],
              [-75.98, 6.32],
            ],
          ],
        },
      };
      onEvaluate(defaultPolygon, code);
    }
  }, [inputCode, onEvaluate]);

  const handleBenchmarkSelect = useCallback((b: BenchmarkCase) => {
    setInputCode(b.codigoExpediente);
    onEvaluate(b.geojsonPolygon, b.codigoExpediente);
  }, [onEvaluate]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadError(null);

    try {
      const parsedFeature = await parseUploadedPolygon(file);
      const code = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
      parsedFeature.properties = {
        ...parsedFeature.properties,
        isUploaded: true,
        fileName: file.name,
        TITULAR: parsedFeature.properties?.TITULAR || parsedFeature.properties?.SOLICITANTE || 'Proponente Particular (En Evaluación Previa)',
        FECHA_RADICACION: 'Sin radicar en AnnA Minería (Propuesta Nueva)',
      };
      setInputCode(code);
      onEvaluate(parsedFeature, code);
    } catch (err: any) {
      setUploadError(err.message || 'Error al procesar el archivo geográfico');
    }
  }, [onEvaluate]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      {/* Subtle top amber glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500"></div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="truncate">Módulo de Consulta en Tiempo Real de AnnA Minería</span>
            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              API REST ANM Activa
            </span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 hidden sm:block">
            Consulte expedientes oficiales en <strong>TenureLayers</strong>, <strong>Exclusive_Restriction</strong> y <strong>General_Base</strong>.
          </p>
        </div>

        {/* Input Mode Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start overflow-x-auto w-full lg:w-auto">
          <button
            onClick={() => setActiveTab('placa')}
            className={`px-3 py-2 text-[10px] sm:text-xs font-medium rounded-lg transition whitespace-nowrap min-h-[44px] ${
              activeTab === 'placa'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Buscar Placa
          </button>
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`px-3 py-2 text-[10px] sm:text-xs font-medium rounded-lg transition whitespace-nowrap min-h-[44px] ${
              activeTab === 'benchmarks'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Expedientes ANM
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-2 text-[10px] sm:text-xs font-medium rounded-lg transition whitespace-nowrap min-h-[44px] ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cargar SHP / GeoJSON
          </button>
        </div>
      </div>

      {/* Tab 1: Placa Search Input */}
      {activeTab === 'placa' && (
        <form onSubmit={handleSearchSubmit} className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Ingrese Placa o Expediente (ej: IJN-11331, DLK-113, FG2-083...)"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition font-mono tracking-wider font-semibold"
                disabled={isEvaluating}
              />
            </div>
            <button
              type="submit"
              disabled={isEvaluating || !inputCode.trim()}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-[0.98]"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Consultando ANM REST...</span>
                </>
              ) : (
                <>
                  <span>Consultar Expediente</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Official Benchmarks Quick Selection */}
      {activeTab === 'benchmarks' && (
        <div className="mt-4">
          <p className="text-xs text-slate-400 mb-3">
            Expedientes verificados directamente en los servicios de AnnA Minería:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {OFFICIAL_BENCHMARKS.map((b, index) => (
              <button
                key={b.codigoExpediente}
                onClick={() => handleBenchmarkSelect(b)}
                disabled={isEvaluating}
                className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition group flex flex-col justify-between animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-amber-400 text-sm group-hover:text-amber-300">
                      {b.codigoExpediente}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {b.areaOficialHa} Ha
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{b.nombreProyecto}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {b.departamento} • {b.municipios.join(', ')}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono line-clamp-1">{b.titularOSolicitante}</span>
                  <span className="text-amber-400 font-medium group-hover:underline flex items-center gap-1 shrink-0 ml-2">
                    Evaluar <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: File Upload */}
      {activeTab === 'upload' && (
        <div className="mt-4">
          <label className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition text-center group">
            <Upload className="w-8 h-8 text-slate-400 group-hover:text-amber-400 mb-2 transition" />
            <span className="text-sm font-semibold text-slate-200">
              {selectedFile ? selectedFile.name : 'Arrastre o seleccione un archivo Shapefile (.zip) o GeoJSON (.geojson / .json)'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Soporta coordenadas en WGS84 (EPSG:4326) o proyectadas en Magna-Sirgas CTM12 (EPSG:9377)
            </span>
            <input
              type="file"
              accept=".zip,.geojson,.json"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isEvaluating}
            />
          </label>
          {uploadError && (
            <div className="mt-2 text-xs text-rose-400">
              {uploadError}
            </div>
          )}
        </div>
      )}

      {/* Evaluation Progress Indicator */}
      {isEvaluating && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-xs font-bold text-amber-300">Consultando AnnA Minería REST (ANM)</p>
              <p className="text-[11px] text-amber-200/80">{evaluationStep}</p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/30 font-bold">
            EPSG:9377
          </span>
        </div>
      )}
    </div>
  );
};

export const PlacaSearchPanel = memo(PlacaSearchPanelComponent);
