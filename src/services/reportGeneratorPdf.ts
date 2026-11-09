import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { EvaluationResult } from '../types/mining';
import { extractVertices, wgs84ToCTM12 } from './clippingEngine';
import * as turf from '@turf/turf';

/**
 * Generates an isotropic (distortion-free 1:1 scale) cartographic Map Plan image data URL (PNG)
 * incorporating the CTM12 coordinate grid, vertex numbers, clipped remanente area, and legend box.
 */
export function generateMapGraphicDataUrl(evaluation: EvaluationResult): string {
  const width = 1200;
  const height = 700;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Background - Dark GIS Field
  ctx.fillStyle = '#0b1329';
  ctx.fillRect(0, 0, width, height);

  // Compute bounding box in WGS84
  let bbox = [-76.01, 6.29, -75.95, 6.36];
  try {
    if (evaluation.baseGeometry) {
      bbox = turf.bbox(evaluation.baseGeometry);
    }
  } catch (e) {}

  const padding = 70;
  const minX = bbox[0];
  const minY = bbox[1];
  const maxX = bbox[2];
  const maxY = bbox[3];

  const dx = maxX - minX || 0.01;
  const dy = maxY - minY || 0.01;

  // Isotropic aspect-ratio compensation (prevents squishing or stretching)
  const targetBoxWidth = width - padding * 2 - 280; // Reserve 280px for Legend on the right
  const targetBoxHeight = height - padding * 2;

  const latRad = ((minY + maxY) / 2) * (Math.PI / 180);
  const geoAspect = (dx * Math.cos(latRad)) / dy;
  const boxAspect = targetBoxWidth / targetBoxHeight;

  let scaleX: number;
  let scaleY: number;

  if (geoAspect > boxAspect) {
    scaleX = targetBoxWidth;
    scaleY = targetBoxWidth / geoAspect;
  } else {
    scaleY = targetBoxHeight;
    scaleX = targetBoxHeight * geoAspect;
  }

  const offsetX = padding + (targetBoxWidth - scaleX) / 2;
  const offsetY = height - padding - (targetBoxHeight - scaleY) / 2;

  // Isotropic projection helper: [lng, lat] -> [pxX, pxY]
  const project = (lng: number, lat: number): [number, number] => {
    const x = offsetX + ((lng - minX) / dx) * scaleX;
    const y = offsetY - ((lat - minY) / dy) * scaleY;
    return [x, y];
  };

  // 1. Draw Grid Lines and CTM12 Coordinates
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#1e293b';
  ctx.fillStyle = '#64748b';
  ctx.font = '10px monospace';

  const gridSteps = 5;
  for (let i = 0; i <= gridSteps; i++) {
    const lng = minX + (dx * i) / gridSteps;
    const lat = minY + (dy * i) / gridSteps;

    const [pxX, pxY] = project(lng, lat);
    const ctm = wgs84ToCTM12(lng, lat);

    // Vertical grid line
    if (pxX >= padding && pxX <= padding + targetBoxWidth) {
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(pxX, padding / 2);
      ctx.lineTo(pxX, height - padding / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText(`${ctm.este.toLocaleString()} m X`, pxX - 25, height - padding / 2 + 15);
    }

    // Horizontal grid line
    if (pxY >= padding / 2 && pxY <= height - padding / 2) {
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(padding / 2, pxY);
      ctx.lineTo(padding + targetBoxWidth, pxY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText(`${ctm.norte.toLocaleString()} m Y`, 10, pxY + 4);
    }
  }

  // Helper to draw a GeoJSON Polygon / MultiPolygon
  const drawGeometry = (
    geometry: any,
    fillStyle: string,
    strokeStyle: string,
    lineWidth: number,
    dashArray: number[] = []
  ) => {
    if (!geometry) return;
    const coordsLists = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];

    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    if (dashArray.length > 0) ctx.setLineDash(dashArray);

    coordsLists.forEach((polyCoords: any) => {
      polyCoords.forEach((ring: any) => {
        if (!ring || ring.length === 0) return;
        ctx.beginPath();
        ring.forEach(([lng, lat]: [number, number], idx: number) => {
          const [pxX, pxY] = project(lng, lat);
          if (idx === 0) ctx.moveTo(pxX, pxY);
          else ctx.lineTo(pxX, pxY);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    });
    ctx.restore();
  };

  const gc = evaluation.geometriasCortes || {};

  // 2. Draw Exclusions (Páramos, Bosque Seco Tropical) in Crimson
  if (gc.exclusionesGeoJSON?.features) {
    gc.exclusionesGeoJSON.features.forEach((f: any) => {
      drawGeometry(f.geometry, 'rgba(239, 68, 68, 0.45)', '#ef4444', 2);
    });
  }

  // 3. Draw Restricciones Cat B (Ley 2da, Poblados) in Amber
  if (gc.restringidasGeoJSON?.features) {
    gc.restringidasGeoJSON.features.forEach((f: any) => {
      drawGeometry(f.geometry, 'rgba(245, 158, 11, 0.35)', '#f59e0b', 1.8);
    });
  }

  // 4. Draw Resguardos Indígenas in Green
  if (gc.indigenasGeoJSON?.features) {
    gc.indigenasGeoJSON.features.forEach((f: any) => {
      drawGeometry(f.geometry, 'rgba(16, 185, 129, 0.35)', '#10b981', 1.8);
    });
  }

  // 5. Draw Distritos Mineros in Teal
  if (gc.distritosMinerosGeoJSON?.features) {
    gc.distritosMinerosGeoJSON.features.forEach((f: any) => {
      drawGeometry(f.geometry, 'rgba(20, 184, 166, 0.3)', '#14b8a6', 1.8, [5, 5]);
    });
  }

  // 6. Draw Base Requested Polygon in Sky Blue
  if (evaluation.baseGeometry?.geometry) {
    drawGeometry(evaluation.baseGeometry.geometry, 'rgba(2, 132, 199, 0.2)', '#38bdf8', 3, [6, 6]);
  }

  // 7. Draw Clipped Remanente Area CTM12 in Emerald Green
  const remFeat = gc.areaRemanenteFeatureCollection?.features?.[0];
  if (remFeat?.geometry) {
    drawGeometry(remFeat.geometry, 'rgba(16, 185, 129, 0.55)', '#059669', 3.5);
  }

  // 8. Draw Vertex Numbers and Coordinates
  const vertices = extractVertices(evaluation.baseGeometry, 25);
  ctx.font = 'bold 10px sans-serif';
  vertices.forEach((v) => {
    const [pxX, pxY] = project(v.lng, v.lat);
    ctx.beginPath();
    ctx.arc(pxX, pxY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${v.id}`, pxX + 7, pxY + 3);
  });

  // 9. North Arrow (Compass Rose)
  const compassX = width - 50;
  const compassY = 55;
  ctx.save();
  ctx.beginPath();
  ctx.arc(compassX, compassY, 22, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(compassX, compassY - 18);
  ctx.lineTo(compassX - 6, compassY);
  ctx.lineTo(compassX + 6, compassY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(compassX, compassY + 18);
  ctx.lineTo(compassX - 6, compassY);
  ctx.lineTo(compassX + 6, compassY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('N', compassX - 4, compassY - 6);
  ctx.restore();

  // 10. Title Block & Legend Box
  const legendBoxX = width - 310;
  const legendBoxY = height - 160;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(legendBoxX, legendBoxY, 290, 140);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(legendBoxX, legendBoxY, 290, 140);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`PLANO CARTOGRÁFICO CTM12 - ${evaluation.metadata.codigoExpediente}`, legendBoxX + 10, legendBoxY + 20);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '10px sans-serif';
  ctx.fillText(`Origen Único CTM12 (EPSG:9377)`, legendBoxX + 10, legendBoxY + 35);

  // Legend Items
  const drawLegendItem = (y: number, color: string, label: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(legendBoxX + 10, y, 14, 10);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(legendBoxX + 10, y, 14, 10);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(label, legendBoxX + 30, y + 8);
  };

  drawLegendItem(legendBoxY + 48, '#0284c7', `Solicitud Original (${evaluation.resumenEjecutivo.areaTotalHa} Ha)`);
  drawLegendItem(legendBoxY + 68, '#10b981', `Área Libre Remanente (${evaluation.resumenEjecutivo.areaDisponiblePreliminarHa} Ha)`);
  drawLegendItem(legendBoxY + 88, '#ef4444', `Exclusión Cat. A / BST (${evaluation.resumenEjecutivo.areaExclusionesAcreditadasHa} Ha)`);
  drawLegendItem(legendBoxY + 108, '#f59e0b', `Restricción Cat. B / Ley 2da`);

  return canvas.toDataURL('image/jpeg', 0.9);
}

export async function exportPdfReport(
  evaluation: EvaluationResult,
  mapContainerElement?: HTMLElement | null
): Promise<void> {
  const m = evaluation.metadata;
  const r = evaluation.resumenEjecutivo;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let currentY = 16;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DICTAMEN TÉCNICO-JURÍDICO DE VIABILIDAD MINERO-AMBIENTAL', margin, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('REPUBLICA DE COLOMBIA • AGENCIA NACIONAL DE MINERÍA • CTM12 EPSG:9377', margin, 18);
  doc.text(`ID: ${evaluation.evalId} | Fecha: ${new Date().toLocaleDateString('es-CO')}`, pageWidth - margin, 18, { align: 'right' });

  currentY = 34;

  // Verdict Banner
  let bannerColor: [number, number, number] = [16, 185, 129];
  let verdictTitle = 'SIN IMPEDIMENTO IDENTIFICADO';
  if (evaluation.viabilidadGeneral === 'NO_VIABLE_EXCLUSION') {
    bannerColor = [225, 29, 72];
    verdictTitle = 'NO VIABLE POR EXCLUSIÓN MINERA (CATEGORÍA A)';
  } else if (evaluation.viabilidadGeneral === 'NO_VIABLE_CONFLICTO') {
    bannerColor = [147, 51, 234];
    verdictTitle = 'NO VIABLE POR CONFLICTO DE TENENCIA PREVIA ANM';
  } else if (evaluation.viabilidadGeneral === 'VIABILIDAD_CONDICIONADA') {
    bannerColor = [217, 119, 6];
    verdictTitle = 'VIABILIDAD CONDICIONADA A AUTORIZACIONES O SUSTRACCIÓN';
  }

  doc.setFillColor(bannerColor[0], bannerColor[1], bannerColor[2]);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 11, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(verdictTitle, margin + 4, currentY + 7);

  currentY += 15;

  // 1. Metadata Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Identificación del Expediente / Solicitud', margin, currentY);
  currentY += 4;

  const mpioText = m.municipiosDetalle && m.municipiosDetalle.length > 0
    ? m.municipiosDetalle.map((md) => `${md.municipio} (${md.porcentaje}%)`).join(', ')
    : m.municipios.join(', ');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    head: [['Parámetro Oficial', 'Valor / Descripción Registrada']],
    body: [
      ['Expediente / Placa', m.codigoExpediente],
      ['Titular / Proponente', m.titularOSolicitante],
      ['Tipo de Registro', m.tipoRegistro === 'PROPUESTA_NUEVA' ? 'Propuesta Nueva en Evaluación Previa' : 'Título Registrado ANM'],
      ['Estado / Etapa ANM', m.estadoAdministrativo],
      ['Escala Minera (Dec. 1666/16)', `${m.clasificacionMinera} Minería (${r.areaTotalHa.toLocaleString('es-CO')} Ha)`],
      ['Tope Legal (Art. 24 Ley 685)', m.excedeTopeLegal ? 'EXCEDE EL LÍMITE DE 10.000 HA' : 'Dentro del límite legal de 10.000 Ha'],
      ['Ubicación Territorial', `${m.departamento} - ${mpioText}`],
      ['Minerales de Interés', m.minerales.slice(0, 6).join(', ')],
      ['Sistema de Coordenadas', m.sistemaReferencia],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 2. Map Plan Graphic Image (Isotropic 1:1 scale distortion-free)
  if (currentY + 80 > 270) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. Evidencia Cartográfica: Plano CTM12 del Polígono y Recorte', margin, currentY);
  currentY += 4;

  const mapGraphicUrl = generateMapGraphicDataUrl(evaluation);
  if (mapGraphicUrl) {
    doc.addImage(mapGraphicUrl, 'JPEG', margin, currentY, pageWidth - margin * 2, 75);
    currentY += 79;
  }

  // 3. Balance of Surfaces Table
  if (currentY + 45 > 270) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('3. Balance Geodésico de Superficies CTM12', margin, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5 },
    head: [['Categoría de Superficie', 'Área (Hectáreas)', 'Participación (%)', 'Efecto Jurídico']],
    body: [
      ['Superficie Total Solicitada', `${r.areaTotalHa} Ha`, '100.00%', 'Base de la evaluación'],
      ['Exclusiones Categoría A', `${r.areaExclusionesAcreditadasHa} Ha`, `${r.porcentajeExclusion}%`, 'Prohibición absoluta / Recorte forzoso'],
      ['Restricciones Categoría B', `${r.areaRestriccionesCondicionadasHa} Ha`, `${r.porcentajeRestricciones}%`, 'Trámite habilitante / Sustracción'],
      ['Conflictos de Tenencia ANM', `${r.areaConflictosMinerosHa} Ha`, `${r.porcentajeConflictos}%`, 'Prelación temporal (Art. 16)'],
      ['ÁREA LIBRE REMANENTE (CTM12)', `${r.areaDisponiblePreliminarHa} Ha`, `${r.porcentajeDisponible}%`, 'Superficie susceptible de otorgamiento'],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 4. Conclusions
  if (currentY + 40 > 270) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('4. Conclusiones Jurídico-Técnicas', margin, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  r.conclusionesClave.forEach((c) => {
    const lines = doc.splitTextToSize(`• ${c}`, pageWidth - margin * 2);
    doc.text(lines, margin, currentY);
    currentY += lines.length * 3.5;
  });

  // 5. Table of First 100 Vertices (WGS84 & CTM12 Este X, Norte Y)
  const vertices = extractVertices(evaluation.baseGeometry, 100);
  if (vertices.length > 0) {
    doc.addPage();
    currentY = 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('5. Cuadro de Coordenadas de la Solicitud (Primeros 100 Vértices CTM12)', margin, currentY);
    currentY += 4;

    const vertBody = vertices.map((v) => [
      v.id.toString(),
      v.lat.toFixed(6),
      v.lng.toFixed(6),
      `${v.esteCTM12.toLocaleString('es-CO')} m`,
      `${v.norteCTM12.toLocaleString('es-CO')} m`,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, font: 'courier' },
      head: [['Vértice #', 'Latitud (WGS84)', 'Longitud (WGS84)', 'Este X (m CTM12)', 'Norte Y (m CTM12)']],
      body: vertBody,
    });
  }

  // Footer Disclaimer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Documento emitido por el Motor de Inteligencia Jurídico-Minera de Colombia. Conforme al Art. 34 y 35 de la Ley 685 de 2001.',
      margin,
      287
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, 287, { align: 'right' });
  }

  doc.save(`Dictamen_Minero_${m.codigoExpediente}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
