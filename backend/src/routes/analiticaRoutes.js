const express = require('express');
const router = express.Router();
const analiticaController = require('../controllers/analiticaController');
const { verificarAdminJWT } = require('../middlewares/authAdminMiddleware');

// GET /api/analitica/dashboard - Métricas consolidadas
router.get('/dashboard', verificarAdminJWT, analiticaController.getDashboard);

// GET /api/analitica/exportar - Descarga consolidada de seguimiento
router.get('/exportar', verificarAdminJWT, analiticaController.exportarExcel);

// GET /api/analitica/respuestas-estudiantes - Listado de respuestas de encuestas
router.get('/respuestas-estudiantes', verificarAdminJWT, analiticaController.getRespuestasEstudiantes);

// GET /api/analitica/respuestas-estudiantes/:id_respuesta - Detalle de respuestas individuales
router.get('/respuestas-estudiantes/:id_respuesta', verificarAdminJWT, analiticaController.getDetalleRespuesta);

// GET /api/analitica/estudiantes-pendientes - Nómina de estudiantes que aún no llenaron la encuesta
router.get('/estudiantes-pendientes', verificarAdminJWT, analiticaController.getEstudiantesPendientes);

// POST /api/analitica/enviar-recordatorio/:id_habilitado - Envío de recordatorio institucional por correo
router.post('/enviar-recordatorio/:id_habilitado', verificarAdminJWT, analiticaController.enviarRecordatorio);

// GET /api/analitica/exportar-respuestas - Descarga de respuestas detalladas a Excel
router.get('/exportar-respuestas', verificarAdminJWT, analiticaController.exportarRespuestasExcel);

module.exports = router;
