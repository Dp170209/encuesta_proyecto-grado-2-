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

module.exports = {
  verificarGraduado,
};
