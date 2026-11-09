import * as XLSX from 'xlsx';
import { EvaluationResult } from '../types/mining';
import { extractVertices } from './clippingEngine';

export function exportExcelReport(evaluation: EvaluationResult): void {
  const m = evaluation.metadata;
  const r = evaluation.resumenEjecutivo;
  const wb = XLSX.utils.book_new();

  // 1. Resumen Ejecutivo
  const resumenData = [
    ['REPORTE OFICIAL DE EVALUACIÓN JURÍDICO-AMBIENTAL MINERA'],
    ['AGENCIA NACIONAL DE MINERÍA (AnnA Minería / CTM12)'],
    [''],
    ['DATOS GENERALES DE LA SOLICITUD'],
    ['Código Expediente / Placa', m.codigoExpediente],
    ['Placa Unificada ANM', m.placa],
    ['Titular / Proponente', m.titularOSolicitante],
    ['Tipo de Registro', m.tipoRegistro],
    ['Fecha de Radicación', m.fechaRadicacion],
    ['Estado Administrativo', m.estadoAdministrativo],
    ['Etapa Minera Oficial', m.etapaMinera || 'Explotación'],
    ['Escala Minera (Dec. 1666/16)', `${m.clasificacionMinera} Minería`],
    ['Tope Legal (Art. 24 L 685)', m.excedeTopeLegal ? 'EXCEDE 10.000 HA (ALERTA)' : 'Cumple tope legal (<=10.000 Ha)'],
    ['Departamento(s)', m.departamento],
    ['Municipio(s)', m.municipios.join(', ')],
    ['Vereda(s)', m.veredas.join(', ')],
    ['Sistema de Referencia', m.sistemaReferencia],
    ['Fuente Oficial', m.fuenteOficial],
    [''],
    ['BALANCE OFICIAL DE SUPERFICIES Y RECORTE'],
    ['Área Total Solicitada (Ha)', r.areaTotalHa],
    ['Área Exclusiones Categoría A (Ha)', r.areaExclusionesAcreditadasHa],
    ['Porcentaje Exclusión (%)', `${r.porcentajeExclusion}%`],
    ['Área Restricciones Categoría B (Ha)', r.areaRestriccionesCondicionadasHa],
    ['Porcentaje Restricciones (%)', `${r.porcentajeRestricciones}%`],
    ['Área Conflictos Tenencia ANM (Ha)', r.areaConflictosMinerosHa],
    ['Porcentaje Conflictos (%)', `${r.porcentajeConflictos}%`],
    ['Área Libre Remanente CTM12 (Ha)', r.areaDisponiblePreliminarHa],
    ['Porcentaje Disponible Remanente (%)', `${r.porcentajeDisponible}%`],
    [''],
    ['DICTAMEN Y CATEGORÍA JURÍDICA'],
    ['Categoría Viabilidad', evaluation.viabilidadGeneral],
    ['Exclusiones Detectadas', r.totalExclusionesDetectadas],
    ['Restricciones Detectadas', r.totalRestriccionesDetectadas],
    ['Conflictos ANM Detectados', r.totalConflictosDetectados],
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

  // 2. Exclusiones Categoría A
  const exclusionesA = evaluation.afectacionesAmbientales.filter((a) => a.categoria === 'A');
  const exclRows = exclusionesA.map((item, idx) => ({
    Item: idx + 1,
    Figura: item.figura,
    'Nombre Oficial / Sector': item.nombreOficial,
    'Área Afectada (Ha)': item.areaAfectadaHa,
    'Afectación (%)': `${item.porcentajeAfectacion}%`,
    'Norma Legal': item.normaLegal,
    Artículo: item.articulo,
    'Acto Administrativo': item.actoAdministrativo,
    Autoridad: item.autoridadCompetente,
    Efecto: 'Prohibición Legal Absoluta e Insubsanable (Recorte Forzoso)',
  }));
  const wsExcl = XLSX.utils.json_to_sheet(exclRows.length > 0 ? exclRows : [{ Mensaje: 'Sin exclusiones Categoría A detectadas' }]);
  XLSX.utils.book_append_sheet(wb, wsExcl, 'Exclusiones Cat. A');

  // 3. Restricciones Categoría B
  const restriccionesB = evaluation.afectacionesAmbientales.filter((a) => a.categoria === 'B');
  const restrRows = restriccionesB.map((item, idx) => ({
    Item: idx + 1,
    Figura: item.figura,
    'Nombre Oficial / Sector': item.nombreOficial,
    'Área Afectada (Ha)': item.areaAfectadaHa,
    'Afectación (%)': `${item.porcentajeAfectacion}%`,
    'Norma Legal': item.normaLegal,
    Artículo: item.articulo,
    Autoridad: item.autoridadCompetente,
    'Procedimiento Requerido': item.procedimientoRequerido,
  }));
  const wsRestr = XLSX.utils.json_to_sheet(restrRows.length > 0 ? restrRows : [{ Mensaje: 'Sin restricciones Categoría B detectadas' }]);
  XLSX.utils.book_append_sheet(wb, wsRestr, 'Restricciones Cat. B');

  // 4. Conflictos Tenencia ANM
  const confRows = evaluation.conflictosMineros.map((item, idx) => ({
    Item: idx + 1,
    'Expediente / Placa': item.expediente,
    'Tipo de Derecho': item.tipoDerecho,
    Titular: item.titular,
    Estado: item.estado,
    'Área Superpuesta (Ha)': item.areaSuperpuestaHa,
    'Superposición (%)': `${item.porcentajeSuperposicion}%`,
    Relación: item.tipoRelacion,
    'Distancia (Km)': item.distanciaKm,
    Minerales: item.minerales || 'No especificados',
    'Observación Jurídica': item.observacionJuridica,
  }));
  const wsConf = XLSX.utils.json_to_sheet(confRows.length > 0 ? confRows : [{ Mensaje: 'Sin conflictos de tenencia previa ANM' }]);
  XLSX.utils.book_append_sheet(wb, wsConf, 'Conflictos Tenencia ANM');

  // 5. Distritos Mineros Especiales
  const distritosRows = m.distritoMineroDetalle
    ? [
        {
          'Distrito Minero Especial': m.distritoMineroDetalle.nombre,
          Departamento: m.distritoMineroDetalle.departamento,
          'Área en Concurrencia (Ha)': m.distritoMineroDetalle.areaAfectadaHa,
          'Porcentaje (%)': `${m.distritoMineroDetalle.porcentajeAfectacion}%`,
          'Marco Normativo': 'Decreto 044 de 2024 / Resoluciones MinMinas',
          Estado: m.distritoMineroDetalle.estadoNormativo,
        },
      ]
    : [{ Mensaje: 'No presenta intersección con Distritos Mineros Especiales del Decreto 044/2024' }];
  const wsDist = XLSX.utils.json_to_sheet(distritosRows);
  XLSX.utils.book_append_sheet(wb, wsDist, 'Distritos Mineros');

  // 6. Localización Municipal
  const mpioRows = m.municipiosDetalle && m.municipiosDetalle.length > 0
    ? m.municipiosDetalle.map((md, idx) => ({
        Item: idx + 1,
        Departamento: md.departamento,
        Municipio: md.municipio,
        'Área en Municipio (Ha)': md.areaHa,
        'Participación (%)': `${md.porcentaje}%`,
      }))
    : m.municipios.map((mp, idx) => ({
        Item: idx + 1,
        Departamento: m.departamento,
        Municipio: mp,
        'Área Estimada (Ha)': r.areaTotalHa,
        'Participación (%)': '100%',
      }));
  const wsMpio = XLSX.utils.json_to_sheet(mpioRows);
  XLSX.utils.book_append_sheet(wb, wsMpio, 'Localización Municipal');

  // 7. Vértices Coordenadas WGS84
  const vertices = extractVertices(evaluation.baseGeometry, 100);
  const wgsRows = vertices.map((v) => ({
    'Vértice #': v.id,
    'Latitud (WGS84)': v.lat,
    'Longitud (WGS84)': v.lng,
    Datum: 'WGS84 (EPSG:4326)',
  }));
  const wsWgs = XLSX.utils.json_to_sheet(wgsRows.length > 0 ? wgsRows : [{ Mensaje: 'Sin vértices extraídos' }]);
  XLSX.utils.book_append_sheet(wb, wsWgs, 'Vértices WGS84');

  // 8. Vértices Coordenadas CTM12 (EPSG:9377)
  const ctmRows = vertices.map((v) => ({
    'Vértice #': v.id,
    'Este X (m CTM12)': v.esteCTM12,
    'Norte Y (m CTM12)': v.norteCTM12,
    Origen: 'Origen Nacional CTM12 (EPSG:9377)',
  }));
  const wsCtm = XLSX.utils.json_to_sheet(ctmRows.length > 0 ? ctmRows : [{ Mensaje: 'Sin vértices CTM12' }]);
  XLSX.utils.book_append_sheet(wb, wsCtm, 'Vértices CTM12');

  // Export File
  const filename = `Dictamen_Minero_${m.codigoExpediente}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
