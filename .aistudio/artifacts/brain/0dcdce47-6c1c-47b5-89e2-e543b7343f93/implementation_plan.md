# Motor de Recorte Geométrico, Catálogo de 22+ Capas y Reportes Profesionales PDF/Excel

Plan de arquitectura técnica y UX para la plataforma **Minería Legal GIS Colombia v8.0**, incorporando cálculo espacial estricto de Áreas Libres Remanentes (`turf.difference`), visor de capas enriquecido con 22+ categorías oficiales de AnnA Minería, consulta espacial por clic en mapa (drill-down / identify multicapa) y exportación ejecutiva en PDF/Excel.

## Decisión del Usuario y Confirmaciones en Fase 1

> [!IMPORTANT]
> Elecciones confirmadas por el usuario para la construcción de la versión v8.0:

- **Motor de Recorte Espacial**: Recorte estricto por **Exclusiones Categoría A** (Páramos Ley 1930/18, PNN/PNR Art. 34 Código de Minas) y **Bosque Seco Tropical (BST)** con simplificación de vértices geodésicos en tolerancia menor a 1 metro (`turf.simplify`). Genera la geometría física y área exacta de la **Área Libre Remanente**.
- **Diseño del Reporte PDF**: Reporte corporativo de alta calidad con mapa estático renderizado (`html2canvas`), balance oficial de superficies (Área Solicitada vs. Área Excluida vs. Área Libre Remanente), conclusiones técnico-legales y Cuadro de Coordenadas de los primeros 100 vértices en WGS84 y CTM12 (EPSG:9377).
- **Intersección Multicapa (Drill-Down / Clic en Mapa)**: Panel flotante lateral e interactivo con pestañas clasificadas por categoría de capa y ficha técnica detallada de cada entidad superpuesta en la coordenada cliqueada.

---

## 1. Visión General del Producto

La aplicación **Minería Legal GIS Colombia** provee a ingenieros de minas, abogados ambientalistas, inversionistas y funcionarios de la ANM un motor geográfico y jurídico de alta precisión. La versión v8.0 expande sus capacidades con:
1. **Recorte Geométrico de Áreas Libres Remanentes**: Operación booleana topológica (`turf.difference`) que remueve mecánicamente del polígono solicitado las hectáreas afectadas por exclusiones absolutas (Páramos, PNN, PNR, Bosque Seco Tropical, >10.000 Ha) e ilustra el polígono aprovechable resultante.
2. **Catálogo Unificado de Capas AnnA Minería (22+ Categorías)**: Control de capas agrupadas (Cuadrícula Minera, Tenencia Minera, Exclusiones Ambientales, Restricciones Condicionadas, Comunidades Étnicas, Rondas Hídricas y Distritos Mineros) con toggles de visibilidad y deslizadores de opacidad (0% - 100%).
3. **Drill-Down / Identify Multicapa por Clic**: Al hacer clic en cualquier punto del mapa, ejecuta un buffer espacial diferencial para listar todas las características superpuestas (Títulos, Solicitudes, Ley 2da, Resguardos, Páramos, Distritos) en un panel lateral interactivo.
4. **Módulo de Reportes de Ingeniería (PDF & Excel)**:
   - **PDF de Alta Fidelidad**: Documento oficial con encabezado institucional, renderizado del lienzo del mapa (polígono original + área remanente en verde), resumen ejecutivo de áreas, matriz de viabilidad por etapas mineras y tabla de vértices CTM12/WGS84.
   - **Excel Multipestaña (.xlsx)**: 8 pestañas organizadas (Resumen, Exclusiones Cat. A, Restricciones Cat. B, Conflictos ANM, Distritos Mineros, Desglose Municipal, Coordenadas Vértices WGS84, Coordenadas CTM12).

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujos Principales de Usuario
1. **Evaluación de Expediente / Carga de SHP**: El usuario consulta una placa (ej. `IJN-11331`) o sube un archivo ZIP/SHP/GeoJSON.
2. **Cálculo Topológico Inmediato (Recorte Real)**: El motor ejecuta `turf.difference` entre el polígono inicial y todas las geometrías de Exclusión Cat. A + Bosque Seco Tropical. Renderiza en azul el polígono original y en verde esmeralda brillante el **Área Libre Remanente**.
3. **Exploración de Capas en Visor GIS**:
   - Menú desplegable lateral con 22+ capas agrupadas en 6 acordeones temáticos.
   - Control de opacidad por capa con deslizable de 0 a 100%.
4. **Drill-Down al Clic en Mapa**:
   - Al hacer clic en cualquier punto del mapa, se abre un panel lateral con pestañas (*Capas Afectadas*, *Detalle de Atributos*, *Coordenadas Exactas*).
5. **Generación e Impresión de Dictamen**:
   - Botón directo "Descargar Reporte PDF Corporativo" e "Exportar Excel (.xlsx)".

### Identidad Visual y Estilo
- **Lienzo Principal**: Fondo slate oscuro (`#020617` / `#0f172a`), bordes sutiles `1px border-slate-800`.
- **Paleta de Colores Funcional**:
  - *Polígono Solicitado*: Sky Blue (`#0284c7` / `#38bdf8`)
  - *Área Libre Remanente*: Emerald Green (`#059669` / `#10b981`)
  - *Exclusiones Cat. A*: Crimson Red (`#dc2626` / `#ef4444`)
  - *Restricciones Cat. B*: Amber (`#d97706` / `#f59e0b`)
  - *Distritos Mineros (Dec. 044/24)*: Teal (`#0d9488` / `#14b8a6`)
  - *Comunidades Étnicas*: Esmeralda / Púrpura
- **Tipografía**: `Plus Jakarta Sans` para interfaz y `JetBrains Mono` con numerales tabulares (`tabular-nums`) para hectáreas, coordenadas CTM12/WGS84 y códigos de expediente.

---

## 3. Decisores del Producto y Trade-Offs

1. **Estrategia de Recorte Espacial (`turf.difference`)**:
   - *Decisión*: Usar `turf.difference` con manejo de geometría compleja (MultiPolygon / Polygon) y simplificación de vértices `< 1m` (`turf.simplify`).
   - *Por qué*: Garantiza estabilidad computacional sin bloqueos del navegador cuando los polígonos de páramos o PNN contienen miles de nodos.
2. **Generación de PDF Client-Side con `jspdf` y `html2canvas`**:
   - *Decisión*: Generar el reporte PDF directamente en el cliente mediante `jspdf` y `jspdf-autotable`, utilizando `html2canvas` para capturar la vista del mapa con Leaflet.
   - *Por qué*: Rapidez instantánea, privacidad de datos del usuario y nula latencia de servidor.
3. **Mantenimiento del Servidor Proxy Express en `server.ts`**:
   - *Decisión*: Mantener las rutas de proxy `/api/anm/proxy`, `/api/anm/search-tenure` y `/api/anm/query-restrictions` para evitar bloqueos CORS de los servidores REST de la ANM.

---

## 4. Arquitectura Técnica y Estrategia de Datos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            NAVEGADOR / REACT SPA                            │
├──────────────────────────────┬──────────────────────────────┬───────────────┤
│    PLACA / SHP SEARCH PANEL  │    VISOR INTERACTIVO MAPA    │  INTERSECCIÓN │
│  - Benchmarks / Custom SHP   │  - Leaflet + Canvas          │  DRILL-DOWN   │
│  - Parser GeoJSON            │  - Catálogo de 22+ Capas     │  - Panel Clic │
├──────────────────────────────┴──────────────────────────────┴───────────────┤
│                             MOTOR GIS (`gisEngine.ts`)                      │
│  - Turf.js Topology (`turf.difference`, `turf.intersect`, `turf.simplify`)   │
│  - Proyección Geodésica WGS84 <-> CTM12 (EPSG:9377)                         │
│  - Motor de Recorte Remanente (Exclusiones + Bosque Seco)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                          MODULO DE REPORTES Y AUDITORÍA                     │
│  - PDF Corporate Generator (`reportGeneratorPdf.ts` / `jspdf`)               │
│  - Excel Generator (`xlsx` Multi-sheet Export)                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ HTTP REST Proxy
┌────────────────────────────────▼────────────────────────────────────────────┐
│                             EXPRESS BACKEND (`server.ts`)                   │
│  - /api/anm/search-tenure -> SIGM/TenureLayers/MapServer (Capas 2, 3, 4, 5) │
│  - /api/anm/query-restrictions -> Exclusive_Restriction & General_Base     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Componentes Clave a Crear / Actualizar
1. **`/src/services/clippingEngine.ts`**: Módulo especializado en topología para calcular el Área Libre Remanente recortando geometrías complejas mediante `turf.difference`, `turf.multiPolygon` y `turf.simplify`.
2. **`/src/components/LayerCatalogDrawer.tsx`**: Panel lateral o flotante para controlar las 22+ capas con interruptor ON/OFF, deslizador de opacidad (0-100%) y leyendas de color.
3. **`/src/components/MapIdentifyPanel.tsx`**: Panel lateral emergente que se activa al hacer clic en cualquier punto del mapa, realizando un raycast/buffer para listar todas las capas e inspeccionar sus atributos oficiales.
4. **`/src/services/reportGeneratorPdf.ts`**: Generador de PDF corporativo profesional utilizando `jspdf` y `jspdf-autotable`, incorporando la captura de mapa, tabla de vértices y balance de superficies.
5. **`/src/services/reportGeneratorExcel.ts`**: Generador de archivos Excel (.xlsx) con 8 pestañas estructuradas usando la librería `xlsx`.
6. **`/src/components/InteractiveMap.tsx`**: Actualizado para renderizar el lienzo con capas dinámicas, el polígono recortado en verde, y el controlador de clic para el Identify Panel.
