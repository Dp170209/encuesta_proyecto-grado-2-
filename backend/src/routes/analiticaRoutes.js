const express = require('express');
const router = express.Router();
const analiticaController = require('../controllers/analiticaController');
const { verificarAdminJWT } = require('../middlewares/authAdminMiddleware');

// GET /api/analitica/dashboard - Métricas consolidadas (HU-05)
router.get('/dashboard', verificarAdminJWT, analiticaController.getDashboard);

// GET /api/analitica/exportar - Descarga consolidada en formato Excel .xlsx (RF-9)
router.get('/exportar', verificarAdminJWT, analiticaController.exportarExcel);

module.exports = router;
