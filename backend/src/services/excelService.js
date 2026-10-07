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

module.exports = {
  generarReporteExcel,
};
