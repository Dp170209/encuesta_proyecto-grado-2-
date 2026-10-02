const etlService = require('../services/etlService');

/**
 * Endpoint POST /api/etl/cargar-habilitados
 * Procesa la subida del archivo Excel o CSV de estudiantes habilitados
 */
async function cargarHabilitados(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        exito: false,
        error: 'No se ha adjuntado ningún archivo. Seleccione un archivo Excel (.xlsx, .xls) o CSV (.csv).',
      });
    }

    const defaultGestion = req.body.gestion_semestre || '2026-1';

    const resultado = await etlService.procesarArchivoHabilitados(
      req.file.buffer,
      defaultGestion
    );

    return res.status(200).json(resultado);
  } catch (error) {
    // Si el error especifica un detalle de validación o fila afectada, se retorna HTTP 400
    return res.status(400).json({
      exito: false,
      error: error.message || 'Ocurrió un error inesperado al procesar el archivo.',
    });
  }
}

/**
 * Endpoint GET /api/etl/habilitados
 * Obtiene los últimos estudiantes cargados para la vista del Gestor de Integración
 */
async function obtenerHabilitados(req, res) {
  try {
    const limite = req.query.limite ? parseInt(req.query.limite, 10) : 50;
    const lista = await etlService.listarEstudiantesHabilitados(limite);
    return res.status(200).json({
      exito: true,
      data: lista,
    });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      error: error.message || 'Error al obtener la lista de estudiantes habilitados.',
    });
  }
}

module.exports = {
  cargarHabilitados,
  obtenerHabilitados,
};
