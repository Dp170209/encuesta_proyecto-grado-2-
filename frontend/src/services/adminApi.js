const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000/api';

const ADMIN_TOKEN_KEY = 'usei_admin_token';
const ADMIN_USER_KEY = 'usei_admin_user';

export function guardarAdminSesion({ token, admin }) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  if (admin) localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getAdminSesion() {
  const user = localStorage.getItem(ADMIN_USER_KEY);
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token || !user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function cerrarSesionAdmin() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

/**
 * Autentica un Administrador con sus credenciales institucionales
 */
export async function loginAdmin({ correo_institucional, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo_institucional, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Credenciales administrativas incorrectas.');
  }

  guardarAdminSesion({ token: data.token, admin: data.admin });
  return data;
}

/**
 * Obtiene los indicadores y gráficos analíticos del Dashboard
 */
export async function getDashboardAnalitica() {
  const token = getAdminToken();

  const response = await fetch(`${API_BASE_URL}/analitica/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error al cargar los datos del panel analítico.');
  }

  return data.data;
}

/**
 * Descarga el archivo Excel consolidado de seguimiento (.xlsx)
 */
export async function descargarReporteExcel() {
  const token = getAdminToken();

  const response = await fetch(`${API_BASE_URL}/analitica/exportar`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'No se pudo generar el reporte en Excel.');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fechaHoy = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `Reporte_Seguimiento_USEI_${fechaHoy}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Consulta la lista de encuestas respondidas con filtros
 */
export async function getRespuestasEstudiantes(filtros = {}) {
  const token = getAdminToken();
  const params = new URLSearchParams();

  if (filtros.carrera && filtros.carrera !== 'Todas') params.append('carrera', filtros.carrera);
  if (filtros.semestre && filtros.semestre !== 'Todos') params.append('semestre', filtros.semestre);
  if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
  if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
  if (filtros.busqueda) params.append('busqueda', filtros.busqueda);

  const response = await fetch(`${API_BASE_URL}/analitica/respuestas-estudiantes?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al obtener la lista de respuestas.');
  }

  return data;
}

/**
 * Obtiene el detalle de respuestas de un estudiante individual
 */
export async function getDetalleRespuesta(id_respuesta) {
  const token = getAdminToken();

  const response = await fetch(`${API_BASE_URL}/analitica/respuestas-estudiantes/${id_respuesta}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al obtener el detalle de la encuesta.');
  }

  return data.data;
}

/**
 * Consulta la nómina de estudiantes habilitados que aún no completaron la encuesta
 */
export async function getEstudiantesPendientes(filtros = {}) {
  const token = getAdminToken();
  const params = new URLSearchParams();

  if (filtros.carrera && filtros.carrera !== 'Todas') params.append('carrera', filtros.carrera);
  if (filtros.busqueda) params.append('busqueda', filtros.busqueda);

  const response = await fetch(`${API_BASE_URL}/analitica/estudiantes-pendientes?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al consultar estudiantes pendientes.');
  }

  return data;
}

/**
 * Envía un correo recordatorio institucional a un estudiante pendiente
 */
export async function enviarRecordatorioEstudiante(id_habilitado) {
  const token = getAdminToken();

  const response = await fetch(`${API_BASE_URL}/analitica/enviar-recordatorio/${id_habilitado}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'No se pudo enviar el recordatorio.');
  }

  return data;
}

/**
 * Descarga las respuestas en archivo Excel (.xlsx) con filtros y columnas claras
 */
export async function descargarRespuestasExcel(filtros = {}) {
  const token = getAdminToken();
  const params = new URLSearchParams();

  if (filtros.carrera && filtros.carrera !== 'Todas') params.append('carrera', filtros.carrera);
  if (filtros.semestre && filtros.semestre !== 'Todos') params.append('semestre', filtros.semestre);
  if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
  if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
  if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
  if (filtros.ids && filtros.ids.length > 0) params.append('ids', filtros.ids.join(','));

  const response = await fetch(`${API_BASE_URL}/analitica/exportar-respuestas?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'No se pudo generar el Excel de respuestas.');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fechaHoy = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `Respuestas_Encuesta_USEI_${fechaHoy}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
