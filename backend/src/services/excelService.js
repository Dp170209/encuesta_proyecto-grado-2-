const XLSX = require('xlsx');

/**
 * Genera un archivo Excel (.xlsx) con el consolidado analítico de la USEI
 * @param {Object} data - { resumenCarreras, detalleEstudiantes, totales }
 * @returns {Buffer}
 */
function generarReporteExcel({ resumenCarreras, detalleEstudiantes, totales }) {
  const wb = XLSX.utils.book_new();

  // =========================================================================
  // HOJA 1: RESUMEN DE COBERTURA POR CARRERA (Kardex vs USEI)
  // =========================================================================
  const filasResumen = [
    ['SISTEMA INTEGRADO DE SEGUIMIENTO A GRADUADOS - USEI UCB'],
    ['REPORTE CONSOLIDADO DE COBERTURA Y TASA DE RESPUESTA'],
    [`Generado el: ${new Date().toLocaleString('es-BO')}`],
    [], // fila vacía
    [
      'Carrera',
      'Inscritos Kardex',
      'Encuestas Llenadas',
      'Brecha (Pendientes)',
      'Tasa de Cobertura (%)',
    ],
  ];

  resumenCarreras.forEach((c) => {
    filasResumen.push([
      c.carrera,
      parseInt(c.total_kardex, 10),
      parseInt(c.encuestas_completadas, 10),
      parseInt(c.brecha_pendientes, 10),
      `${parseFloat(c.tasa_cobertura_pct).toFixed(1)}%`,
    ]);
  });

  // Fila de totales generales
  if (totales) {
    filasResumen.push([
      'TOTAL GENERAL',
      parseInt(totales.total_habilitados, 10),
      parseInt(totales.encuestas_finalizadas, 10),
      parseInt(totales.brecha_pendientes, 10),
      `${parseFloat(totales.tasa_respuesta_pct).toFixed(1)}%`,
    ]);
  }

  const wsResumen = XLSX.utils.aoa_to_sheet(filasResumen);

  // Definir anchos de columna para Hoja 1
  wsResumen['!cols'] = [
    { wch: 35 }, // Carrera
    { wch: 18 }, // Inscritos Kardex
    { wch: 20 }, // Encuestas Llenadas
    { wch: 22 }, // Brecha
    { wch: 24 }, // Tasa
  ];

  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen_Carreras');

  // =========================================================================
  // HOJA 2: DETALLE NOMINAL DE GRADUADOS Y ESTADO DE ENCUESTA
  // =========================================================================
  const filasDetalle = [
    [
      'Carnet de Identidad',
      'Apellidos',
      'Nombres',
      'Carrera',
      'Modalidad de Titulación',
      'Semestre / Gestión',
      'Estado de Encuesta',
      'Fecha de Registro',
      'Correo Privado Registrado',
    ],
  ];

  detalleEstudiantes.forEach((est) => {
    filasDetalle.push([
      est.carnet_identidad,
      est.apellidos,
      est.nombres,
      est.carrera,
      est.modalidad_titulacion || 'N/A',
      est.gestion_semestre || 'N/A',
      est.estado_encuesta,
      est.fecha_registro ? new Date(est.fecha_registro).toLocaleString('es-BO') : 'Pendiente',
      est.correo_privado || 'No registrado',
    ]);
  });

  const wsDetalle = XLSX.utils.aoa_to_sheet(filasDetalle);

  // Definir anchos de columna para Hoja 2
  wsDetalle['!cols'] = [
    { wch: 18 }, // Carnet
    { wch: 22 }, // Apellidos
    { wch: 22 }, // Nombres
    { wch: 30 }, // Carrera
    { wch: 25 }, // Modalidad
    { wch: 20 }, // Gestión
    { wch: 20 }, // Estado
    { wch: 22 }, // Fecha
    { wch: 30 }, // Correo
  ];

  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle_Nominal_Graduados');

  // Retornar como Buffer binario
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return excelBuffer;
}

/**
 * Genera un archivo Excel (.xlsx) con la base de datos completa de respuestas
 * de encuestas con nombres de columnas claros en español y hoja de resumen.
 */
function generarExcelRespuestasDetalladas({ respuestas, filtrosAplicados }) {
  const wb = XLSX.utils.book_new();

  // =========================================================================
  // HOJA 1: BASE DE DATOS COMPLETA DE RESPUESTAS (100% DE CAMPOS ANEXO 3)
  // =========================================================================
  const cabeceras = [
    // Metadatos y Registro
    'N°',
    'N° Certificado',
    'Fecha de Registro',
    'Carnet de Identidad',
    'Apellidos',
    'Nombres',
    'Carrera',
    'Modalidad de Titulación',
    'Semestre / Gestión',
    // Sección 1: Datos Generales
    'Año de Ingreso',
    'Edad',
    'Sexo',
    'Teléfono Fijo',
    'Teléfono Celular',
    'Correo Electrónico Personal',
    'Ciudad de Nacimiento',
    'Ciudad de Residencia',
    'Dirección de Domicilio',
    // Sección 2: Información Familiar y Académica
    'Estado Civil',
    '¿Tiene Hijos?',
    'Nivel Instrucción del Padre',
    'Nivel Instrucción de la Madre',
    'Limitaciones Permanentes / Discapacidad',
    'Motivo Elección de Carrera',
    '¿Pensó o gestionó cambio de carrera?',
    'Motivo Cambio de Carrera',
    'Principal Fuente de Financiamiento',
    // Sección 3: Satisfacción y Competencias Desarrolladas
    'Competencia: Aprendizaje Autónomo',
    'Competencia: Respeto a la Diversidad',
    'Competencia: Capacidad Analítica',
    'Competencia: Pensamiento Crítico',
    'Competencia: Trabajo en Equipo',
    'Competencia: Capacidad de Innovación',
    'Competencia: Adaptación al Cambio',
    'Competencia: Enfoque en Derechos Humanos',
    'Idioma Extranjero en Colegio/Bachillerato',
    'Inglés: Comprensión Lectora',
    'Inglés: Comprensión Auditiva',
    'Inglés: Expresión Escrita',
    'Inglés: Expresión Oral',
    'Informática: Correo Electrónico y Búsquedas',
    'Informática: Navegación Web y Plataformas',
    'Informática: Procesador de Textos',
    'Informática: Hojas de Cálculo',
    'Docentes: Dominio de la Materia',
    'Docentes: Estrategias de Enseñanza',
    'Docentes: Criterios Claros de Evaluación',
    'Administrativos: Personal Calificado',
    'Administrativos: Trato Cordial y Respetuoso',
    'Administrativos: Atención Oportuna',
    'Bienestar: Pastoral Universitaria',
    'Bienestar: Actividades Culturales y Deportivas',
    'Bienestar: Programa de Becas',
    'Bienestar: Servicios de Salud',
    'Infraestructura: Seguridad y Vigilancia',
    'Infraestructura: Espacios de Esparcimiento',
    'Infraestructura: Laboratorios y Talleres',
    'Infraestructura: Sanitarios / Baños',
    'Infraestructura: Aulas de Clase',
    'Infraestructura: Equipos Tecnológicos',
    'Infraestructura: Conexión Wi-Fi',
    '¿Volvería a estudiar en la UCB?',
    'Motivo por el que SÍ volvería a estudiar',
    'Motivo por el que NO volvería a estudiar',
    '¿Realizó viajes de intercambio?',
    '¿Participó en sociedades u organizaciones estudiantiles?',
    '¿Participó en actividades extracurriculares?',
    'Valoración de actividades extracurriculares',
    '¿Participó en programas de voluntariado?',
    'Tipo de voluntariado',
    // Sección 4: Actividad Laboral
    'Situación / Actividad Laboral Actual',
    '¿Es su primer empleo?',
    'Antigüedad Laboral',
    '¿Es propietario o socio?',
    'Tipo de Institución / Empleador',
    'Relación del trabajo con la carrera',
    'Dedicación semanal (Horas)',
    'Modalidad de vinculación / Contrato',
    'Rango Salarial Mensual',
    'Medio por el que consiguió el empleo',
    '¿Está interesado en conseguir trabajo?',
    '¿Realiza gestiones activas de búsqueda?',
    'Motivo principal por el que no encuentra empleo',
    // Sección 5: Postgrado y Educación Continua
    '¿Realizó estudios de postgrado?',
    'Máximo grado académico obtenido',
    'Grado al que postula actualmente',
    '¿Interés en realizar postgrado en UCB?',
    'Grado académico de mayor interés',
    'Área temática de interés en postgrado',
  ];

  const filas = [cabeceras];

  respuestas.forEach((item, idx) => {
    const json = item.contenido_json || {};
    filas.push([
      // Metadatos y Registro
      idx + 1,
      item.nro_certificado ? `USEI-2026-${String(item.nro_certificado).padStart(5, '0')}` : 'Sin Nro',
      item.fecha_registro ? new Date(item.fecha_registro).toLocaleString('es-BO') : '',
      item.carnet_identidad || '',
      item.apellidos || '',
      item.nombres || '',
      item.carrera || '',
      item.modalidad_titulacion || json.S2_ModalidadTitulacion || '',
      item.gestion_semestre || `${item.gestion_academica || '2026'}-1`,
      // Sección 1: Datos Generales
      json.S1_AnioIngreso || '',
      json.S1P05_Edad || '',
      json.S1P06_Sexo || '',
      json.S1P07_TelefonoFijo || 'No registra',
      item.celular || json.S1P08_Celular || '',
      item.correo_privado || json.S1P09_CorreoElectronico || '',
      json.S1P10_CiudadNacimiento || '',
      json.S1P12_CiudadResidencia || 'La Paz',
      json.S1P13_Direccion || '',
      // Sección 2: Información Familiar y Académica
      json.S2P01_EstadoCivil || '',
      json.S2P02_TieneHijos || '',
      json.S2P03_NivelPadre || '',
      json.S2P04_NivelMadre || '',
      json.S2P05_LimitacionesPermanentes || 'Ninguna',
      json.S3P01_MotivoEleccionCarrera || '',
      json.S3P02_CambioCarrera || 'No',
      json.S3P03_MotivoCambioCarrera || 'No aplica',
      json.S3P04_Financiamiento || '',
      // Sección 3: Satisfacción y Competencias Desarrolladas
      json.S4P01_Comp_Autonomo || '',
      json.S4P01_Comp_Diversidad || '',
      json.S4P01_Comp_Analitica || '',
      json.S4P01_Comp_Critica || '',
      json.S4P01_Comp_Equipo || '',
      json.S4P01_Comp_Innovar || '',
      json.S4P01_Comp_Adaptacion || '',
      json.S4P01_Comp_DerechosHumanos || '',
      json.S4P02_BachilleratoIdioma || '',
      json.S4P03_Ingles_Lee || '',
      json.S4P03_Ingles_Escucha || '',
      json.S4P03_Ingles_Escribe || '',
      json.S4P03_Ingles_Habla || '',
      json.S4P04_Info_Correo || '',
      json.S4P04_Info_Web || '',
      json.S4P04_Info_Texto || '',
      json.S4P04_Info_Calculo || '',
      json.S4P05_Docente_Dominio || '',
      json.S4P05_Docente_Estrategias || '',
      json.S4P05_Docente_Evaluacion || '',
      json.S4P06_Admin_Calificado || '',
      json.S4P06_Admin_Cordial || '',
      json.S4P06_Admin_Oportuno || '',
      json.S4P07_Bienestar_Pastoral || '',
      json.S4P07_Bienestar_Cultural || '',
      json.S4P07_Bienestar_Becas || '',
      json.S4P07_Bienestar_Salud || '',
      json.S4P08_Infra_Seguridad || '',
      json.S4P08_Infra_Espacios || '',
      json.S4P08_Infra_Laboratorios || '',
      json.S4P08_Infra_Banios || '',
      json.S4P08_Infra_Aulas || '',
      json.S4P08_Infra_Equipos || '',
      json.S4P08_Infra_Wifi || '',
      json.S4P09_0_VolveriaEstudiar || '',
      json.S4P09_1_MotivoVolveria || 'No aplica',
      json.S4P09_2_MotivoNoVolveria || 'No aplica',
      json.S4P09_3_ViajeIntercambio || 'No',
      json.S4P09_4_OrgEstudiantil || 'No',
      json.S4P09_5_Extracurriculares || 'No',
      json.S4P09_5_1_ValoracionExtracurricular || 'No aplica',
      json.S4P09_6_Voluntariado || 'No',
      json.S4P09_6_TipoVoluntariado || 'No aplica',
      // Sección 4: Actividad Laboral
      json.S5P01_ActividadActual || '',
      json.S5P01_1_PrimerEmpleo || 'No aplica',
      json.S5P01_2_Antiguedad || 'No aplica',
      json.S5P01_3_PropietarioSocio || 'No aplica',
      json.S5P01_4_TipoInstitucion || 'No aplica',
      json.S5P01_5_RelacionEstudios || 'No aplica',
      json.S5P01_6_HorasSemana || 'No aplica',
      json.S5P01_7_ModalidadVinculacion || 'No aplica',
      json.S5P01_8_RangoSalarial || 'No aplica',
      json.S5P01_9_ComoConsiguioEmpleo || 'No aplica',
      json.S5P02_1_InteresadoEnEmpleo || 'No aplica',
      json.S5P02_2_GestionBusqueda || 'No aplica',
      json.S5P02_3_MotivoNoEncuentra || 'No aplica',
      // Sección 5: Postgrado y Educación Continua
      json.S6P01_RealizoPostgrado || 'No',
      json.S6P01_1_MaximoGradoObtenido || '',
      json.S6P01_2_GradoPostulando || 'No aplica',
      json.S6P01_3_InteresPostgradoUCB || '',
      json.S6P02_1_GradoInteresAlcanzar || '',
      json.S6P02_2_AreaInteresPostgrado || '',
    ]);
  });

  const wsRespuestas = XLSX.utils.aoa_to_sheet(filas);

  // Definir anchos adaptados dinámicamente según cabeceras
  wsRespuestas['!cols'] = cabeceras.map((h) => ({
    wch: Math.max(h.length + 3, 16),
  }));

  XLSX.utils.book_append_sheet(wb, wsRespuestas, 'Respuestas_Estudiantes');

  // =========================================================================
  // HOJA 2: METADATOS Y FILTROS APLICADOS
  // =========================================================================
  const filasMeta = [
    ['SISTEMA INTEGRADO DE SEGUIMIENTO A GRADUADOS - USEI UCB'],
    ['REGISTRO DE EXPORTACIÓN DE BASE DE DATOS'],
    [`Fecha y hora de exportación: ${new Date().toLocaleString('es-BO')}`],
    [],
    ['Parámetro', 'Valor Aplicado'],
    ['Filtro por Carrera', filtrosAplicados?.carrera || 'Todas las carreras'],
    ['Filtro por Semestre', filtrosAplicados?.semestre || 'Todos los semestres'],
    ['Rango Fecha Desde', filtrosAplicados?.fecha_desde || 'Sin restricción'],
    ['Rango Fecha Hasta', filtrosAplicados?.fecha_hasta || 'Sin restricción'],
    ['Total de Encuestas Exportadas', respuestas.length],
  ];

  const wsMeta = XLSX.utils.aoa_to_sheet(filasMeta);
  wsMeta['!cols'] = [{ wch: 30 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Información_Exportación');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  generarReporteExcel,
  generarExcelRespuestasDetalladas,
};
