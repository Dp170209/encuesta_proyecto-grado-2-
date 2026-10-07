const authService = require('../services/authService');

/**
 * Controlador POST /api/auth/verificar-graduado
 * Valida la identidad del estudiante frente al padrón de habilitados
 */
async function verificarGraduado(req, res) {
  try {
    const { carnet_identidad, nombre_completo, correo_privado } = req.body;

    if (!carnet_identidad || !nombre_completo || !correo_privado) {
      return res.status(400).json({
        exito: false,
        error: 'Debe completar todos los campos obligatorios: Carnet de Identidad, Nombre Completo y Correo Electrónico.',
      });
    }

    const resultado = await authService.verificarGraduado({
      carnet_identidad,
      nombre_completo,
      correo_privado,
    });

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({
      exito: false,
      error: error.message || 'Error al validar la identidad del estudiante.',
    });
  }
}

/**
 * Controlador POST /api/auth/login-admin
 * Autenticación exclusiva para administradores de la USEI
 */
async function loginAdmin(req, res) {
  try {
    const { correo_institucional, password } = req.body;

    if (!correo_institucional || !password) {
      return res.status(400).json({
        exito: false,
        error: 'Debe ingresar su correo institucional y su contraseña.',
      });
    }

    const resultado = await authService.loginAdmin({
      correo_institucional,
      password,
    });

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(401).json({
      exito: false,
      error: error.message || 'Error al autenticar administrador.',
    });
  }
}

module.exports = {
  verificarGraduado,
  loginAdmin,
};

