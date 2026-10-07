const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000/api';

/**
 * Envía las respuestas estructuradas consolidadas (JSONB) al backend
 * Utiliza el token JWT almacenado en sessionStorage
 */
export async function guardarEncuesta(contenidoJson, gestionAcademica = 2026) {
  const token = sessionStorage.getItem('usei_token');

  if (!token) {
    throw new Error('No se encontró una sesión activa. Debe validar su identidad previamente.');
  }

  const response = await fetch(`${API_BASE_URL}/encuesta/guardar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      contenido_json: contenidoJson,
      gestion_academica: gestionAcademica,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error al guardar la encuesta.');
  }

  return data;
}

/**
 * Consulta el estado de completitud de la encuesta para el graduado autenticado
 */
export async function consultarEstadoEncuesta() {
  const token = sessionStorage.getItem('usei_token');
  if (!token) return { completada: false };

  try {
    const response = await fetch(`${API_BASE_URL}/encuesta/estado`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Error al consultar estado de encuesta:', error);
    return { completada: false };
  }
}
