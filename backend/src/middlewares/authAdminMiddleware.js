const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'usei_ucb_secret_key_2026_jwt_token';

/**
 * Middleware para validar que el usuario que accede sea un Administrador autenticado
 */
function verificarAdminJWT(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      exito: false,
      error: 'Acceso denegado. Se requiere autenticación de Administrador de la USEI.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.rol !== 'ADMIN') {
      return res.status(403).json({
        exito: false,
        error: 'Permisos insuficientes. Este módulo es exclusivo para administradores de la USEI.',
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        exito: false,
        error: 'Su sesión administrativa ha expirado. Por favor, vuelva a iniciar sesión.',
      });
    }
    return res.status(401).json({
      exito: false,
      error: 'Token de sesión inválido o manipulado.',
    });
  }
}

module.exports = {
  verificarAdminJWT,
};
