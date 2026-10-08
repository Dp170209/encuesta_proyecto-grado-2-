/**
 * Mapeo oficial de comunidades de WhatsApp Alumni por carrera - USEI UCB
 * Grupos oficiales de la comunidad "Alumni Comunidad General UCB"
 */

const WHATSAPP_COMUNIDADES = {
  'Ingeniería de Sistemas': 'https://chat.whatsapp.com/H8ZOO6eqwo518VFLFM8eVJ',
  'Administración de Empresas': 'https://chat.whatsapp.com/DlJvelvJwCuG8htWef6Sxh',
  'Ingeniería Industrial': 'https://chat.whatsapp.com/LWNe97Hi0RmJcyzCbLRnML',
  'Derecho': 'https://chat.whatsapp.com/JDaHTLqhPr2Akl3FjDn3Z2',
  'Ingeniería Mecatrónica': 'https://chat.whatsapp.com/I3efUAPaQZR7bJAzwFRdLD',
  'Ingeniería Civil': 'https://chat.whatsapp.com/GHxay2tgAZMAp0CfvhpLaT',
  'Ingeniería Comercial': 'https://chat.whatsapp.com/JUEIoniJhOp3zfkXxGS4tW',
  'Psicología': 'https://chat.whatsapp.com/JZJy4ZaT74A0UirIZiGUdY',
  'Comunicación Social': 'https://chat.whatsapp.com/GopVVDdpUH98GhKqRpnSBI',
  'Diseño Gráfico': 'https://chat.whatsapp.com/HQWK10JbhyWLv7S32UxKIo',
  'Ingeniería Ambiental': 'https://chat.whatsapp.com/G5YjiIc5BagCC59dmuykGw',
  'Economía': 'https://chat.whatsapp.com/HrVAxuV9f4P55fh37Tk5Xy',
};

// Catálogo canónico con keywords para tolerancia a errores ortográficos, tildes y mayúsculas
const CANONICAL_CAREERS = [
  {
    nombreOficial: 'Economía',
    keywords: ['economia', 'economica', 'economista'],
    url: 'https://chat.whatsapp.com/HrVAxuV9f4P55fh37Tk5Xy',
  },
  {
    nombreOficial: 'Ingeniería de Sistemas',
    keywords: ['sistemas', 'software', 'informatica', 'computacion'],
    url: 'https://chat.whatsapp.com/H8ZOO6eqwo518VFLFM8eVJ',
  },
  {
    nombreOficial: 'Administración de Empresas',
    keywords: ['administracion', 'empresas', 'administrador'],
    url: 'https://chat.whatsapp.com/DlJvelvJwCuG8htWef6Sxh',
  },
  {
    nombreOficial: 'Ingeniería Industrial',
    keywords: ['industrial'],
    url: 'https://chat.whatsapp.com/LWNe97Hi0RmJcyzCbLRnML',
  },
  {
    nombreOficial: 'Derecho',
    keywords: ['derecho', 'leyes', 'juridica', 'abogacia'],
    url: 'https://chat.whatsapp.com/JDaHTLqhPr2Akl3FjDn3Z2',
  },
  {
    nombreOficial: 'Ingeniería Mecatrónica',
    keywords: ['mecatronica', 'robotica'],
    url: 'https://chat.whatsapp.com/I3efUAPaQZR7bJAzwFRdLD',
  },
  {
    nombreOficial: 'Ingeniería Civil',
    keywords: ['civil', 'construcciones'],
    url: 'https://chat.whatsapp.com/GHxay2tgAZMAp0CfvhpLaT',
  },
  {
    nombreOficial: 'Ingeniería Comercial',
    keywords: ['comercial', 'marketing'],
    url: 'https://chat.whatsapp.com/JUEIoniJhOp3zfkXxGS4tW',
  },
  {
    nombreOficial: 'Psicología',
    keywords: ['psicologia', 'psicologo'],
    url: 'https://chat.whatsapp.com/JZJy4ZaT74A0UirIZiGUdY',
  },
  {
    nombreOficial: 'Comunicación Social',
    keywords: ['comunicacion', 'periodismo'],
    url: 'https://chat.whatsapp.com/GopVVDdpUH98GhKqRpnSBI',
  },
  {
    nombreOficial: 'Diseño Gráfico',
    keywords: ['diseno', 'grafico', 'diseno grafico'],
    url: 'https://chat.whatsapp.com/HQWK10JbhyWLv7S32UxKIo',
  },
  {
    nombreOficial: 'Ingeniería Ambiental',
    keywords: ['ambiental', 'ecologia'],
    url: 'https://chat.whatsapp.com/G5YjiIc5BagCC59dmuykGw',
  },
];

/**
 * Limpia un texto removiendo acentos, signos y convirtiendo a minúsculas
 */
function cleanText(str) {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes (á->a, é->e, í->i, ó->o, ú->u)
    .replace(/\s+/g, ' ');
}

/**
 * Normaliza el nombre de la carrera a su forma oficial institucional UCB.
 * Tolera entradas como "Economia", "ECONOMÍA", "Licenciatura en Economia", etc.
 */
function normalizarNombreCarrera(carrera) {
  if (!carrera || typeof carrera !== 'string') {
    return 'Ingeniería de Sistemas';
  }

  const limpio = cleanText(carrera);

  // 1. Coincidencia exacta con nombre oficial
  for (const item of CANONICAL_CAREERS) {
    if (cleanText(item.nombreOficial) === limpio) {
      return item.nombreOficial;
    }
  }

  // 2. Coincidencia por palabras clave o contenido parcial
  for (const item of CANONICAL_CAREERS) {
    if (limpio.includes(cleanText(item.nombreOficial))) {
      return item.nombreOficial;
    }
    for (const kw of item.keywords) {
      if (limpio.includes(cleanText(kw))) {
        return item.nombreOficial;
      }
    }
  }

  // Si no coincide con ninguna carrera conocida, retornar el valor recortado
  return carrera.trim();
}

/**
 * Obtiene el enlace de WhatsApp correspondiente para una carrera dada,
 * aplicando normalización insensible a mayúsculas y acentos.
 */
function obtenerEnlaceWhatsApp(carrera) {
  if (!carrera) {
    return WHATSAPP_COMUNIDADES['Ingeniería de Sistemas'];
  }

  const carreraNormalizada = normalizarNombreCarrera(carrera);

  // Búsqueda directa por nombre canónico
  if (WHATSAPP_COMUNIDADES[carreraNormalizada]) {
    return WHATSAPP_COMUNIDADES[carreraNormalizada];
  }

  // Búsqueda en el catálogo canónico
  const match = CANONICAL_CAREERS.find((c) => c.nombreOficial === carreraNormalizada);
  if (match) {
    return match.url;
  }

  // Fallback por defecto a la comunidad general
  return 'https://chat.whatsapp.com/H8ZOO6eqwo518VFLFM8eVJ';
}

module.exports = {
  WHATSAPP_COMUNIDADES,
  normalizarNombreCarrera,
  obtenerEnlaceWhatsApp,
};
