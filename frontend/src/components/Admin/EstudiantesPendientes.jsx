import React, { useState, useEffect, useMemo } from 'react';
import './EstudiantesPendientes.css';
import { getEstudiantesPendientes, enviarRecordatorioEstudiante } from '../../services/adminApi';

export default function EstudiantesPendientes() {
  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCarrera, setFiltroCarrera] = useState('Todas');
  const [estadosEnvio, setEstadosEnvio] = useState({}); // { [id]: 'enviando' | 'exito' | 'error' }
  const [mensajesEnvio, setMensajesEnvio] = useState({});

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await getEstudiantesPendientes({
        carrera: filtroCarrera,
        busqueda: busqueda.trim(),
      });
      setPendientes(res.data || []);
    } catch (err) {
      setError(err.message || 'Error al obtener la lista de estudiantes pendientes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroCarrera]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  // Obtener lista única de carreras
  const carrerasUnicas = useMemo(() => {
    const setCarreras = new Set();
    pendientes.forEach((p) => {
      if (p.carrera) setCarreras.add(p.carrera);
    });
    return Array.from(setCarreras).sort();
  }, [pendientes]);

  // Manejar envío individual de recordatorio
  const handleEnviarRecordatorio = async (estudiante) => {
    const id = estudiante.id_habilitado;
    setEstadosEnvio((prev) => ({ ...prev, [id]: 'enviando' }));
    try {
      const res = await enviarRecordatorioEstudiante(id);
      setEstadosEnvio((prev) => ({ ...prev, [id]: 'exito' }));
      setMensajesEnvio((prev) => ({
        ...prev,
        [id]: res.mensaje || 'Recordatorio enviado',
      }));
    } catch (err) {
      setEstadosEnvio((prev) => ({ ...prev, [id]: 'error' }));
      setMensajesEnvio((prev) => ({
        ...prev,
        [id]: err.message || 'Error al enviar recordatorio',
      }));
    }
  };

  return (
    <div className="pendientes-container">
      {/* Cabecera */}
      <div className="pendientes-header">
        <div>
          <h2 className="pendientes-title">Estudiantes Pendientes de Encuesta</h2>
          <p className="pendientes-subtitle">
            Nómina de estudiantes habilitados para titulación que aún no han completado el formulario oficial.
          </p>
        </div>

        <div className="pendientes-badge-total">
          <span className="badge-count">{pendientes.length}</span>
          <span className="badge-label">Graduados pendientes</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="pendientes-toolbar">
        <form onSubmit={handleBuscar} className="toolbar-search-form">
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Buscar por nombre, apellido, CI o correo institucional..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="submit" className="toolbar-btn-search">
            Buscar
          </button>
        </form>

        <div className="toolbar-filters-row">
          <div className="toolbar-filter-item">
            <label>Filtrar por Carrera:</label>
            <select
              value={filtroCarrera}
              onChange={(e) => setFiltroCarrera(e.target.value)}
              className="toolbar-select"
            >
              <option value="Todas">Todas las carreras</option>
              {carrerasUnicas.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setBusqueda('');
              setFiltroCarrera('Todas');
            }}
            className="toolbar-btn-clean"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="pendientes-error-banner">
          <div>{error}</div>
        </div>
      )}

      {/* Tabla de Estudiantes Pendientes */}
      <div className="pendientes-table-wrapper">
        <table className="pendientes-table">
          <thead>
            <tr>
              <th>Carnet de Identidad</th>
              <th>Estudiante Habilitado</th>
              <th>Carrera</th>
              <th>Modalidad</th>
              <th>Semestre</th>
              <th>Correo Institucional</th>
              <th style={{ textAlign: 'center' }}>Enviar Recordatorio</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan="7" className="table-loading-cell">
                  Consultando nómina de estudiantes pendientes...
                </td>
              </tr>
            ) : pendientes.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-empty-cell">
                  ¡Excelente! No hay estudiantes pendientes con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              pendientes.map((est) => {
                const estado = estadosEnvio[est.id_habilitado];
                const mensaje = mensajesEnvio[est.id_habilitado];

                return (
                  <tr key={est.id_habilitado}>
                    <td style={{ fontWeight: '600', color: '#1e293b' }}>
                      {est.carnet_identidad}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>
                        {est.nombre_completo}
                      </div>
                    </td>
                    <td>{est.carrera}</td>
                    <td>{est.modalidad_titulacion || 'Tesis'}</td>
                    <td>
                      <span className="badge-semestre">
                        {est.gestion_semestre || '2026-1'}
                      </span>
                    </td>
                    <td>
                      <span className="correo-inst-text">
                        {est.correo_institucional || 'Sin correo registrado'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {estado === 'enviando' ? (
                        <span className="badge-sending">Enviando correo...</span>
                      ) : estado === 'exito' ? (
                        <div className="status-success" title={mensaje}>
                          <span className="status-icon">✓</span>
                          <span>Recordatorio Enviado</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-campana-recordatorio"
                          onClick={() => handleEnviarRecordatorio(est)}
                          title={`Enviar correo de recordatorio a ${est.correo_institucional || 'estudiante'}`}
                        >
                          <svg
                            className="campana-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                          <span>Recordar</span>
                        </button>
                      )}
                      {estado === 'error' && (
                        <div className="status-error-hint">{mensaje}</div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pendientes-footer-info">
        Al presionar <strong>"Recordar"</strong>, el sistema despachará automáticamente un correo formal con el enlace de acceso directo a la encuesta institucional.
      </div>
    </div>
  );
}
