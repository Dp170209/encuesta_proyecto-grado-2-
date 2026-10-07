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

function obtenerEnlaceWhatsApp(carrera) {
  if (!carrera) {
    return 'https://chat.whatsapp.com/H8ZOO6eqwo518VFLFM8eVJ'; // Fallback a Sistemas o comunidad general
  }
  return WHATSAPP_COMUNIDADES[carrera] || 'https://chat.whatsapp.com/H8ZOO6eqwo518VFLFM8eVJ';
}

module.exports = {
  WHATSAPP_COMUNIDADES,
  obtenerEnlaceWhatsApp,
};
