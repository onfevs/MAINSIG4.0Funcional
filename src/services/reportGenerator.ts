import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { EvaluationResult } from '../types/mining';
import { COLOMBIAN_LEGAL_RULES } from './legalRulesDb';

/**
 * Generates and downloads the Official 8-Sheet Detailed Excel Report
 */
export function generateExcelReport(evalResult: EvaluationResult): void {
  const wb = XLSX.utils.book_new();
  const m = evalResult.metadata;
  const r = evalResult.resumenEjecutivo;

  // 1. Sheet: Resumen_Ejecutivo
  const resumenData = [
    ['MINERÍA LEGAL GIS COLOMBIA - INFORME EJECUTIVO DE VIABILIDAD MINERO-AMBIENTAL'],
    ['Fecha de Generación', new Date(evalResult.timestamp).toLocaleString('es-CO')],
    ['ID de Evaluación', evalResult.evalId],
    [],
    ['DATOS GENERALES DEL EXPEDIENTE'],
    ['Código de Expediente / Placa', m.codigoExpediente],
    ['Placa Minera', m.placa],
    ['Titular / Solicitante', m.titularOSolicitante],
    ['Fecha de Radicación', m.fechaRadicacion],
    ['Clasificación Minera', m.clasificacionMinera],
    ['Área Oficial Registrada (Ha)', m.areaOficialHa],
    ['Departamento(s)', m.departamento],
    ['Municipio(s)', m.municipios.join(', ')],
    ['Vereda(s)', m.veredas.join(', ')],
    ['Minerales de Interés', m.minerales.join(', ')],
    ['Sistema de Coordenadas de Cálculo', m.sistemaReferencia],
    [],
    ['BALANCE DE SUPERFICIES Y BALANCE ESPACIAL'],
    ['Concepto', 'Extensión (Ha)', 'Porcentaje (%)', 'Nivel de Riesgo'],
    ['Área Total del Polígono Evaluado', r.areaTotalHa, 100.0, 'Base'],
    ['Zonas de Exclusión Acreditada (Cat. A)', r.areaExclusionesAcreditadasHa, r.porcentajeExclusion, 'CRÍTICO - Prohibición Absoluta'],
    ['Zonas con Restricción Condicionada (Cat. B)', r.areaRestriccionesCondicionadasHa, r.porcentajeRestricciones, 'ALTO - Requiere Trámite Especial'],
    ['Conflictos con Títulos/Solicitudes Previas', r.areaConflictosMinerosHa, r.porcentajeConflictos, 'CRÍTICO - Principio de Prelación'],
    ['Área Disponible Preliminar / Corredor Libre', r.areaDisponiblePreliminarHa, r.porcentajeDisponible, 'DISPONIBLE CONDICIONADO'],
    [],
    ['DICTAMEN GENERAL DE VIABILIDAD'],
    ['Resultado:', evalResult.viabilidadGeneral],
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen_Ejecutivo');

  // 2. Sheet: Restricciones_Ambientales
  const ambRows = evalResult.afectacionesAmbientales.map((a) => ({
    Categoría: a.categoria === 'A' ? 'A (Exclusión Total)' : 'B (Restricción Condicionada)',
    Figura_Ambiental: a.figura,
    Nombre_Oficial: a.nombreOficial,
    Área_Afectada_Ha: a.areaAfectadaHa,
    Porcentaje_Afectación: `${a.porcentajeAfectacion}%`,
    Norma_Legal: a.normaLegal,
    Artículo: a.articulo,
    Acto_Administrativo: a.actoAdministrativo,
    Autoridad_Competente: a.autoridadCompetente,
    Actividad_Prohibida_o_Condicionada: a.actividadProhibidaOCondicionada,
    Procedimiento_Requerido: a.procedimientoRequerido || 'N/A',
  }));
  const wsAmb = XLSX.utils.json_to_sheet(ambRows.length > 0 ? ambRows : [{ Estado: 'Sin restricciones detectadas' }]);
  XLSX.utils.book_append_sheet(wb, wsAmb, 'Restricciones_Ambientales');

  // 3. Sheet: Restricciones_Mineras
  const minRows = evalResult.conflictosMineros.map((c) => ({
    Placa_Conflicto: c.placaConflicto,
    Expediente: c.expediente,
    Tipo_Derecho: c.tipoDerecho,
    Titular_Registrado: c.titular,
    Estado_Administrativo: c.estado,
    Área_Superpuesta_Ha: c.areaSuperpuestaHa,
    Porcentaje_Superposición: `${c.porcentajeSuperposicion}%`,
    Observación_Jurídica: c.observacionJuridica,
    Fuente_Oficial: c.fuente,
  }));
  const wsMin = XLSX.utils.json_to_sheet(minRows.length > 0 ? minRows : [{ Estado: 'Sin títulos superpuestos' }]);
  XLSX.utils.book_append_sheet(wb, wsMin, 'Restricciones_Mineras');

  // 4. Sheet: Conflictos_Titulares
  const confTitRows = evalResult.conflictosMineros.map((c) => ({
    Expediente: c.expediente,
    Titular: c.titular,
    Tipo: c.tipoDerecho,
    Superficie_Conflicto_Ha: c.areaSuperpuestaHa,
    Prelación: 'Art. 16 Código de Minas (Primero en el tiempo)',
    Impacto: 'Excluye presentación de nueva propuesta sobre las celdas coincidentes',
  }));
  const wsConfTit = XLSX.utils.json_to_sheet(confTitRows.length > 0 ? confTitRows : [{ Nota: 'Sin conflictos entre titulares' }]);
  XLSX.utils.book_append_sheet(wb, wsConfTit, 'Conflictos_Titulares');

  // 5. Sheet: Detalle_Intersecciones
  const detalleIntersec = [
    ...evalResult.afectacionesAmbientales.map((a) => ({
      Tipo_Capa: 'Determinante Ambiental',
      Elemento: a.nombreOficial,
      Capa_Servicio: a.servicioOrigen,
      Área_Intersección_Ha: a.areaAfectadaHa,
      Porcentaje_Relativo: `${a.porcentajeAfectacion}%`,
      Efecto_Espacial: a.categoria === 'A' ? 'Recorte Obligatorio' : 'Área de Manejo Especial',
    })),
    ...evalResult.conflictosMineros.map((c) => ({
      Tipo_Capa: 'Tenencia Minera',
      Elemento: `${c.tipoDerecho} (${c.placaConflicto})`,
      Capa_Servicio: 'TenureLayers',
      Área_Intersección_Ha: c.areaSuperpuestaHa,
      Porcentaje_Relativo: `${c.porcentajeSuperposicion}%`,
      Efecto_Espacial: 'Superposición de Cuadrícula',
    })),
  ];
  const wsDetalle = XLSX.utils.json_to_sheet(detalleIntersec);
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle_Intersecciones');

  // 6. Sheet: Normativa_Aplicable
  const normRows = COLOMBIAN_LEGAL_RULES.map((rule) => ({
    ID_Regla: rule.id,
    Figura_Jurídica: rule.figura,
    Categoría: rule.tipoRestriccion,
    Norma: rule.norma,
    Artículo: rule.articulo,
    Vigencia: rule.vigencia,
    Autoridad_Competente: rule.autoridadCompetente,
    Texto_Legal: rule.textoRelevante,
    Enlace_Oficial: rule.urlOficial,
  }));
  const wsNorm = XLSX.utils.json_to_sheet(normRows);
  XLSX.utils.book_append_sheet(wb, wsNorm, 'Normativa_Aplicable');

  // 7. Sheet: Fuentes_Consultadas
  const fuentesData = [
    { Entidad: 'Agencia Nacional de Minería (ANM)', Servicio: 'TenureLayers/MapServer', URL: 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/TenureLayers/MapServer', Tipo: 'ArcGIS REST', Capas: 'Títulos, Solicitudes, Contratos' },
    { Entidad: 'Agencia Nacional de Minería (ANM)', Servicio: 'Exclusive_Restriction/MapServer', URL: 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/Exclusive_Restriction/MapServer', Tipo: 'ArcGIS REST', Capas: 'Páramos, PNN, Reservas Forestales, Resguardos' },
    { Entidad: 'Agencia Nacional de Minería (ANM)', Servicio: 'General_Base/MapServer', URL: 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/General_Base/MapServer', Tipo: 'ArcGIS REST', Capas: 'Departamentos, Municipios, Veredas, Drenajes' },
    { Entidad: 'Agencia Nacional de Minería (ANM)', Servicio: 'Cuadricula/MapServer', URL: 'https://annamineria.anm.gov.co/annageo/rest/services/SIGM/Cuadricula/MapServer', Tipo: 'ArcGIS REST', Capas: 'Celdas Mineras Oficiales' },
    { Entidad: 'Parques Nacionales Naturales', Servicio: 'RUNAP', URL: 'https://runap.parquesnacionales.gov.co/', Tipo: 'WMS / Catálogo', Capas: 'Sistema de Áreas Protegidas SINAP' },
    { Entidad: 'Ministerio de Ambiente (MADS)', Servicio: 'Geoportal MADS', URL: 'https://geoportal.minambiente.gov.co/', Tipo: 'ArcGIS REST / WFS', Capas: 'Páramos Delimitados, Ley 2 de 1959' },
  ];
  const wsFuentes = XLSX.utils.json_to_sheet(fuentesData);
  XLSX.utils.book_append_sheet(wb, wsFuentes, 'Fuentes_Consultadas');

  // 8. Sheet: Control_Calidad
  const auditRows = evalResult.auditoria.serviciosConsultados.map((s) => ({
    Servicio: s.servicio,
    Capa_Consultada: s.capa,
    Registros_Obtenidos: s.registros,
    Estado_Consulta: s.estado,
    Tiempo_Respuesta_ms: s.duracionMs,
    Sistema_Referencia: evalResult.auditoria.sistemasCoordenadas,
    Versión_Motor: evalResult.auditoria.versionMotorJuridico,
  }));
  const wsAudit = XLSX.utils.json_to_sheet(auditRows);
  XLSX.utils.book_append_sheet(wb, wsAudit, 'Control_Calidad');

  // Trigger Excel file download
  XLSX.writeFile(wb, `${m.codigoExpediente}_Informe_Detallado_MineriaLegal_${Date.now()}.xlsx`);
}

/**
 * Generates and downloads the Official PDF Executive Report
 */
export function generatePdfReport(evalResult: EvaluationResult, mapImageBase64?: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const m = evalResult.metadata;
  const r = evalResult.resumenEjecutivo;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(245, 158, 11); // amber-500
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MINERÍA LEGAL GIS COLOMBIA', 14, 15);

  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Plataforma Inteligente de Evaluación Jurídica, Ambiental y Territorial', 14, 22);
  doc.text(`ID Evaluación: ${evalResult.evalId} | Fecha: ${new Date(evalResult.timestamp).toLocaleString('es-CO')}`, 14, 28);

  // Status Verdict Badge
  let badgeColor: [number, number, number] = [16, 185, 129]; // Emerald
  let badgeText = 'SIN IMPEDIMENTO IDENTIFICADO EN FUENTES CONSULTADAS';

  if (evalResult.viabilidadGeneral === 'NO_VIABLE_EXCLUSION') {
    badgeColor = [220, 38, 38]; // Red
    badgeText = 'NO VIABLE POR EXCLUSIÓN MINERA IDENTIFICADA (CATEGORÍA A)';
  } else if (evalResult.viabilidadGeneral === 'NO_VIABLE_CONFLICTO') {
    badgeColor = [147, 51, 234]; // Purple
    badgeText = 'NO VIABLE POR CONFLICTO DE TENENCIA MINERA PREVIA';
  } else if (evalResult.viabilidadGeneral === 'VIABILIDAD_CONDICIONADA') {
    badgeColor = [217, 119, 6]; // Amber
    badgeText = 'VIABILIDAD CONDICIONADA A AUTORIZACIONES PREVIAS (CATEGORÍA B)';
  }

  doc.setFillColor(...badgeColor);
  doc.roundedRect(14, 42, 182, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(badgeText, 105, 49.5, { align: 'center' });

  // Metadata Table
  autoTable(doc, {
    startY: 58,
    head: [['EXPEDIENTE / PLACA', 'TITULAR / SOLICITANTE', 'CLASIFICACIÓN', 'ÁREA OFICIAL']],
    body: [
      [m.codigoExpediente, m.titularOSolicitante, m.clasificacionMinera, `${m.areaOficialHa.toFixed(4)} Ha`],
      ['DEPARTAMENTO', 'MUNICIPIO(S)', 'SISTEMA COORDENADAS', 'FECHA RADICACIÓN'],
      [m.departamento, m.municipios.join(', '), 'CTM12 (EPSG:9377)', m.fechaRadicacion],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [248, 250, 252], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
    margin: { left: 14, right: 14 },
  });

  // Areas Balance Table
  const lastY1 = (doc as any).lastAutoTable.finalY + 6;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. BALANCE DE SUPERFICIES Y CRUCE ESPACIAL', 14, lastY1);

  autoTable(doc, {
    startY: lastY1 + 3,
    head: [['Categoría Jurídica', 'Concepto Espacial', 'Extensión (Ha)', 'Porcentaje (%)', 'Efecto Minero']],
    body: [
      ['Base', 'Superficie Total Evaluada', `${r.areaTotalHa.toFixed(4)} Ha`, '100.00%', 'Área de Referencia'],
      ['Categoría A', 'Zonas de Exclusión Acreditada (Páramos/PNN)', `${r.areaExclusionesAcreditadasHa.toFixed(4)} Ha`, `${r.porcentajeExclusion}%`, 'Prohibición Absoluta (Recorte)'],
      ['Categoría B', 'Zonas con Restricción Condicionada (Ley 2da / Étnicas)', `${r.areaRestriccionesCondicionadasHa.toFixed(4)} Ha`, `${r.porcentajeRestricciones}%`, 'Requiere Sustracción / Consulta'],
      ['Tenencia', 'Conflictos con Títulos y Solicitudes Vigentes (10 km)', `${r.areaConflictosMinerosHa.toFixed(4)} Ha`, `${r.porcentajeConflictos}%`, 'No Disponible (Prelación Minera)'],
      ['Remanente', 'Superficie Disponible Preliminar', `${r.areaDisponiblePreliminarHa.toFixed(4)} Ha`, `${r.porcentajeDisponible}%`, 'Sujeta a Cuadrícula Oficial'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5 },
    margin: { left: 14, right: 14 },
  });

  // Environmental Restrictions & Recorte Por Capa Table
  const lastY2 = (doc as any).lastAutoTable.finalY + 6;
  doc.text('2. MATRIZ DE RECORTE INDIVIDUAL POR CAPA Y RESTRICCIÓN AMBIENTAL', 14, lastY2);

  const ambBody = evalResult.afectacionesAmbientales.map((a) => [
    a.categoria === 'A' ? 'Exclusión (Cat A)' : 'Restricción (Cat B)',
    a.nombreOficial || a.figura,
    `${a.areaAfectadaHa.toFixed(2)} Ha`,
    `${a.porcentajeAfectacion}%`,
    `${a.normaLegal} (${a.articulo})`,
    a.autoridadCompetente,
  ]);

  autoTable(doc, {
    startY: lastY2 + 3,
    head: [['Tipo / Categoría', 'Figura / Capa Ambientales', 'Área Recortada', 'Porcentaje (%)', 'Norma de Respaldo', 'Autoridad Competente']],
    body: ambBody.length > 0 ? ambBody : [['C', 'Sin restricciones ambientales detectadas', '0 Ha', '0%', 'Ley 685/2001', 'ANM / MADS']],
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    margin: { left: 14, right: 14 },
  });

  // Map Image Page ("Mapas en PDF - Agregar imágenes del mapa al reporte")
  if (mapImageBase64) {
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`ANEXO CARTOGRÁFICO GIS - MAPA OFICIAL DE CAPAS (${m.codigoExpediente})`, 14, 13);

    try {
      doc.addImage(mapImageBase64, 'PNG', 14, 25, 182, 120);
    } catch (errImg) {
      console.warn('Could not render map image in PDF:', errImg);
    }

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Visor Oficial Minería Legal GIS Colombia • Capas ANM, Restricciones Ambientales, Distritos y Corredor 10 km', 14, 150);
  }

  // Conclusions and Legal Warnings
  doc.addPage();
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. CONCLUSIONES Y ADVERTENCIAS JURÍDICAS OBLIGATORIAS', 14, 20);

  let currentY = 28;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');

  r.conclusionesClave.forEach((c) => {
    const lines = doc.splitTextToSize(`• ${c}`, 182);
    doc.text(lines, 14, currentY);
    currentY += lines.length * 3.5;
  });

  r.advertenciasLegales.forEach((w) => {
    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(`[ADVERTENCIA] ${w}`, 182);
    doc.text(lines, 14, currentY);
    currentY += lines.length * 3.5;
  });

  // Signatures section
  currentY += 8;
  if (currentY > 255) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.line(14, currentY + 12, 65, currentY + 12);
  doc.text('Especialista SIG y Percepción Remota', 14, currentY + 16);
  doc.text('Firma y Matrícula Profesional', 14, currentY + 20);

  doc.line(75, currentY + 12, 130, currentY + 12);
  doc.text('Profesional de Tenements Mineros', 75, currentY + 16);
  doc.text('Agencia Nacional de Minería', 75, currentY + 20);

  doc.line(140, currentY + 12, 195, currentY + 12);
  doc.text('Abogado Especialista en Derecho Minero', 140, currentY + 16);
  doc.text('Tarjeta Profesional de Abogado', 140, currentY + 20);

  doc.save(`${m.codigoExpediente}_Informe_Ejecutivo_MineriaLegal_${Date.now()}.pdf`);
}

/**
 * Exports complete GeoJSON package for spatial inspection
 */
export function exportGeoJson(evalResult: EvaluationResult): void {
  const featureCollection = {
    type: 'FeatureCollection',
    metadata: {
      sistemaReferencia: 'EPSG:4326 (WGS84) / Análisis en EPSG:9377 (CTM12)',
      evalId: evalResult.evalId,
      fecha: evalResult.timestamp,
      placa: evalResult.metadata.placa,
      viabilidad: evalResult.viabilidadGeneral,
    },
    features: [
      {
        ...evalResult.baseGeometry,
        properties: {
          ...evalResult.baseGeometry.properties,
          TIPO_CAPA: 'POLIGONO_EVALUADO',
          PLACA: evalResult.metadata.placa,
          EXPEDIENTE: evalResult.metadata.codigoExpediente,
          AREA_HA: evalResult.metadata.areaOficialHa,
          VIABILIDAD: evalResult.viabilidadGeneral,
        },
      },
      ...(evalResult.areaHabilSugerida?.habilGeoJSON
        ? [
            {
              ...evalResult.areaHabilSugerida.habilGeoJSON,
              properties: {
                TIPO_CAPA: 'AREA_HABIL_SUGERIDA',
                AREA_HA: evalResult.areaHabilSugerida.areaHabilHa,
                PORCENTAJE: evalResult.areaHabilSugerida.porcentajeHabil,
              },
            },
          ]
        : []),
      ...(evalResult.areaHabilSugerida?.sustraidaGeoJSON
        ? [
            {
              ...evalResult.areaHabilSugerida.sustraidaGeoJSON,
              properties: {
                TIPO_CAPA: 'ZONAS_SUSTRAIDAS',
                AREA_HA: evalResult.areaHabilSugerida.areaSustraidaHa,
                PORCENTAJE: evalResult.areaHabilSugerida.porcentajeSustraido,
              },
            },
          ]
        : []),
    ],
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(featureCollection, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute('href', dataStr);
  dlAnchorElem.setAttribute('download', `${evalResult.metadata.codigoExpediente}_GeometriaEvaluada.geojson`);
  dlAnchorElem.click();
}

/**
 * Exports ALL analyzed layers as individual JSON files in a ZIP archive
 * Each layer is saved as a separate .json file (compatible with ArcGIS/ArcMap via JSON To Features)
 * Includes: base polygon, exclusions, restrictions, mining titles, districts, indigenous areas,
 * hydrographic rounds, area habil, remaining area, bosque seco, and full metadata
 */
export async function exportAllLayersAsZip(evalResult: EvaluationResult): Promise<void> {
  const zip = new JSZip();
  const code = evalResult.metadata.codigoExpediente || 'SIN_CODIGO';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // Helper to add a layer as JSON file to zip
  const addLayer = (name: string, geojson: any, properties: any = {}) => {
    if (!geojson) return;
    const feature = {
      type: 'Feature',
      geometry: geojson.geometry || geojson,
      properties: {
        ...geojson.properties,
        ...properties,
        TIPO_CAPA: name.toUpperCase(),
        EXPEDIENTE: evalResult.metadata.codigoExpediente,
        FECHA_EXPORT: new Date().toISOString(),
      },
    };
    const fc = {
      type: 'FeatureCollection',
      metadata: {
        sistemaReferencia: 'EPSG:4326 (WGS84) / Análisis en EPSG:9377 (CTM12)',
        evalId: evalResult.evalId,
        fecha: evalResult.timestamp,
        capa: name,
      },
      features: [feature],
    };
    zip.file(`${sanitize(name)}.json`, JSON.stringify(fc, null, 2));
  };

  // Helper to add multiple features as a FeatureCollection
  const addFeatureCollection = (name: string, fc: any, properties: any = {}) => {
    if (!fc || !fc.features || fc.features.length === 0) return;
    const enriched = {
      ...fc,
      metadata: {
        sistemaReferencia: 'EPSG:4326 (WGS84) / Análisis en EPSG:9377 (CTM12)',
        evalId: evalResult.evalId,
        fecha: evalResult.timestamp,
        capa: name,
        totalFeatures: fc.features.length,
      },
      features: fc.features.map((f: any) => ({
        ...f,
        properties: {
          ...f.properties,
          ...properties,
          TIPO_CAPA: name.toUpperCase(),
          EXPEDIENTE: evalResult.metadata.codigoExpediente,
          FECHA_EXPORT: new Date().toISOString(),
        },
      })),
    };
    zip.file(`${sanitize(name)}.json`, JSON.stringify(enriched, null, 2));
  };

  // Sanitize filename
  function sanitize(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 80);
  }

  // 1. Polígono base evaluado
  addLayer('01_Poligono_Evaluado', evalResult.baseGeometry, {
    PLACA: evalResult.metadata.placa,
    AREA_HA: evalResult.metadata.areaOficialHa,
    VIABILIDAD: evalResult.viabilidadGeneral,
    CLASIFICACION: evalResult.metadata.clasificacionMinera,
  });

  // 2. Área Hábil Sugerida
  if (evalResult.areaHabilSugerida?.habilGeoJSON) {
    addLayer('02_Area_Habil_Sugerida', evalResult.areaHabilSugerida.habilGeoJSON, {
      AREA_HA: evalResult.areaHabilSugerida.areaHabilHa,
      PORCENTAJE: evalResult.areaHabilSugerida.porcentajeHabil,
    });
  }

  // 3. Zonas Sustraídas (unión de exclusiones/restricciones)
  if (evalResult.areaHabilSugerida?.sustraidaGeoJSON) {
    addLayer('03_Zonas_Sustraidas', evalResult.areaHabilSugerida.sustraidaGeoJSON, {
      AREA_HA: evalResult.areaHabilSugerida.areaSustraidaHa,
      PORCENTAJE: evalResult.areaHabilSugerida.porcentajeSustraido,
    });
  }

  // 4. Exclusiones Cat. A (individuales desde geometriasCortes)
  const exclusionesFC = evalResult.geometriasCortes?.exclusionesGeoJSON;
  if (exclusionesFC) {
    addFeatureCollection('04_Exclusiones_Cat_A', exclusionesFC, {
      CATEGORIA: 'A',
      EFECTO: 'EXCLUSION_TOTAL_RECORTE_OBLIGATORIO',
    });
  }

  // 5. Restricciones Cat. B (individuales)
  const restriccionesFC = evalResult.geometriasCortes?.restringidasGeoJSON;
  if (restriccionesFC) {
    addFeatureCollection('05_Restricciones_Cat_B', restriccionesFC, {
      CATEGORIA: 'B',
      EFECTO: 'RESTRICCION_CONDICIONADA_TRAMITE_HABILITANTE',
    });
  }

  // 6. Títulos Circundantes (capa 4)
  const titulosFC = evalResult.geometriasCortes?.titulosCircundantesGeoJSON;
  if (titulosFC) {
    addFeatureCollection('06_Titulos_Circundantes', titulosFC, {
      TIPO: 'TITULO_MINERO_VIGENTE',
    });
  }

  // 7. Solicitudes Circundantes (capa 3)
  const solicitudesFC = evalResult.geometriasCortes?.solicitudesCircundantesGeoJSON;
  if (solicitudesFC) {
    addFeatureCollection('07_Solicitudes_Circundantes', solicitudesFC, {
      TIPO: 'SOLICITUD_EN_TRAMITE',
    });
  }

  // 8. Distritos Mineros Especiales
  const distritosFC = evalResult.geometriasCortes?.distritosMinerosGeoJSON;
  if (distritosFC) {
    addFeatureCollection('08_Distritos_Mineros_Especiales', distritosFC, {
      TIPO: 'DISTRITO_MINERO_ESPECIAL_DECRETO_044_2024',
    });
  }

  // 9. Resguardos Indígenas
  const indigenasFC = evalResult.geometriasCortes?.indigenasGeoJSON;
  if (indigenasFC) {
    addFeatureCollection('09_Resguardos_Indigenas', indigenasFC, {
      TIPO: 'RESGUARDO_INDIGENA_CONSULTA_PREVIA_OBLIGATORIA',
    });
  }

  // 10. Rondas Hídricas
  const rondasFC = evalResult.geometriasCortes?.rondasHidricasGeoJSON;
  if (rondasFC) {
    addFeatureCollection('10_Rondas_Hidricas', rondasFC, {
      TIPO: 'RONDA_HIDRICA_DRENAJE_PROTECCION',
    });
  }

  // 11. Área Remanente Libre (post-recorte)
  if (evalResult.geometriasCortes?.areaRemanenteGeoJSON) {
    addFeatureCollection('11_Area_Remanente_Libre', evalResult.geometriasCortes.areaRemanenteGeoJSON, {
      TIPO: 'AREA_REMANENTE_LIBRE_VIABLE_POST_RECORTE',
    });
  }

  // 12. Bosque Seco Tropical (completo y recorte)
  const bosqueFC = evalResult.geometriasCortes?.bosqueSecoFullGeoJSON;
  if (bosqueFC) {
    addFeatureCollection('12_Bosque_Seco_Tropical_Completo', bosqueFC, {
      TIPO: 'BOSQUE_SECO_TROPICAL_ECOSISTEMA_CRITICO_CAT_A',
    });
  }

  // 13. Conflictos Mineros (superposiciones)
  if (evalResult.conflictosMineros && evalResult.conflictosMineros.length > 0) {
    const conflictFC = {
      type: 'FeatureCollection',
      features: evalResult.conflictosMineros.map((c, i) => ({
        type: 'Feature',
        geometry: c.geometry || { type: 'Point', coordinates: [0, 0] },
        properties: {
          PLACA_CONFLICTO: c.placaConflicto,
          EXPEDIENTE: c.expediente,
          TIPO_DERECHO: c.tipoDerecho,
          TITULAR: c.titular,
          ESTADO: c.estado,
          AREA_SUPERPUESTA_HA: c.areaSuperpuestaHa,
          PORCENTAJE: c.porcentajeSuperposicion,
          OBSERVACION_JURIDICA: c.observacionJuridica,
          FUENTE: c.fuente,
        },
      })),
    };
    addFeatureCollection('13_Conflictos_Mineros', conflictFC, {
      TIPO: 'SUPERPOSICION_TENENCIA_MINERA_PREVIA',
    });
  }

  // 14. Afectaciones Ambientales (tabla resumen como features puntuales)
  if (evalResult.afectacionesAmbientales && evalResult.afectacionesAmbientales.length > 0) {
    const afectFC = {
      type: 'FeatureCollection',
      features: evalResult.afectacionesAmbientales.map((a, i) => ({
        type: 'Feature',
        geometry: a.clippedGeometry || a.geometry || { type: 'Point', coordinates: [0, 0] },
        properties: {
          ID: a.id,
          CATEGORIA: a.categoria,
          FIGURA: a.figura,
          NOMBRE_OFICIAL: a.nombreOficial,
          AREA_AFECTADA_HA: a.areaAfectadaHa,
          PORCENTAJE: a.porcentajeAfectacion,
          NORMA_LEGAL: a.normaLegal,
          ARTICULO: a.articulo,
          AUTORIDAD: a.autoridadCompetente,
          TIPO_AFECTACION: a.tipoAfectacion,
          ACTIVIDAD: a.actividadProhibidaOCondicionada,
          PROCEDIMIENTO: a.procedimientoRequerido,
          CAPA_SERVICIO: a.servicioOrigen,
          CAPA_NOMBRE: a.capaNombre,
        },
      })),
    };
    addFeatureCollection('14_Afectaciones_Ambientales_Detalle', afectFC, {
      TIPO: 'DETALLE_AFECTACIONES_INDIVIDUALES',
    });
  }

  // 15. Metadatos completos de la evaluación
  const metadataFC = {
    type: 'FeatureCollection',
    metadata: {
      sistemaReferencia: 'EPSG:4326 (WGS84) / Análisis en EPSG:9377 (CTM12)',
      evalId: evalResult.evalId,
      fecha: evalResult.timestamp,
      ...evalResult.metadata,
      resumenEjecutivo: evalResult.resumenEjecutivo,
      viabilidadGeneral: evalResult.viabilidadGeneral,
      capasNoVerificadas: evalResult.areaHabilSugerida?.capasNoVerificadas || [],
    },
    features: [],
  };
  zip.file('00_Metadatos_Completos_Evaluacion.json', JSON.stringify(metadataFC, null, 2));

  // Generate and download ZIP
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${code}_Capas_Analizadas_${timestamp}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
