const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/verificar-graduado
router.post('/verificar-graduado', authController.verificarGraduado);

// POST /api/auth/login-admin
router.post('/login-admin', authController.loginAdmin);

module.exports = router;
