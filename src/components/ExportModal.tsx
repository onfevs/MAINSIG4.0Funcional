import React from 'react';
import { X, FileText, FileSpreadsheet, Download, CheckCircle2, Shield, Archive } from 'lucide-react';
import { EvaluationResult } from '../types/mining';
import { generateExcelReport, generatePdfReport, exportGeoJson, exportAllLayersAsZip } from '../services/reportGenerator';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: EvaluationResult | null;
  mapImageDataUrl?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, evaluation, mapImageDataUrl }) => {
  if (!isOpen || !evaluation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg sm:max-w-xl sm:max-h-[90vh] sm:p-6 p-4 shadow-2xl space-y-5 flex flex-col max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <Download className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">Generar Informes Oficiales</h3>
              <p className="text-xs text-slate-400">Expediente: {evaluation.metadata.codigoExpediente}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Option 1: PDF Executive */}
          <button
            onClick={() => {
              generatePdfReport(evaluation, mapImageDataUrl);
              onClose();
            }}
            className="w-full p-4 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition group flex items-center justify-between"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-400">
                  Informe Ejecutivo PDF
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Resumen de viabilidad, balance de superficies, tabla de afectaciones y conceptos para radicación.
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400 shrink-0 ml-2" />
          </button>

          {/* Option 2: Excel Detailed 8 Sheets */}
          <button
            onClick={() => {
              generateExcelReport(evaluation);
              onClose();
            }}
            className="w-full p-4 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition group flex items-center justify-between"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-400">
                  Informe Detallado Excel (8 Hojas)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Matriz ejecutiva, restricciones ambientales, conflictos de tenencia, normas y auditoría.
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400 shrink-0 ml-2" />
          </button>

          {/* Option 3: GeoJSON / Spatial */}
          <button
            onClick={() => {
              exportGeoJson(evaluation);
              onClose();
            }}
            className="w-full p-4 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition group flex items-center justify-between"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-400">
                  Capas GIS en Formato GeoJSON
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Geometría del polígono evaluado con atributos para importación directa en QGIS o ArcGIS Pro.
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400 shrink-0 ml-2" />
          </button>

          {/* Option 4: ZIP con todas las capas (compatible ArcMap/QGIS) */}
          <button
            onClick={async () => {
              await exportAllLayersAsZip(evaluation);
              onClose();
            }}
            className="w-full p-4 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition group flex items-center justify-between"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-400">
                  Paquete Completo ZIP (Todas las Capas)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Carpeta comprimida con 15+ archivos JSON individuales: polígono, exclusiones, restricciones, 
                  títulos, distritos, resguardos, rondas, área hábil, bosque seco, conflictos y metadatos. 
                  Cada archivo se importa en ArcMap/ArcGIS Pro vía "JSON To Features".
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400 shrink-0 ml-2" />
          </button>
        </div>

        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-500">
            Todos los entregables incluyen sello temporal de consulta, proyección CTM12 (EPSG:9377) y fuentes oficiales ANM / SINAP.
          </p>
        </div>
      </div>
    </div>
  );
};
