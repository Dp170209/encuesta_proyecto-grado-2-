const express = require('express');
const router = express.Router();
const encuestaController = require('../controllers/encuestaController');
const { verificarTokenJWT } = require('../middlewares/authMiddleware');

// Todas las rutas de encuesta requieren un JWT válido de sesión
router.use(verificarTokenJWT);

// POST /api/encuesta/guardar - Almacena las respuestas estructuradas en PostgreSQL
router.post('/guardar', encuestaController.guardarRespuestas);

// GET /api/encuesta/estado - Verifica si el graduado actual ya completó la encuesta
router.get('/estado', encuestaController.consultarEstadoEncuesta);

module.exports = router;
