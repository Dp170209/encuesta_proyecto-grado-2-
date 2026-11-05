const db = require('../config/db');
const excelService = require('../services/excelService');
const emailService = require('../services/emailService');

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
      total_habilitados: Number(totales.total_habilitados),
      encuestas_finalizadas: Number(totales.encuestas_finalizadas),
      tasa_respuesta_pct: Number(totales.tasa_respuesta_pct),
      totales,
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

/**
 * Controlador GET /api/analitica/respuestas-estudiantes
 * Lista las encuestas completadas con soporte de filtros y búsqueda por nombre o CI
 */
async function getRespuestasEstudiantes(req, res) {
  try {
    const { carrera, semestre, fecha_desde, fecha_hasta, busqueda } = req.query;

    let query = `
      SELECT 
        re.id_respuesta,
        re.fecha_registro,
        re.gestion_academica,
        g.id_graduado,
        g.carnet_identidad,
        g.nombres,
        g.apellidos,
        TRIM(CONCAT(g.nombres, ' ', g.apellidos)) AS nombre_completo,
        g.carrera,
        g.celular,
        g.correo_privado,
        eh.modalidad_titulacion,
        eh.gestion_semestre,
        ce.nro_certificado,
        ce.ruta_archivo_pdf
      FROM respuesta_encuesta re
      JOIN graduado g ON re.id_graduado = g.id_graduado
      LEFT JOIN estudiantes_habilitados eh ON LOWER(TRIM(g.carnet_identidad)) = LOWER(TRIM(eh.carnet_identidad))
      LEFT JOIN certificados_emitidos ce ON g.id_graduado = ce.id_graduado
      WHERE 1=1
    `;

    const values = [];
    let counter = 1;

    if (carrera && carrera !== 'Todas') {
      query += ` AND g.carrera = $${counter++}`;
      values.push(carrera);
    }

    if (semestre && semestre !== 'Todos') {
      query += ` AND (eh.gestion_semestre = $${counter} OR re.gestion_academica::text LIKE $${counter})`;
      values.push(semestre);
      counter++;
    }

    if (fecha_desde) {
      query += ` AND re.fecha_registro >= $${counter++}`;
      values.push(`${fecha_desde} 00:00:00`);
    }

    if (fecha_hasta) {
      query += ` AND re.fecha_registro <= $${counter++}`;
      values.push(`${fecha_hasta} 23:59:59`);
    }

    if (busqueda && busqueda.trim()) {
      query += ` AND (
        g.carnet_identidad ILIKE $${counter} OR 
        g.nombres ILIKE $${counter} OR 
        g.apellidos ILIKE $${counter} OR
        CONCAT(g.nombres, ' ', g.apellidos) ILIKE $${counter}
      )`;
      values.push(`%${busqueda.trim()}%`);
      counter++;
    }

    query += ` ORDER BY re.fecha_registro DESC;`;

    const result = await db.query(query, values);

    return res.status(200).json({
      exito: true,
      total: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al listar respuestas de estudiantes:', error);
    return res.status(500).json({
      exito: false,
      error: 'Error interno al consultar la lista de respuestas.',
    });
  }
}

/**
 * Controlador GET /api/analitica/respuestas-estudiantes/:id_respuesta
 * Retorna el detalle completo de respuestas en JSON para el modal
 */
async function getDetalleRespuesta(req, res) {
  try {
    const { id_respuesta } = req.params;

    const query = `
      SELECT 
        re.id_respuesta,
        re.fecha_registro,
        re.gestion_academica,
        re.contenido_json,
        g.id_graduado,
        g.carnet_identidad,
        g.nombres,
        g.apellidos,
        TRIM(CONCAT(g.nombres, ' ', g.apellidos)) AS nombre_completo,
        g.carrera,
        g.celular,
        g.correo_privado,
        eh.modalidad_titulacion,
        eh.gestion_semestre,
        ce.nro_certificado,
        ce.ruta_archivo_pdf
      FROM respuesta_encuesta re
      JOIN graduado g ON re.id_graduado = g.id_graduado
      LEFT JOIN estudiantes_habilitados eh ON LOWER(TRIM(g.carnet_identidad)) = LOWER(TRIM(eh.carnet_identidad))
      LEFT JOIN certificados_emitidos ce ON g.id_graduado = ce.id_graduado
      WHERE re.id_respuesta = $1
      LIMIT 1;
    `;

    const result = await db.query(query, [id_respuesta]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        exito: false,
        error: 'No se encontró la respuesta especificada.',
      });
    }

    return res.status(200).json({
      exito: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al obtener detalle de respuesta:', error);
    return res.status(500).json({
      exito: false,
      error: 'Error interno al consultar el detalle de la respuesta.',
    });
  }
}

/**
 * Controlador GET /api/analitica/estudiantes-pendientes
 * Retorna los estudiantes habilitados que aún no completaron la encuesta
 */
async function getEstudiantesPendientes(req, res) {
  try {
    const { carrera, busqueda } = req.query;

    let query = `
      SELECT 
        eh.id_habilitado,
        eh.carnet_identidad,
        eh.nombres,
        eh.apellidos,
        TRIM(CONCAT(eh.nombres, ' ', eh.apellidos)) AS nombre_completo,
        eh.carrera,
        eh.modalidad_titulacion,
        eh.gestion_semestre,
        eh.correo_institucional
      FROM estudiantes_habilitados eh
      LEFT JOIN graduado g ON LOWER(TRIM(eh.carnet_identidad)) = LOWER(TRIM(g.carnet_identidad))
      LEFT JOIN respuesta_encuesta re ON g.id_graduado = re.id_graduado
      WHERE re.id_respuesta IS NULL
    `;

    const values = [];
    let counter = 1;

    if (carrera && carrera !== 'Todas') {
      query += ` AND eh.carrera = $${counter++}`;
      values.push(carrera);
    }

    if (busqueda && busqueda.trim()) {
      query += ` AND (
        eh.carnet_identidad ILIKE $${counter} OR 
        eh.nombres ILIKE $${counter} OR 
        eh.apellidos ILIKE $${counter} OR
        CONCAT(eh.nombres, ' ', eh.apellidos) ILIKE $${counter} OR
        eh.correo_institucional ILIKE $${counter}
      )`;
      values.push(`%${busqueda.trim()}%`);
      counter++;
    }

    query += ` ORDER BY eh.carrera ASC, eh.apellidos ASC;`;

    const result = await db.query(query, values);

    return res.status(200).json({
      exito: true,
      total: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener lista de pendientes:', error);
    return res.status(500).json({
      exito: false,
      error: 'Error interno al consultar estudiantes pendientes.',
    });
  }
}

/**
 * Controlador POST /api/analitica/enviar-recordatorio/:id_habilitado
 * Envía un correo institucional de recordatorio al estudiante con enlace a la encuesta
 */
async function enviarRecordatorio(req, res) {
  try {
    const { id_habilitado } = req.params;

    const result = await db.query(
      `SELECT id_habilitado, carnet_identidad, nombres, apellidos, carrera, correo_institucional 
       FROM estudiantes_habilitados 
       WHERE id_habilitado = $1 LIMIT 1`,
      [id_habilitado]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        exito: false,
        error: 'Estudiante no encontrado en el padrón de habilitados.',
      });
    }

    const est = result.rows[0];
    const nombreCompleto = `${est.nombres} ${est.apellidos}`.trim();
    const destinatario = est.correo_institucional;

    if (!destinatario) {
      return res.status(400).json({
        exito: false,
        error: 'El estudiante no tiene registrado un correo institucional.',
      });
    }

    const linkEncuesta = process.env.FRONTEND_URL || 'http://localhost:5173';

    await emailService.enviarRecordatorioEncuesta({
      destinatario,
      nombreCompleto,
      carnetIdentidad: est.carnet_identidad,
      carrera: est.carrera,
      linkEncuesta,
    });

    return res.status(200).json({
      exito: true,
      mensaje: `Recordatorio enviado con éxito a ${destinatario}`,
    });
  } catch (error) {
    console.error('Error al enviar recordatorio:', error);
    return res.status(500).json({
      exito: false,
      error: error.message || 'Error interno al enviar el recordatorio por correo.',
    });
  }
}

/**
 * Controlador GET /api/analitica/exportar-respuestas
 * Exporta la base de datos de respuestas en Excel (.xlsx) con filtros aplicados o selección
 */
async function exportarRespuestasExcel(req, res) {
  try {
    const { carrera, semestre, fecha_desde, fecha_hasta, ids, busqueda } = req.query;

    let query = `
      SELECT 
        re.id_respuesta,
        re.fecha_registro,
        re.gestion_academica,
        re.contenido_json,
        g.carnet_identidad,
        g.nombres,
        g.apellidos,
        g.carrera,
        g.celular,
        g.correo_privado,
        eh.modalidad_titulacion,
        eh.gestion_semestre,
        ce.nro_certificado
      FROM respuesta_encuesta re
      JOIN graduado g ON re.id_graduado = g.id_graduado
      LEFT JOIN estudiantes_habilitados eh ON LOWER(TRIM(g.carnet_identidad)) = LOWER(TRIM(eh.carnet_identidad))
      LEFT JOIN certificados_emitidos ce ON g.id_graduado = ce.id_graduado
      WHERE 1=1
    `;

    const values = [];
    let counter = 1;

    if (ids && ids.trim()) {
      const idArray = ids.split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));
      if (idArray.length > 0) {
        query += ` AND re.id_respuesta = ANY($${counter++}::int[])`;
        values.push(idArray);
      }
    } else {
      if (carrera && carrera !== 'Todas') {
        query += ` AND g.carrera = $${counter++}`;
        values.push(carrera);
      }
      if (semestre && semestre !== 'Todos') {
        query += ` AND (eh.gestion_semestre = $${counter} OR re.gestion_academica::text LIKE $${counter})`;
        values.push(semestre);
        counter++;
      }
      if (fecha_desde) {
        query += ` AND re.fecha_registro >= $${counter++}`;
        values.push(`${fecha_desde} 00:00:00`);
      }
      if (fecha_hasta) {
        query += ` AND re.fecha_registro <= $${counter++}`;
        values.push(`${fecha_hasta} 23:59:59`);
      }
      if (busqueda && busqueda.trim()) {
        query += ` AND (
          g.carnet_identidad ILIKE $${counter} OR 
          g.nombres ILIKE $${counter} OR 
          g.apellidos ILIKE $${counter}
        )`;
        values.push(`%${busqueda.trim()}%`);
        counter++;
      }
    }

    query += ` ORDER BY re.fecha_registro DESC;`;

    const result = await db.query(query, values);

    const excelBuffer = excelService.generarExcelRespuestasDetalladas({
      respuestas: result.rows,
      filtrosAplicados: {
        carrera,
        semestre,
        fecha_desde,
        fecha_hasta,
      },
    });

    const fechaHoy = new Date().toISOString().split('T')[0];
    const filename = `Respuestas_Encuesta_USEI_${fechaHoy}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    return res.end(excelBuffer);
  } catch (error) {
    console.error('Error al exportar respuestas a Excel:', error);
    return res.status(500).json({
      exito: false,
      error: 'Error interno al generar el archivo Excel de respuestas.',
    });
  }
}

module.exports = {
  getDashboard,
  exportarExcel,
  getRespuestasEstudiantes,
  getDetalleRespuesta,
  getEstudiantesPendientes,
  enviarRecordatorio,
  exportarRespuestasExcel,
};
