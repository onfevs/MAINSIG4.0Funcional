import L from 'leaflet';
import catalogData from './catalogFull.json';

export interface CatalogLayerItem {
  id: string;
  name: string;
  serviceName: string;
  serviceUrl: string;
  layerId: number;
  parentLayerId?: number;
  isGroup?: boolean;
  mainCategory: string;
  subCategory: string;
  defaultVisible: boolean;
  color?: string;
  description?: string;
}

export const CATALOG_LAYERS: CatalogLayerItem[] = catalogData as CatalogLayerItem[];

/**
 * High-performance Dynamic ArcGIS MapServer Layer for Leaflet
 * Renders MapServer /export png images through server proxy with debounced pan/zoom updates
 */
export class ArcGisMapServerLayer extends L.Layer {
  private serviceUrl: string;
  private layerId: number;
  private imageOverlay: L.ImageOverlay | null = null;
  private opacity: number = 0.75;
  private debounceTimer: any = null;

  constructor(serviceUrl: string, layerId: number, options?: { opacity?: number }) {
    super();
    this.serviceUrl = serviceUrl;
    this.layerId = layerId;
    if (options?.opacity !== undefined) {
      this.opacity = options.opacity;
    }
  }

  onAdd(map: L.Map): this {
    // Leaflet assigns this._map internally on add
    this._map = map;
    this.refresh();
    map.on('moveend zoomend', this.handleMapChange, this);
    return this;
  }

  onRemove(map: L.Map): this {
    map.off('moveend zoomend', this.handleMapChange, this);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.imageOverlay && this._map) {
      this._map.removeLayer(this.imageOverlay);
      this.imageOverlay = null;
    }
    return this;
  }

  private handleMapChange = () => {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.refresh();
    }, 180);
  };

  private refresh() {
    if (!this._map) return;
    const bounds = this._map.getBounds();
    const size = this._map.getSize();
    if (size.x <= 0 || size.y <= 0) return;

    // Use EPSG:4326 bbox for WGS84 export
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    const params = new URLSearchParams({
      bbox,
      bboxSR: '4326',
      imageSR: '4326',
      size: `${Math.round(size.x)},${Math.round(size.y)}`,
      layers: `show:${this.layerId}`,
      format: 'png32',
      transparent: 'true',
      f: 'image',
    });

    const exportUrl = `${this.serviceUrl}/export?${params.toString()}`;
    const proxyUrl = `/api/anm/proxy?url=${encodeURIComponent(exportUrl)}`;

    if (!this.imageOverlay) {
      this.imageOverlay = L.imageOverlay(proxyUrl, bounds, {
        opacity: this.opacity,
        interactive: false,
      }).addTo(this._map);
    } else {
      this.imageOverlay.setBounds(bounds);
      this.imageOverlay.setUrl(proxyUrl);
    }
  }

  setOpacity(val: number) {
    this.opacity = val;
    if (this.imageOverlay) {
      this.imageOverlay.setOpacity(val);
    }
  }

  /**
   * Identify features at a point using ArcGIS MapServer identify operation
   * Returns feature attributes for the layer at the given lat/lng
   */
  async identify(latlng: L.LatLng, map: L.Map): Promise<any[]> {
    if (!this._map) return [];
    
    const point = map.latLngToContainerPoint(latlng);
    const size = map.getSize();
    
    const params = new URLSearchParams({
      geometry: `${latlng.lng},${latlng.lat}`,
      geometryType: 'esriGeometryPoint',
      sr: '4326',
      layers: `all:${this.layerId}`,
      tolerance: '3',
      mapExtent: `${this._map.getBounds().getWest()},${this._map.getBounds().getSouth()},${this._map.getBounds().getEast()},${this._map.getBounds().getNorth()}`,
      imageDisplay: `${Math.round(size.x)},${Math.round(size.y)},96`,
      returnGeometry: 'true',
      f: 'json',
    });

    const identifyUrl = `${this.serviceUrl}/identify?${params.toString()}`;
    const proxyUrl = `/api/anm/proxy?url=${encodeURIComponent(identifyUrl)}`;

    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) return [];
      const data = await response.json();
      return data.results || [];
    } catch (err) {
      console.warn('[ArcGisMapServerLayer] Identify failed:', err);
      return [];
    }
  }
}

/**
 * Evaluation Active Layers Definitions
 */
export const EVALUATION_LAYERS_META = [
  {
    id: 'eval-area-habil',
    name: 'Área Hábil Sugerida (recorte geométrico)',
    category: 'Capas de la Evaluación Activa',
    subCategory: 'Geometría Base',
    color: '#16a34a',
    description: 'Polígono consultado menos la unión de capas de exclusión y restricción (Arts. 31-35, 64 y 145 Ley 685)',
    defaultVisible: true,
  },
  {
    id: 'eval-zonas-sustraidas',
    name: 'Zonas Sustraídas del Polígono',
    category: 'Capas de la Evaluación Activa',
    subCategory: 'Geometría Base',
    color: '#dc2626',
    description: 'Unión de capas de exclusión/restricción intersectadas que se descuentan del área hábil',
    defaultVisible: true,
  },
  {
    id: 'eval-base-polygon',
    name: 'Polígono Evaluado (Área del Expediente)',
    category: 'Capas de la Evaluación Activa',
    subCategory: 'Geometría Base',
    color: '#38bdf8',
    description: 'Polígono de la propuesta o título minero en evaluación oficial',
    defaultVisible: true,
  },
  {
    id: 'eval-exclusiones',
    name: 'Cat. A: Exclusiones Mineras Acreditadas',
    category: 'Capas de la Evaluación Activa',
    subCategory: 'Restricciones Ambientales',
    color: '#dc2626',
    description: 'Zonas de prohibición minera legal insubsanable (Páramos y PNN)',
    defaultVisible: true,
  },
  {
    id: 'eval-restricciones',
    name: 'Cat. B: Áreas Restringidas Condicionadas',
    category: 'Capas de la Evaluación Activa',
    subCategory: 'Restricciones Ambientales',
    color: '#f59e0b',
    description: 'Reservas Forestales Ley 2da de 1959 y perímetros de centros poblados',
    defaultVisible: true,
  },
  {
    id: 'eval-distritos',
    name: 'Distritos Mineros Especiales (Dec. 044)',
    category: 'Capas de la Evaluación Activa',
    subCategory: 'Ordenamiento Minero',
    color: '#0d9488',
    description: 'Distritos de reconversión y formalización declarados por MinMinas',
    defaultVisible: true,
  },
  {
    id: 'eval-indigenas',
    name: 'Resguardos Indígenas (Capa 26 ANM)',
    category: 'Capas de la Evaluación Activa',
    subCategory: 'Determinantes Étnicos',
    color: '#059669',
    description: 'Territorios étnicos con obligatoriedad de Consulta Previa (Convenio 169 OIT)',
    defaultVisible: true,
  },
  {
    id: 'eval-rondas',
    name: 'Rondas Hídricas y Drenajes (Capa 60)',
    category: 'Capas de la Evaluación Activa',
    subCategory: 'Recursos Hídricos',
    color: '#0284c7',
    description: 'Margen de 30 metros de amortiguación hídrica (Decreto 1076 de 2015)',
    defaultVisible: false,
  },
  {
    id: 'eval-titulos-circundantes',
    name: 'Títulos Mineros Circundantes (5 km)',
    category: 'Capas de la Evaluación Activa',
    subCategory: 'Tenencia Minera Periférica',
    color: '#8b5cf6',
    description: 'Títulos vigentes en el entorno de 5 km (TenureLayers Capa 4)',
    defaultVisible: true,
  },
  {
    id: 'eval-solicitudes-circundantes',
    name: 'Solicitudes en Trámite Circundantes',
    category: 'Capas de la Evaluación Activa',
    subCategory: 'Tenencia Minera Periférica',
    color: '#3b82f6',
    description: 'Propuestas de concesión radicadas y en evaluación previa (TenureLayers Capa 3)',
    defaultVisible: true,
  },
];
