const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'usei_ucb_secret_key_2026_jwt_token';

/**
 * Normaliza cadenas de texto quitando tildes, signos de puntuación y espacios extras
 */
function cleanText(str) {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Valida que el correo no sea institucional de la U.C.B.
 * Rechaza dominios como @ucb.edu.bo, @lpz.ucb.edu.bo, etc.
 */
function validarCorreoPrivado(correo) {
  if (!correo || typeof correo !== 'string') {
    throw new Error('Debe proporcionar un correo electrónico válido.');
  }

  const emailTrimmed = correo.trim().toLowerCase();

  // Validación de sintaxis básica de correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTrimmed)) {
    throw new Error('El formato del correo electrónico ingresado no es válido.');
  }

  // Regla de negocio crítica: Prohibir cualquier dominio institucional de la UCB
  const institucionalRegex = /@([a-z0-9-]+\.)*ucb\.edu\.bo$/i;
  if (institucionalRegex.test(emailTrimmed) || emailTrimmed.includes('@ucb.edu.bo')) {
    throw new Error('No se permiten correos académicos. Ingrese un correo personal.');
  }

  return emailTrimmed;
}

/**
 * Verifica si el nombre ingresado coincide de manera razonable con los nombres/apellidos registrados
 */
function nombresCoinciden(nombreIngresado, nombresBD, apellidosBD) {
  const ingresado = cleanText(nombreIngresado);
  const completoBD = cleanText(`${nombresBD} ${apellidosBD}`);
  const invertidoBD = cleanText(`${apellidosBD} ${nombresBD}`);

  if (ingresado === completoBD || ingresado === invertidoBD) {
    return true;
  }

  // Verifica que las palabras clave del nombre figuren en el registro
  const palabrasIngresadas = ingresado.split(' ').filter((w) => w.length > 2);
  const palabrasBD = completoBD.split(' ').filter((w) => w.length > 2);

  if (palabrasIngresadas.length === 0) return false;

  // Si al menos 2 palabras coinciden o si ingresó 1 sola y coincide
  const coincidencias = palabrasIngresadas.filter((palabra) => palabrasBD.includes(palabra));

  return coincidencias.length >= Math.min(2, palabrasIngresadas.length);
}

/**
 * Servicio de verificación de identidad de graduados
 */
async function verificarGraduado({ carnet_identidad, nombre_completo, correo_privado }) {
  if (!carnet_identidad) {
    throw new Error('El Carnet de Identidad es obligatorio.');
  }
  if (!nombre_completo) {
    throw new Error('El Nombre Completo es obligatorio.');
  }

  // 1. Validar restricción de correo institucional
  const correoPersonalLimpio = validarCorreoPrivado(correo_privado);
  const carnetLimpio = String(carnet_identidad).trim();

  // 2. Consultar en la tabla estudiantes_habilitados
  const habilitadoResult = await db.query(
    `SELECT id_habilitado, carnet_identidad, nombres, apellidos, carrera, modalidad_titulacion, gestion_semestre
     FROM estudiantes_habilitados
     WHERE LOWER(TRIM(carnet_identidad)) = LOWER(TRIM($1))
     LIMIT 1`,
    [carnetLimpio]
  );

  if (habilitadoResult.rows.length === 0) {
    throw new Error('Sus datos no figuran en la lista de habilitados para titulación.');
  }

  const estudianteHabilitado = habilitadoResult.rows[0];

  // 3. Validar coincidencia de nombre y apellidos
  const esNombreValido = nombresCoinciden(
    nombre_completo,
    estudianteHabilitado.nombres,
    estudianteHabilitado.apellidos
  );

  if (!esNombreValido) {
    throw new Error('Sus datos no figuran en la lista de habilitados para titulación.');
  }

  // 4. Verificar si ya completó la encuesta previamente (Restricción de Sesión Única)
  const graduadoExistente = await db.query(
    `SELECT g.id_graduado, r.id_respuesta 
     FROM graduado g
     LEFT JOIN respuesta_encuesta r ON g.id_graduado = r.id_graduado
     WHERE LOWER(TRIM(g.carnet_identidad)) = LOWER(TRIM($1))`,
    [carnetLimpio]
  );

  if (graduadoExistente.rows.length > 0 && graduadoExistente.rows[0].id_respuesta) {
    throw new Error('Usted ya completó la encuesta anteriormente. El sistema solo admite una sesión de registro.');
  }

  // 5. Insertar o actualizar el registro en la tabla graduado
  const queryGraduado = `
    INSERT INTO graduado (
      carnet_identidad, 
      nombres, 
      apellidos, 
      correo_privado, 
      celular, 
      carrera
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (carnet_identidad) 
    DO UPDATE SET 
      correo_privado = EXCLUDED.correo_privado,
      nombres = EXCLUDED.nombres,
      apellidos = EXCLUDED.apellidos,
      carrera = EXCLUDED.carrera
    RETURNING id_graduado, carnet_identidad, nombres, apellidos, correo_privado, celular, carrera;
  `;

  const valuesGraduado = [
    estudianteHabilitado.carnet_identidad,
    estudianteHabilitado.nombres,
    estudianteHabilitado.apellidos,
    correoPersonalLimpio,
    'PENDIENTE', // El celular obligatorio se recolecta en la Sección 1 de la encuesta
    estudianteHabilitado.carrera,
  ];

  const graduadoResult = await db.query(queryGraduado, valuesGraduado);
  const graduadoRegistrado = graduadoResult.rows[0];

  // 6. Generar JWT de sesión temporal (válido por 2 horas para la sesión única)
  const payload = {
    id_graduado: graduadoRegistrado.id_graduado,
    carnet_identidad: graduadoRegistrado.carnet_identidad,
    nombres: graduadoRegistrado.nombres,
    apellidos: graduadoRegistrado.apellidos,
    carrera: graduadoRegistrado.carrera,
    correo_privado: graduadoRegistrado.correo_privado,
    modalidad_titulacion: estudianteHabilitado.modalidad_titulacion,
    gestion_semestre: estudianteHabilitado.gestion_semestre,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

  return {
    exito: true,
    mensaje: 'Identidad validada con éxito.',
    token,
    graduado: payload,
  };
}

const bcrypt = require('bcryptjs');

/**
 * Autenticación de Administradores de la USEI
 */
async function loginAdmin({ correo_institucional, password }) {
  if (!correo_institucional || !password) {
    throw new Error('Debe ingresar su correo institucional y su contraseña.');
  }

  const emailLimpio = correo_institucional.trim().toLowerCase();

  const res = await db.query(
    `SELECT id_admin, correo_institucional, password_hash, nombre_completo, estado_activo
     FROM administrador_usei
     WHERE LOWER(correo_institucional) = $1
     LIMIT 1`,
    [emailLimpio]
  );

  if (res.rows.length === 0) {
    throw new Error('Credenciales administrativas incorrectas.');
  }

  const admin = res.rows[0];

  if (!admin.estado_activo) {
    throw new Error('Su cuenta de administrador se encuentra inactiva. Contacte al soporte de la USEI.');
  }

  const passwordValido = await bcrypt.compare(password, admin.password_hash);
  if (!passwordValido) {
    throw new Error('Credenciales administrativas incorrectas.');
  }

  const payload = {
    rol: 'ADMIN',
    id_admin: admin.id_admin,
    nombre_completo: admin.nombre_completo,
    correo_institucional: admin.correo_institucional,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

  return {
    exito: true,
    mensaje: 'Autenticación administrativa exitosa.',
    token,
    admin: {
      id_admin: admin.id_admin,
      nombre_completo: admin.nombre_completo,
      correo_institucional: admin.correo_institucional,
    },
  };
}

module.exports = {
  validarCorreoPrivado,
  verificarGraduado,
  loginAdmin,
};
