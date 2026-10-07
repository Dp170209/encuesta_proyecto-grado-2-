const db = require('../config/db');
const excelService = require('../services/excelService');

/**
 * Controlador GET /api/analitica/dashboard
 * Retorna las métricas agregadas del sistema (Totales, Por Carrera, Por Semestre)
 */
async function getDashboard(req, res) {
  try {
    // 1. Totales Generales y Tasa de Respuesta %
    const queryTotales = `
      SELECT 
        COUNT(*) AS total_habilitados,
        COUNT(re.id_respuesta) AS encuestas_finalizadas,
        COUNT(*) - COUNT(re.id_respuesta) AS brecha_pendientes,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND((COUNT(re.id_respuesta)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
          ELSE 0 
        END AS tasa_respuesta_pct
      FROM estudiantes_habilitados eh
      LEFT JOIN graduado g ON LOWER(TRIM(eh.carnet_identidad)) = LOWER(TRIM(g.carnet_identidad))
      LEFT JOIN respuesta_encuesta re ON g.id_graduado = re.id_graduado;
    `;

    // 2. Desglose comparativo por Carrera (Kardex vs USEI)
    const queryCarreras = `
      SELECT 
        eh.carrera,
        COUNT(*) AS total_kardex,
        COUNT(re.id_respuesta) AS encuestas_completadas,
        COUNT(*) - COUNT(re.id_respuesta) AS brecha_pendientes,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND((COUNT(re.id_respuesta)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
          ELSE 0 
        END AS tasa_cobertura_pct
      FROM estudiantes_habilitados eh
      LEFT JOIN graduado g ON LOWER(TRIM(eh.carnet_identidad)) = LOWER(TRIM(g.carnet_identidad))
      LEFT JOIN respuesta_encuesta re ON g.id_graduado = re.id_graduado
      GROUP BY eh.carrera
      ORDER BY total_kardex DESC, eh.carrera ASC;
    `;

    // 3. Desglose por Gestión / Semestre
    const querySemestres = `
      SELECT 
        eh.gestion_semestre,
        COUNT(*) AS total_kardex,
        COUNT(re.id_respuesta) AS encuestas_completadas,
        COUNT(*) - COUNT(re.id_respuesta) AS brecha_pendientes,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND((COUNT(re.id_respuesta)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
          ELSE 0 
        END AS tasa_cobertura_pct
      FROM estudiantes_habilitados eh
      LEFT JOIN graduado g ON LOWER(TRIM(eh.carnet_identidad)) = LOWER(TRIM(g.carnet_identidad))
      LEFT JOIN respuesta_encuesta re ON g.id_graduado = re.id_graduado
      GROUP BY eh.gestion_semestre
      ORDER BY eh.gestion_semestre DESC;
    `;

    const [resTotales, resCarreras, resSemestres] = await Promise.all([
      db.query(queryTotales),
      db.query(queryCarreras),
      db.query(querySemestres),
    ]);

    const totales = resTotales.rows[0] || {
      total_habilitados: '0',
      encuestas_finalizadas: '0',
      brecha_pendientes: '0',
      tasa_respuesta_pct: '0.0',
    };

    return res.status(200).json({
      exito: true,
      data: {
        totales,
        por_carrera: resCarreras.rows,
        por_semestre: resSemestres.rows,
      },
    });
  } catch (error) {
    console.error('Error al obtener dashboard analítico:', error);
    return res.status(500).json({
      exito: false,
      error: 'Error interno al procesar los datos analíticos del sistema.',
    });
  }
}

/**
 * Controlador GET /api/analitica/exportar
 * Genera y descarga el archivo Excel estructurado (RF-9)
 */
async function exportarExcel(req, res) {
  try {
    // 1. Obtener datos de resumen por carrera y totales
    const queryCarreras = `
      SELECT 
        eh.carrera,
        COUNT(*) AS total_kardex,
        COUNT(re.id_respuesta) AS encuestas_completadas,
        COUNT(*) - COUNT(re.id_respuesta) AS brecha_pendientes,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND((COUNT(re.id_respuesta)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
          ELSE 0 
        END AS tasa_cobertura_pct
      FROM estudiantes_habilitados eh
      LEFT JOIN graduado g ON LOWER(TRIM(eh.carnet_identidad)) = LOWER(TRIM(g.carnet_identidad))
      LEFT JOIN respuesta_encuesta re ON g.id_graduado = re.id_graduado
      GROUP BY eh.carrera
      ORDER BY total_kardex DESC, eh.carrera ASC;
    `;

    const queryTotales = `
      SELECT 
        COUNT(*) AS total_habilitados,
        COUNT(re.id_respuesta) AS encuestas_finalizadas,
        COUNT(*) - COUNT(re.id_respuesta) AS brecha_pendientes,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND((COUNT(re.id_respuesta)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
          ELSE 0 
        END AS tasa_respuesta_pct
      FROM estudiantes_habilitados eh
      LEFT JOIN graduado g ON LOWER(TRIM(eh.carnet_identidad)) = LOWER(TRIM(g.carnet_identidad))
      LEFT JOIN respuesta_encuesta re ON g.id_graduado = re.id_graduado;
    `;

    // 2. Obtener lista nominal detallada de estudiantes
    const queryDetalle = `
      SELECT 
        eh.carnet_identidad,
        eh.nombres,
        eh.apellidos,
        eh.carrera,
        eh.modalidad_titulacion,
        eh.gestion_semestre,
        g.correo_privado,
        re.fecha_registro,
        CASE WHEN re.id_respuesta IS NOT NULL THEN 'COMPLETADA' ELSE 'PENDIENTE' END AS estado_encuesta
      FROM estudiantes_habilitados eh
      LEFT JOIN graduado g ON LOWER(TRIM(eh.carnet_identidad)) = LOWER(TRIM(g.carnet_identidad))
      LEFT JOIN respuesta_encuesta re ON g.id_graduado = re.id_graduado
      ORDER BY eh.carrera ASC, eh.apellidos ASC;
    `;

    const [resCarreras, resTotales, resDetalle] = await Promise.all([
      db.query(queryCarreras),
      db.query(queryTotales),
      db.query(queryDetalle),
    ]);

    const excelBuffer = excelService.generarReporteExcel({
      resumenCarreras: resCarreras.rows,
      detalleEstudiantes: resDetalle.rows,
      totales: resTotales.rows[0],
    });

    const fechaHoy = new Date().toISOString().split('T')[0];
    const filename = `Reporte_Seguimiento_USEI_${fechaHoy}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    return res.end(excelBuffer);
  } catch (error) {
    console.error('Error al exportar reporte Excel:', error);
    return res.status(500).json({
      exito: false,
      error: 'Error interno al generar el archivo Excel.',
    });
  }
}

module.exports = {
  getDashboard,
  exportarExcel,
};
