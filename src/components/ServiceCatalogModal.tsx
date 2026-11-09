import React, { useState } from 'react';
import { X, Database, Globe, CheckCircle2, AlertCircle, Plus, RefreshCw, ExternalLink } from 'lucide-react';
import { ServiceCatalogItem } from '../types/mining';

interface ServiceCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_SERVICES: ServiceCatalogItem[] = [
  {
    id: 'anm-tenure',
    nombre: 'ANM - Capas de Tenencia Minera (TenureLayers)',
    tipo: 'ArcGIS_REST',
    url: 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/TenureLayers/MapServer',
    categoria: 'MINERA',
    estado: 'ACTIVO',
    capasRegistradas: 11,
    ultimaVerificacion: 'Hace instantes',
  },
  {
    id: 'anm-exclusive',
    nombre: 'ANM - Exclusiones y Restricciones Ambientales',
    tipo: 'ArcGIS_REST',
    url: 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/Exclusive_Restriction/MapServer',
    categoria: 'AMBIENTAL',
    estado: 'ACTIVO',
    capasRegistradas: 18,
    ultimaVerificacion: 'Hace instantes',
  },
  {
    id: 'anm-base',
    nombre: 'ANM - Cartografía Base y División Política (General_Base)',
    tipo: 'ArcGIS_REST',
    url: 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/General_Base/MapServer',
    categoria: 'TERRITORIAL',
    estado: 'ACTIVO',
    capasRegistradas: 14,
    ultimaVerificacion: 'Hace instantes',
  },
  {
    id: 'anm-cuadricula',
    nombre: 'ANM - Sistema de Cuadrícula Minera',
    tipo: 'ArcGIS_REST',
    url: 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/Cuadricula/MapServer',
    categoria: 'MINERA',
    estado: 'ACTIVO',
    capasRegistradas: 4,
    ultimaVerificacion: 'Hace instantes',
  },
  {
    id: 'runap-sinap',
    nombre: 'RUNAP - Registro Único Nacional de Áreas Protegidas',
    tipo: 'WMS',
    url: 'https://runap.parquesnacionales.gov.co/services/wms',
    categoria: 'AMBIENTAL',
    estado: 'ACTIVO',
    capasRegistradas: 8,
    ultimaVerificacion: 'Hace 5 min',
  },
  {
    id: 'mininterior-etnico',
    nombre: 'MinInterior - Geoportal de Comunidades Étnicas (DANCP)',
    tipo: 'ArcGIS_REST',
    url: 'https://geoportal.mininterior.gov.co/server/rest/services',
    categoria: 'ETNICA',
    estado: 'ACTIVO',
    capasRegistradas: 6,
    ultimaVerificacion: 'Hace 10 min',
  },
];

export const ServiceCatalogModal: React.FC<ServiceCatalogModalProps> = ({ isOpen, onClose }) => {
  const [services, setServices] = useState<ServiceCatalogItem[]>(INITIAL_SERVICES);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newTipo, setNewTipo] = useState<'ArcGIS_REST' | 'WMS' | 'WFS'>('ArcGIS_REST');
  const [newCat, setNewCat] = useState<'MINERA' | 'AMBIENTAL' | 'TERRITORIAL' | 'ETNICA'>('AMBIENTAL');
  const [isPinging, setIsPinging] = useState(false);

  if (!isOpen) return null;

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre || !newUrl) return;

    const newItem: ServiceCatalogItem = {
      id: `svc-${Date.now()}`,
      nombre: newNombre,
      url: newUrl,
      tipo: newTipo,
      categoria: newCat,
      estado: 'ACTIVO',
      capasRegistradas: 1,
      ultimaVerificacion: 'Recién registrado',
    };

    setServices([newItem, ...services]);
    setNewNombre('');
    setNewUrl('');
    setShowAddForm(false);
  };

  const handlePingAll = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 sm:rounded-2xl w-full sm:max-w-4xl sm:max-h-[90vh] h-full sm:h-auto flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <Database className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate">Catálogo de Fuentes y Servicios Oficiales</h3>
              <p className="text-xs text-slate-400 hidden sm:block">
                Administración de endpoints REST, WMS y WFS de la Agencia Nacional de Minería y entidades ambientales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handlePingAll}
              disabled={isPinging}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition min-h-[44px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isPinging ? 'animate-spin' : ''}`} />
              <span>Verificar</span>
            </button>
            <span className="text-slate-400 font-mono">6 fuentes</span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Fuente</span>
          </button>
        </div>

        {/* Add Service Form */}
        {showAddForm && (
          <form onSubmit={handleAddService} className="p-4 bg-slate-950 border-b border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase text-amber-400 tracking-wider">Registrar Nuevo Servicio GIS</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                placeholder="Nombre del servicio (ej: IGAC Suelos Agrológicos)"
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                required
              />
              <input
                type="url"
                placeholder="URL del servicio (MapServer, FeatureServer, WMS)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                required
              />
              <select
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
              >
                <option value="ArcGIS_REST">ArcGIS REST (MapServer/FeatureServer)</option>
                <option value="WMS">WMS (Web Map Service)</option>
                <option value="WFS">WFS (Web Feature Service)</option>
              </select>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
              >
                <option value="MINERA">Minera (ANM / SGC)</option>
                <option value="AMBIENTAL">Ambiental (MADS / Humboldt / CAR)</option>
                <option value="TERRITORIAL">Territorial (IGAC / Municipios)</option>
                <option value="ETNICA">Étnica (MinInterior / ANT)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400"
              >
                Guardar Fuente
              </button>
            </div>
          </form>
        )}

        {/* Services List */}
        <div className="p-4 overflow-y-auto max-h-[500px] space-y-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <h4 className="font-bold text-white text-sm">{svc.nombre}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {svc.tipo}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 break-all">{svc.url}</p>
                <p className="text-[11px] text-slate-500">
                  Categoría: <span className="text-slate-300 font-semibold">{svc.categoria}</span> • {svc.capasRegistradas} capas detectadas • Verificado: {svc.ultimaVerificacion}
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <a
                  href={svc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                  title="Abrir endpoint en nueva pestaña"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
