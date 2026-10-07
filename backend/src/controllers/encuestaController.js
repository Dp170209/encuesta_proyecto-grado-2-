const db = require('../config/db');

/**
 * Controlador POST /api/encuesta/guardar
 * Guarda las respuestas estructuradas en el núcleo híbrido JSONB de PostgreSQL
 */
async function guardarRespuestas(req, res) {
  const client = await db.pool.connect();

  try {
    // 1. Extraer ID del graduado directamente del JWT verificado (Seguridad OWASP - No confiar en el body)
    const idGraduado = req.graduado.id_graduado;
    const { contenido_json, gestion_academica } = req.body;

    if (!idGraduado) {
      return res.status(401).json({
        exito: false,
        error: 'Sesión no válida. No se encontró la identidad del graduado.',
      });
    }

    if (!contenido_json || typeof contenido_json !== 'object' || Object.keys(contenido_json).length === 0) {
      return res.status(400).json({
        exito: false,
        error: 'El contenido de las respuestas no puede estar vacío.',
      });
    }

    await client.query('BEGIN');

    // 2. Control de Sesión Única: Verificar que no haya completado la encuesta previamente
    const previaCheck = await client.query(
      `SELECT id_respuesta FROM respuesta_encuesta WHERE id_graduado = $1 LIMIT 1`,
      [idGraduado]
    );

    if (previaCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        exito: false,
        error: 'Usted ya ha registrado sus respuestas anteriormente. No se permiten registros duplicados.',
      });
    }

    // 3. Actualizar datos de trazabilidad permanente en la tabla 'graduado' (Celular y Año de Ingreso)
    const celularRaw = contenido_json.S1P08_Celular || contenido_json.S1P03_Celular;
    const celular = celularRaw ? String(celularRaw).trim() : null;
    const anioIngresoRaw = contenido_json.S1P02_AnioIngreso || contenido_json.S1_AnioIngreso;
    const anioIngreso = anioIngresoRaw ? parseInt(anioIngresoRaw, 10) : null;

    if (celular || anioIngreso) {
      await client.query(
        `UPDATE graduado 
         SET celular = COALESCE($1, celular), 
             anio_ingreso = COALESCE($2, anio_ingreso)
         WHERE id_graduado = $3`,
        [celular, isNaN(anioIngreso) ? null : anioIngreso, idGraduado]
      );
    }

    // 4. Inserción en la tabla híbrida 'respuesta_encuesta' con JSONB
    const gestion = gestion_academica ? parseInt(gestion_academica, 10) : new Date().getFullYear();
    const tipoEncuesta = 'A tiempo de graduación';

    const insertQuery = `
      INSERT INTO respuesta_encuesta (
        id_graduado, 
        tipo_encuesta, 
        gestion_academica, 
        fecha_registro, 
        contenido_json
      )
      VALUES ($1, $2, $3, NOW(), $4)
      RETURNING id_respuesta, id_graduado, tipo_encuesta, gestion_academica, fecha_registro;
    `;

    const insertResult = await client.query(insertQuery, [
      idGraduado,
      tipoEncuesta,
      gestion,
      JSON.stringify(contenido_json),
    ]);

    await client.query('COMMIT');

    const nuevaRespuesta = insertResult.rows[0];

    return res.status(201).json({
      exito: true,
      mensaje: 'Encuesta registrada con éxito.',
      data: {
        id_respuesta: nuevaRespuesta.id_respuesta,
        id_graduado: nuevaRespuesta.id_graduado,
        tipo_encuesta: nuevaRespuesta.tipo_encuesta,
        gestion_academica: nuevaRespuesta.gestion_academica,
        fecha_registro: nuevaRespuesta.fecha_registro,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar respuestas de encuesta:', error);
    return res.status(500).json({
      exito: false,
      error: 'Error interno del servidor al almacenar las respuestas de la encuesta.',
    });
  } finally {
    client.release();
  }
}

/**
 * Controlador GET /api/encuesta/estado
 * Permite verificar si el estudiante autenticado ya completó la encuesta
 */
async function consultarEstadoEncuesta(req, res) {
  try {
    const idGraduado = req.graduado.id_graduado;

    const result = await db.query(
      `SELECT id_respuesta, fecha_registro, gestion_academica 
       FROM respuesta_encuesta 
       WHERE id_graduado = $1 
       LIMIT 1`,
      [idGraduado]
    );

    const completada = result.rows.length > 0;

    return res.status(200).json({
      exito: true,
      completada,
      registro: completada ? result.rows[0] : null,
    });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      error: 'Error al consultar estado de la encuesta.',
    });
  }
}

module.exports = {
  guardarRespuestas,
  consultarEstadoEncuesta,
};
