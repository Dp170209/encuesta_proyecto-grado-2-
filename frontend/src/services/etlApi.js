import { getAdminToken } from './adminApi';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000/api';

/**
 * Envía el archivo Excel/CSV al backend para procesar la lista de habilitados
 * @param {File} file - Objeto File del archivo seleccionado
 * @param {string} gestionSemestre - Periodo académico (ej. "2026-1")
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function subirListaHabilitados(file, gestionSemestre = '2026-1') {
  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('gestion_semestre', gestionSemestre);

  const token = getAdminToken();

  const response = await fetch(`${API_BASE_URL}/etl/cargar-habilitados`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error al procesar el archivo en el servidor.');
  }

  return data;
}

/**
 * Consulta la lista de los últimos estudiantes habilitados cargados
 * @param {number} limite 
 * @returns {Promise<Array>}
 */
export async function obtenerHabilitados(limite = 20) {
  const token = getAdminToken();

  const response = await fetch(`${API_BASE_URL}/etl/habilitados?limite=${limite}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error al obtener la lista de estudiantes habilitados.');
  }

  return data.data || [];
}
