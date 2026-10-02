const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000/api';

/**
 * Valida la identidad del estudiante y genera el token de sesión temporal
 * @param {Object} credenciales - { carnet_identidad, nombre_completo, correo_privado }
 * @returns {Promise<Object>}
 */
export async function verificarGraduado(credenciales) {
  const response = await fetch(`${API_BASE_URL}/auth/verificar-graduado`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credenciales),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo verificar la identidad del estudiante.');
  }

  // Almacenar el token en sessionStorage para la sesión única
  if (data.token) {
    sessionStorage.setItem('usei_token', data.token);
    sessionStorage.setItem('usei_graduado', JSON.stringify(data.graduado));
  }

  return data;
}

/**
 * Obtiene los datos del graduado autenticado en la sesión actual
 */
export function getGraduadoSesion() {
  const data = sessionStorage.getItem('usei_graduado');
  return data ? JSON.parse(data) : null;
}

/**
 * Cierra la sesión temporal
 */
export function cerrarSesion() {
  sessionStorage.removeItem('usei_token');
  sessionStorage.removeItem('usei_graduado');
}
