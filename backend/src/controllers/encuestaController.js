const db = require('../config/db');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');
const { obtenerEnlaceWhatsApp, normalizarNombreCarrera } = require('../utils/whatsappMap');

/**
 * Controlador POST /api/encuesta/guardar
 * Guarda las respuestas en JSONB, emite el certificado en auditoría,
 * compila el PDF y despacha asíncronamente el correo SMTP y el enlace de WhatsApp (HU-03 y HU-04).
 */
async function guardarRespuestas(req, res) {
  const client = await db.pool.connect();

  try {
    // 1. Extraer ID del graduado directamente del JWT verificado (Seguridad OWASP)
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
    const anioIngresoRaw = contenido_json.S1_AnioIngreso || contenido_json.S1P02_AnioIngreso;
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

    const nuevaRespuesta = insertResult.rows[0];

    // 5. Auditoría: Registro oficial en la tabla 'certificados_emitidos'
    const nombreArchivoPdf = `CERT_USEI_${gestion}_${idGraduado}.pdf`;
    const certQuery = `
      INSERT INTO certificados_emitidos (
        id_graduado,
        fecha_emision,
        ruta_archivo_pdf
      )
      VALUES ($1, NOW(), $2)
      RETURNING nro_certificado, fecha_emision, ruta_archivo_pdf;
    `;

    const certResult = await client.query(certQuery, [idGraduado, nombreArchivoPdf]);
    const certEmitido = certResult.rows[0];

    await client.query('COMMIT');

    // 6. Preparar metadatos para PDF y Comunidad de WhatsApp
    const nombreCompleto = `${req.graduado.nombres || ''} ${req.graduado.apellidos || ''}`.trim();
    const carreraRaw = req.graduado.carrera || contenido_json.S1P01_Carrera || 'Ingeniería de Sistemas';
    const carrera = normalizarNombreCarrera(carreraRaw);
    const correoDestino = req.graduado.correo_privado || contenido_json.S1P09_CorreoElectronico;
    const urlWhatsapp = obtenerEnlaceWhatsApp(carrera);

    // 7. Compilación dinámica del PDF en memoria
    const pdfBuffer = await pdfService.generarCertificadoPDF({
      nro_certificado: certEmitido.nro_certificado,
      nombre_completo: nombreCompleto,
      carnet_identidad: req.graduado.carnet_identidad,
      carrera,
      fecha_emision: certEmitido.fecha_emision,
      gestion,
    });

    // 8. Despacho asíncrono SMTP sin bloquear la respuesta HTTP (RNF-5)
    setImmediate(() => {
      emailService
        .enviarCertificadoGraduado({
          destinatario: correoDestino,
          nombreCompleto,
          nroCertificado: certEmitido.nro_certificado,
          pdfBuffer,
          urlWhatsapp,
          carrera,
        })
        .catch((mailErr) => {
          console.error('[SMTP Background Error]:', mailErr.message);
        });
    });

    // 9. Respuesta inmediata 201 Created al Frontend con los datos de emisión y WhatsApp
    return res.status(201).json({
      exito: true,
      mensaje: 'Encuesta registrada y certificado oficial emitido con éxito.',
      data: {
        id_respuesta: nuevaRespuesta.id_respuesta,
        id_graduado: nuevaRespuesta.id_graduado,
        nro_certificado: certEmitido.nro_certificado,
        fecha_emision: certEmitido.fecha_emision,
        carrera,
        correo_destino: correoDestino,
        url_whatsapp: urlWhatsapp,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar respuestas de encuesta y emitir certificado:', error);
    return res.status(500).json({
      exito: false,
      error: 'Error interno del servidor al procesar la encuesta y emitir el certificado.',
    });
  } finally {
    client.release();
  }
}

/**
 * Controlador GET /api/encuesta/descargar-certificado
 * Permite la descarga directa del PDF en el navegador para el graduado autenticado
 */
async function descargarCertificado(req, res) {
  try {
    const idGraduado = req.graduado.id_graduado;

    // Consultar el certificado emitido para este graduado
    const certQuery = await db.query(
      `SELECT c.nro_certificado, c.fecha_emision, g.carnet_identidad, g.nombres, g.apellidos, g.carrera
       FROM certificados_emitidos c
       JOIN graduado g ON c.id_graduado = g.id_graduado
       WHERE c.id_graduado = $1
       ORDER BY c.nro_certificado DESC
       LIMIT 1`,
      [idGraduado]
    );

    if (certQuery.rows.length === 0) {
      return res.status(404).json({
        exito: false,
        error: 'No se encontró un certificado emitido para este graduado.',
      });
    }

    const row = certQuery.rows[0];
    const nombreCompleto = `${row.nombres || ''} ${row.apellidos || ''}`.trim();

    const pdfBuffer = await pdfService.generarCertificadoPDF({
      nro_certificado: row.nro_certificado,
      nombre_completo: nombreCompleto,
      carnet_identidad: row.carnet_identidad,
      carrera: row.carrera,
      fecha_emision: row.fecha_emision,
      gestion: '2026',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Certificado_USEI_${row.carnet_identidad}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Error al descargar certificado:', err);
    return res.status(500).json({
      exito: false,
      error: 'Error al generar la descarga del certificado.',
    });
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
      `SELECT r.id_respuesta, r.fecha_registro, r.gestion_academica, c.nro_certificado
       FROM respuesta_encuesta r
       LEFT JOIN certificados_emitidos c ON r.id_graduado = c.id_graduado
       WHERE r.id_graduado = $1 
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
  descargarCertificado,
  consultarEstadoEncuesta,
};
