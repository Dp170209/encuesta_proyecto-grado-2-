const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'usei_ucb_secret_key_2026_jwt_token';

/**
 * Middleware para validar el token JWT en rutas protegidas
 * Extrae la identidad del graduado y previene suplantaciones
 */
function verificarTokenJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      exito: false,
      error: 'Acceso no autorizado. Debe autenticarse previamente en la pantalla de verificación.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Inyectar los datos del graduado validados en la petición
    req.graduado = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        exito: false,
        error: 'Su sesión de encuesta ha expirado. Por favor, vuelva a validar su identidad.',
      });
    }
    return res.status(401).json({
      exito: false,
      error: 'Token de sesión inválido o manipulado.',
    });
  }
}

module.exports = {
  verificarTokenJWT,
};
