const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const etlController = require('../controllers/etlController');
const { verificarAdminJWT } = require('../middlewares/authAdminMiddleware');

// POST /api/etl/cargar-habilitados - Carga masiva de la lista de habilitados
router.post(
  '/cargar-habilitados',
  verificarAdminJWT,
  upload.single('archivo'),
  etlController.cargarHabilitados
);

// GET /api/etl/habilitados - Lista de estudiantes habilitados para monitoreo
router.get('/habilitados', verificarAdminJWT, etlController.obtenerHabilitados);

module.exports = router;
