const dns = require('dns').promises;
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { normalizarNombreCarrera } = require('../utils/whatsappMap');

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
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

// Diccionario de errores tipográficos frecuentes en dominios de correo populares
const TYPO_DOMINIOS = {
  'gmail,com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gemail.com': 'gmail.com',
  'hotmail,com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hormail.com': 'hotmail.com',
  'outlook,com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'yahoo,com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yaho.es': 'yahoo.es',
};

// Partículas y preposiciones habituales en nombres/apellidos en español
const PARTICULAS_IGNORADAS = new Set([
  'de', 'del', 'la', 'las', 'los', 'san', 'santa', 'da', 'di', 'y'
]);

/**
 * Valida que el correo sea privado, sintácticamente correcto, sin comas ni errores
 * en dominios conocidos, y con servidores MX reales comprobados por DNS.
 */
async function validarCorreoPrivado(correo) {
  if (!correo || typeof correo !== 'string') {
    throw new Error('Debe proporcionar un correo electrónico personal válido.');
  }

  const emailRaw = correo.trim().toLowerCase();

  // 1. Detección específica de comas (ej. "nombre@gmail,com")
  if (emailRaw.includes(',')) {
    throw new Error(
      "El correo no puede contener comas ','. Si intentaba escribir un punto '.', corríjalo (ejemplo: usuario@gmail.com)."
    );
  }

  // 2. Validación de formato estándar estricto
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(emailRaw)) {
    throw new Error(
      'El formato del correo electrónico ingresado no es válido (ejemplo requerido: nombre@gmail.com).'
    );
  }

  const partes = emailRaw.split('@');
  if (partes.length !== 2) {
    throw new Error('El correo electrónico debe contener un único símbolo @.');
  }

  const [, dominio] = partes;

  // 3. Regla de negocio crítica: Prohibir cualquier dominio institucional de la UCB
  const institucionalRegex = /@([a-z0-9-]+\.)*ucb\.edu\.bo$/i;
  if (
    institucionalRegex.test(emailRaw) ||
    emailRaw.includes('@ucb.edu.bo') ||
    dominio.endsWith('ucb.edu.bo')
  ) {
    throw new Error(
      'No se permiten correos académicos (@ucb.edu.bo). Ingrese su correo personal (ej. Gmail, Hotmail, Outlook) para recibir su certificado oficial.'
    );
  }

  // 4. Verificación de errores tipográficos comunes en dominios
  if (TYPO_DOMINIOS[dominio]) {
    throw new Error(
      `Detectamos un posible error en el dominio '@${dominio}'. ¿Quiso escribir '@${TYPO_DOMINIOS[dominio]}'? Por favor corríjalo.`
    );
  }

  // 5. Verificación de extensión TLD (al menos 2 caracteres en el TLD)
  const partesDominio = dominio.split('.');
  const tld = partesDominio[partesDominio.length - 1];
  if (!tld || tld.length < 2) {
    throw new Error(
      `El dominio '@${dominio}' no posee una extensión válida (ejemplo: .com, .bo, .org).`
    );
  }

  // 6. Verificación de existencia real del dominio mediante DNS (registros MX)
  try {
    const mxPromise = dns.resolveMx(dominio);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_DNS')), 2500)
    );
    const records = await Promise.race([mxPromise, timeoutPromise]);
    if (!records || records.length === 0) {
      throw new Error('NO_MX');
    }
  } catch (err) {
    if (err.message === 'TIMEOUT_DNS') {
      // Timeout permisivo para no bloquear en entornos de pruebas offline
      return emailRaw;
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.message === 'NO_MX') {
      throw new Error(
        `El dominio '@${dominio}' no parece existir o no está configurado para recibir correos. Verifique que esté correctamente escrito.`
      );
    }
    // Errores de resolución transitorios de red permiten continuar
  }

  return emailRaw;
}

/**
 * Valida obligatoriamente que el estudiante ingrese sus NOMBRES Y APELLIDOS completos.
 * Rechaza intentos con solo un nombre, solo un apellido o nombres ajenos.
 */
function nombresCoinciden(nombreIngresado, nombresBD, apellidosBD) {
  if (!nombreIngresado || typeof nombreIngresado !== 'string') {
    return { valido: false, motivo: 'El nombre completo es obligatorio.' };
  }

  const ingresadoLimpio = cleanText(nombreIngresado);
  const nombresBDLimpio = cleanText(nombresBD);
  const apellidosBDLimpio = cleanText(apellidosBD);

  // Extraer palabras significativas del usuario
  const palabrasIngresadas = ingresadoLimpio
    .split(' ')
    .filter((w) => w.length >= 2 && !PARTICULAS_IGNORADAS.has(w));

  // Regla 1: Debe ingresar al menos dos palabras (al menos un nombre y un apellido)
  if (palabrasIngresadas.length < 2) {
    return {
      valido: false,
      motivo:
        'Debe ingresar sus nombres y apellidos completos (al menos un nombre y un apellido tal como figuran en Kardex).',
    };
  }

  // Palabras significativas registradas en BD
  const palabrasNombresBD = nombresBDLimpio
    .split(' ')
    .filter((w) => w.length >= 2 && !PARTICULAS_IGNORADAS.has(w));
  const palabrasApellidosBD = apellidosBDLimpio
    .split(' ')
    .filter((w) => w.length >= 2 && !PARTICULAS_IGNORADAS.has(w));

  const todasBD = new Set([...palabrasNombresBD, ...palabrasApellidosBD]);

  // Regla 2: Debe coincidir obligatoriamente al menos uno de sus nombres
  const coincideNombre = palabrasIngresadas.some((p) => palabrasNombresBD.includes(p));

  // Regla 3: Debe coincidir obligatoriamente al menos uno de sus apellidos
  const coincideApellido = palabrasIngresadas.some((p) => palabrasApellidosBD.includes(p));

  if (!coincideNombre || !coincideApellido) {
    return {
      valido: false,
      motivo:
        'Los nombres y apellidos ingresados no coinciden con los registros oficiales para este Carnet de Identidad. Asegúrese de ingresar sus nombres y apellidos completos.',
    };
  }

  // Regla 4: No permitir palabras extrañas o nombres de terceros
  const palabrasAjenas = palabrasIngresadas.filter((p) => !todasBD.has(p));
  if (palabrasAjenas.length > 0) {
    return {
      valido: false,
      motivo:
        'Los nombres y apellidos ingresados no corresponden exactamente con los registros del estudiante habilitado.',
    };
  }

  return { valido: true };
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

  // 1. Validar restricción y existencia del correo personal
  const correoPersonalLimpio = await validarCorreoPrivado(correo_privado);
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

  // 3. Validar coincidencia estricta de nombres y apellidos
  const checkNombre = nombresCoinciden(
    nombre_completo,
    estudianteHabilitado.nombres,
    estudianteHabilitado.apellidos
  );

  if (!checkNombre.valido) {
    throw new Error(checkNombre.motivo);
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

  const carreraNormalizada = normalizarNombreCarrera(estudianteHabilitado.carrera);

  const valuesGraduado = [
    estudianteHabilitado.carnet_identidad,
    estudianteHabilitado.nombres,
    estudianteHabilitado.apellidos,
    correoPersonalLimpio,
    'PENDIENTE', // El celular obligatorio se recolecta en la Sección 1 de la encuesta
    carreraNormalizada,
  ];

  const graduadoResult = await db.query(queryGraduado, valuesGraduado);
  const graduadoRegistrado = graduadoResult.rows[0];

  // 6. Generar JWT de sesión temporal (válido por 2 horas para la sesión única)
  const payload = {
    id_graduado: graduadoRegistrado.id_graduado,
    carnet_identidad: graduadoRegistrado.carnet_identidad,
    nombres: graduadoRegistrado.nombres,
    apellidos: graduadoRegistrado.apellidos,
    carrera: carreraNormalizada,
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
