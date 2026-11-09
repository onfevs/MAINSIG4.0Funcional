import { LegalRule } from '../types/mining';

export const COLOMBIAN_LEGAL_RULES: LegalRule[] = [
  {
    id: 'LIMITE_MAXIMO_AREA_ART24',
    figura: 'Límite Máximo Legal por Propuesta Minera (10.000 Hectáreas)',
    tipoRestriccion: 'A',
    norma: 'Ley 685 de 2001 (Código de Minas)',
    articulo: 'Artículo 24',
    textoRelevante:
      'La extensión máxima de la zona de concesión será de hasta 10.000 hectáreas. Ninguna propuesta de contrato de concesión minera podrá exceder este límite legal absoluto en el territorio colombiano.',
    urlOficial: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=8242',
    fechaExpedicion: '2001-08-15',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: ['Sentencia C-339 de 2002'],
    etapaMineraAfectada: ['Presentación de Propuesta', 'Otorgamiento de Concesión'],
    autoridadCompetente: 'Agencia Nacional de Minería (ANM)',
    condicionesAplicacion:
      'Si un polígono o solicitud excede 10.000 Hectáreas, es legalmente inadmisible y la ANM debe requerir recorte obligatorio o rechazar la propuesta.',
  },
  {
    id: 'CLASIFICACION_ESCALA_DEC1666',
    figura: 'Clasificación Minera Oficial: Pequeña, Mediana y Gran Escala',
    tipoRestriccion: 'B',
    norma: 'Decreto 1666 de 2016 / Decreto 1073 de 2015',
    articulo: 'Artículos 2.2.5.1.5.1 a 2.2.5.1.5.4',
    textoRelevante:
      'Clasifica la minería en Colombia según el área en hectáreas y volumen de producción. Pequeña: hasta 150 Ha (metales preciosos) o 100 Ha (carbón/construcción); Mediana: mayor a 100/150 Ha hasta 5.000 Ha; Gran Minería: mayor a 5.000 Ha hasta el tope de 10.000 Ha.',
    urlOficial: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78151',
    fechaExpedicion: '2016-10-21',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: ['Consejo de Estado Rad. 11001-03-26-000-2017-00084-00'],
    etapaMineraAfectada: ['Licenciamiento Ambiental (CAR vs ANLA)', 'PTO', 'Seguridad Minera'],
    autoridadCompetente: 'Ministerio de Minas y Energía / ANM / ANLA',
    condicionesAplicacion:
      'Define la competencia de la autoridad ambiental: Pequeña y Mediana minería ante las CAR; Gran Minería obligatoriamente ante la ANLA.',
  },
  {
    id: 'PARAMOS_LEY_1930',
    figura: 'Ecosistema de Páramo Delimitado',
    tipoRestriccion: 'A',
    norma: 'Ley 1930 de 2018',
    articulo: 'Artículo 5, numeral 1',
    textoRelevante:
      'Se prohíbe el desarrollo de actividades de exploración y explotación minera, de hidrocarburos, así como la construcción de refinerías en los ecosistemas de páramo delimitados conforme a la cartografía oficial del Ministerio de Ambiente y Desarrollo Sostenible.',
    urlOficial: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=87834',
    fechaExpedicion: '2018-07-27',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: [
      'Sentencia C-035 de 2016 (Corte Constitucional - Prohibición absoluta sin derechos adquiridos)',
      'Sentencia T-361 de 2017 (Orden de nueva delimitación participativa de Santurbán)',
    ],
    etapaMineraAfectada: [
      'Presentación de Propuesta',
      'Otorgamiento de Concesión',
      'Exploración',
      'Explotación',
    ],
    autoridadCompetente: 'Ministerio de Ambiente y Desarrollo Sostenible (MADS) e Instituto Humboldt',
    condicionesAplicacion:
      'Aplica sobre áreas de páramos con resolución oficial de delimitación expedida por el MADS. La prohibición es tajante y opera de pleno derecho.',
  },
  {
    id: 'PNN_LEY_685_ART34',
    figura: 'Parques Nacionales Naturales (PNN)',
    tipoRestriccion: 'A',
    norma: 'Ley 685 de 2001 (Código de Minas)',
    articulo: 'Artículo 34',
    textoRelevante:
      'No podrán ejecutarse trabajos y obras de exploración y explotación mineras en zonas declaradas y delimitadas conforme a la normativa vigente como de protección y desarrollo de los recursos naturales renovables o del ambiente... En particular el Sistema de Parques Nacionales Naturales.',
    urlOficial: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=8242',
    fechaExpedicion: '2001-08-15',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: [
      'Sentencia C-339 de 2002 (Corte Constitucional - Constitucionalidad condicionada)',
      'Sentencia C-035 de 2016',
    ],
    etapaMineraAfectada: [
      'Presentación de Propuesta',
      'Otorgamiento de Concesión',
      'Exploración',
      'Explotación',
    ],
    autoridadCompetente: 'Parques Nacionales Naturales de Colombia (PNNC)',
    condicionesAplicacion:
      'Exclusión minera total e insubsanable. La ANM debe rechazar de plano cualquier propuesta superpuesta en un 100% o recortar el área superpuesta.',
  },
  {
    id: 'PNR_REGIONALES_ART34',
    figura: 'Parques Naturales Regionales (PNR)',
    tipoRestriccion: 'A',
    norma: 'Ley 685 de 2001 & Decreto 1076 de 2015',
    articulo: 'Artículo 34 Ley 685 / Art. 2.2.2.1.2.4 Dec 1076',
    textoRelevante:
      'Los Parques Naturales Regionales son áreas protegidas públicas reservadas y declaradas por las Corporaciones Autónomas Regionales (CAR) excluidas expresamente de minería.',
    urlOficial: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153',
    fechaExpedicion: '2015-05-26',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: ['Sentencia C-339 de 2002', 'Sentencia C-298 de 2016'],
    etapaMineraAfectada: ['Propuesta', 'Concesión', 'Exploración', 'Explotación'],
    autoridadCompetente: 'Corporaciones Autónomas Regionales (CAR)',
    condicionesAplicacion:
      'Declaratoria mediante Acuerdo del Consejo Directivo de la CAR e inscripción en RUNAP.',
  },
  {
    id: 'RESERVA_FORESTAL_PROTECTORA_NACIONAL',
    figura: 'Reserva Forestal Protectora Nacional (RFPN)',
    tipoRestriccion: 'A',
    norma: 'Ley 685 de 2001 / Decreto 1076 de 2015',
    articulo: 'Artículo 34 Ley 685 / Art. 2.2.2.1.2.3 Dec 1076',
    textoRelevante:
      'Espacios geográficos en los que los ecosistemas de bosque mantienen su función protectora de suelos, cuencas y biodiversidad, quedando legalmente excluidos de actividades extractivas mineras.',
    urlOficial: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153',
    fechaExpedicion: '2015-05-26',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: ['Sentencia C-339 de 2002'],
    etapaMineraAfectada: ['Propuesta', 'Concesión', 'Exploración', 'Explotación'],
    autoridadCompetente: 'Ministerio de Ambiente y Desarrollo Sostenible (MADS)',
    condicionesAplicacion:
      'A diferencia de las Reservas de Ley 2da de 1959 productoras-protectoras, las RFPN poseen categoría estricta de exclusión.',
  },
  {
    id: 'HUMEDAL_RAMSAR_DELIMITADO',
    figura: 'Humedales de Importancia Internacional Ramsar',
    tipoRestriccion: 'A',
    norma: 'Ley 357 de 1997 / Decreto 1076 de 2015',
    articulo: 'Artículo 34 Ley 685 / Convención Ramsar',
    textoRelevante:
      'Sitios designados por el Gobierno Nacional bajo la Convención de Ramsar incorporados al SINAP como áreas de preservación estricta con prohibición de minería a gran escala.',
    urlOficial: 'https://www.ramsar.org/',
    fechaExpedicion: '1997-01-21',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: ['Sentencia C-582 de 1997', 'Sentencia C-035 de 2016'],
    etapaMineraAfectada: ['Propuesta', 'Concesión', 'Exploración', 'Explotación'],
    autoridadCompetente: 'MADS y CAR regional',
    condicionesAplicacion:
      'Exclusión minera total dentro del polígono delimitado por decreto o resolución ministerial.',
  },
  {
    id: 'LEY_SEGUNDA_1959',
    figura: 'Reserva Forestal de Ley 2 de 1959',
    tipoRestriccion: 'B',
    norma: 'Ley 2 de 1959 & Resoluciones MADS 1526/2012 y 110/2022',
    articulo: 'Artículos 1 y 2 Ley 2 / Res 1526 de 2012 MADS',
    textoRelevante:
      'Zonas de Reserva Forestal Nacional (Pacífico, Central, Magdalena, Sierra Nevada, Serranía de los Motilones, Amazonía y Orinoquía). No son exclusión automática pero requieren trámite formal de SUSTRACCIÓN temporal (para exploración) o definitiva (para explotación) ante el Ministerio de Ambiente antes de iniciar actividades mineras.',
    urlOficial: 'https://www.minambiente.gov.co/bosques-biodiversidad-y-servicios-ecosistemicos/sustraccion-de-reservas-forestales/',
    fechaExpedicion: '1959-01-16',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: [
      'Sentencia C-145 de 2015',
      'Auto 264 de 2019 Consejo de Estado',
    ],
    etapaMineraAfectada: ['Exploración (Sustracción Temporal)', 'Explotación (Sustracción Definitiva)'],
    autoridadCompetente: 'Ministerio de Ambiente y Desarrollo Sostenible (MADS)',
    procedimientoRequerido:
      'Radicación de Diagnóstico Ambiental y Estudio de Sustracción de Reserva Forestal Nacional de Ley 2da de 1959 con compensación ambiental por pérdida de cobertura forestal.',
    condicionesAplicacion:
      'Se puede presentar propuesta ante la ANM, pero el contrato incluirá cláusula expresa de condicionamiento a la obtención de la sustracción del área por parte del MADS.',
  },
  {
    id: 'DMI_DISTRITO_MANEJO_INTEGRADO',
    figura: 'Distrito de Manejo Integrado (DMI)',
    tipoRestriccion: 'B',
    norma: 'Decreto 1076 de 2015',
    articulo: 'Artículo 2.2.2.1.2.7',
    textoRelevante:
      'Espacio geográfico que contiene una zonificación interna regulada por su Plan de Manejo Ambiental (PMA). La minería está prohibida en subzonas de Preservación y Restauración, pero puede ser compatible bajo estrictas condiciones en subzonas de Uso Sostenible.',
    urlOficial: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153',
    fechaExpedicion: '2015-05-26',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: ['Sentencia C-298 de 2016'],
    etapaMineraAfectada: ['Otorgamiento de Concesión', 'Licencia Ambiental', 'Explotación'],
    autoridadCompetente: 'Corporación Autónoma Regional (CAR)',
    procedimientoRequerido:
      'Revisión minuciosa del mapa de zonificación del Plan de Manejo Ambiental del DMI expedido por la CAR para verificar la subzona exacta intersectada.',
    condicionesAplicacion:
      'No se puede rechazar de plano sin verificar la zonificación oficial del DMI.',
  },
  {
    id: 'RESGUARDO_INDIGENA_CONSULTA',
    figura: 'Resguardos Indígenas y Comunidades Étnicas',
    tipoRestriccion: 'B',
    norma: 'Convenio 169 de la OIT / Ley 21 de 1991 / Ley 685 de 2001',
    articulo: 'Arts. 121 a 130 Ley 685 / Convenio 169 OIT',
    textoRelevante:
      'Las comunidades indígenas gozan de derecho de prelación para concesiones mineras en sus territorios (Art. 124 Ley 685) y del derecho fundamental a la CONSULTA PREVIA, libre e informada antes de autorizar cualquier proyecto minero que afecte su territorio tradicional.',
    urlOficial: 'https://www.mininterior.gov.co/consulta-previa/',
    fechaExpedicion: '1991-03-04',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: [
      'Sentencia SU-039 de 1997',
      'Sentencia SU-123 de 2018 (Corte Constitucional)',
      'Sentencia T-766 de 2015',
    ],
    etapaMineraAfectada: ['Otorgamiento de Concesión', 'Exploración', 'Explotación', 'Licencia Ambiental'],
    autoridadCompetente: 'Dirección de la Autoridad Nacional de Consulta Previa (DANCP) - Ministerio del Interior',
    procedimientoRequerido:
      'Solicitud de Certificado de Presencia de Comunidades Étnicas ante la DANCP y desarrollo de las fases protocolarias de Consulta Previa.',
    condicionesAplicacion:
      'No constituye exclusión territorial automática; es un condicionamiento constitucional obligatorio no subsanable sin acuerdo o cierre formal.',
  },
  {
    id: 'CONSEJO_COMUNITARIO_LEY_70',
    figura: 'Territorios Colectivos de Comunidades Negras (Ley 70/93)',
    tipoRestriccion: 'B',
    norma: 'Ley 70 de 1993 / Ley 685 de 2001',
    articulo: 'Arts. 131 a 136 Ley 685 / Ley 70 de 1993',
    textoRelevante:
      'Zonas Mineras de Comunidades Negras y territorios adjudicados a Consejos Comunitarios. Cuentan con derecho de prelación y obligatoriedad de Consulta Previa.',
    urlOficial: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=300',
    fechaExpedicion: '1993-08-31',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: ['Sentencia T-909 de 2009', 'Sentencia SU-095 de 2018'],
    etapaMineraAfectada: ['Otorgamiento de Concesión', 'Exploración', 'Explotación'],
    autoridadCompetente: 'DANCP MinInterior y Agencia Nacional de Tierras (ANT)',
    procedimientoRequerido: 'Consulta Previa y validación de prelación minera del Consejo Comunitario.',
    condicionesAplicacion: 'Verificar si el Consejo Comunitario ejerció el derecho preferente.',
  },
  {
    id: 'PERIMETRO_URBANO_ART35',
    figura: 'Zonas de Minería Restringida: Perímetros Urbanos y Construcciones',
    tipoRestriccion: 'B',
    norma: 'Ley 685 de 2001 (Código de Minas)',
    articulo: 'Artículo 35, literales a, b y c',
    textoRelevante:
      'Dentro del perímetro urbano de las ciudades o poblados señalados por los acuerdos municipales; en áreas ocupadas por construcciones rurales habitadas; y en zonas de especial interés arqueológico o histórico. Podrán ejecutarse trabajos sólo con autorización expresa del alcalde, propietario o autoridad competente.',
    urlOficial: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=8242',
    fechaExpedicion: '2001-08-15',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: [
      'Sentencia C-123 de 2014 (Autonomía territorial y concurrencia)',
      'Sentencia C-053 de 2019',
    ],
    etapaMineraAfectada: ['Exploración', 'Explotación', 'Obras de infraestructura'],
    autoridadCompetente: 'Alcaldías Municipales / Concejos Municipales / ICANH',
    procedimientoRequerido:
      'Autorización motivada del Alcalde Municipal previo concepto del Concejo Municipal.',
    condicionesAplicacion: 'No es prohibición absoluta pero condiciona la ejecución material en superficie.',
  },
  {
    id: 'ARE_RESERVA_ESPECIAL',
    figura: 'Áreas de Reserva Especial Minera (ARE)',
    tipoRestriccion: 'B',
    norma: 'Ley 685 de 2001 / Decreto 1073 de 2015',
    articulo: 'Artículo 31 Ley 685 / Art. 2.2.5.2.2.1 Dec 1073',
    textoRelevante:
      'Áreas declaradas por la ANM a solicitud de comunidades mineras tradicionales para formalización. Bloquea temporalmente la radicación de propuestas de terceros sobre las cuadrículas delimitadas.',
    urlOficial: 'https://www.anm.gov.co/?q=formalizacion-minera',
    fechaExpedicion: '2015-05-26',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: ['Sentencia C-389 de 2016'],
    etapaMineraAfectada: ['Presentación de Propuesta', 'Otorgamiento de Concesión'],
    autoridadCompetente: 'Agencia Nacional de Minería (ANM)',
    condicionesAplicacion: 'Impedimento específico para particulares mientras subsista la declaratoria de ARE.',
  },
  {
    id: 'LICENCIAMIENTO_AMBIENTAL_OBLIGATORIO',
    figura: 'Licencia Ambiental Obligatoria (Explotación)',
    tipoRestriccion: 'B',
    norma: 'Ley 99 de 1993 / Decreto 1076 de 2015',
    articulo: 'Art. 49 Ley 99 / Art. 2.2.2.3.2.2 Dec 1076',
    textoRelevante:
      'Ningún título minero otorga por sí mismo el derecho a explotar sin la previa obtención de la Licencia Ambiental Global o Definitiva otorgada por la ANLA (gran minería) o la CAR respectiva (pequeña y mediana minería).',
    urlOficial: 'https://www.anla.gov.co/',
    fechaExpedicion: '1993-12-22',
    vigencia: 'VIGENTE',
    sentenciasRelacionadas: ['Sentencia C-339 de 2002', 'Sentencia C-389 de 2016'],
    etapaMineraAfectada: ['Explotación'],
    autoridadCompetente: 'ANLA o Corporación Autónoma Regional (CAR)',
    procedimientoRequerido:
      'Elaboración de Estudio de Impacto Ambiental (EIA), Diagnóstico Ambiental de Alternativas (DAA) si aplica, y audiencia pública.',
    condicionesAplicacion: 'Condición legal sine qua non para el tránsito de exploración a explotación.',
  },
  {
    id: 'DISTRITOS_MINEROS_DEC_044',
    figura: 'Distritos Mineros Especiales y Reservas Temporales de Protección (Decreto 044 de 2024)',
    tipoRestriccion: 'B',
    norma: 'Decreto 044 de 2024 (MADS y MinMinas) / Resoluciones de Delimitación',
    articulo: 'Artículos 1, 2 y 3',
    textoRelevante:
      'Establece criterios para declarar reservas de recursos naturales de carácter temporal y distritos mineros especiales para la diversificación productiva y ordenamiento minero. Busca reorganizar las áreas mineras tradicionales y de subsistencia, imponiendo restricciones especiales sobre nuevas solicitudes de mediana y gran minería.',
    urlOficial: 'https://www.minambiente.gov.co/decreto-044-de-2024/',
    fechaExpedicion: '2024-01-30',
    vigencia: 'CONDICIONADA',
    sentenciasRelacionadas: [
      'Consejo de Estado Sección Primera (Rad. 11001-03-24-000-2024-00123-00 - Medidas cautelares y demandas de nulidad)',
      'Sentencia C-123 de 2014 (Coordinación y concurrencia)',
    ],
    etapaMineraAfectada: ['Presentación de Propuesta', 'Otorgamiento de Concesión', 'Exploración'],
    autoridadCompetente: 'Ministerio de Minas y Energía, MADS y Agencia Nacional de Minería (ANM)',
    procedimientoRequerido:
      'Verificación de la zonificación específica del distrito minero y articulación con planes de formalización minera local.',
    condicionesAplicacion:
      'Zona especial que no prohíbe de plano la minería pero condiciona la tramitación de nuevas concesiones a la evaluación de la mesa territorial.',
  },
];
