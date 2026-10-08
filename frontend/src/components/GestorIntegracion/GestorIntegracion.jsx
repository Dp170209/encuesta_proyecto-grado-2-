import React, { useState, useEffect, useRef } from 'react';
import './GestorIntegracion.css';
import { subirListaHabilitados, obtenerHabilitados } from '../../services/etlApi';

export default function GestorIntegracion() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [gestionSemestre, setGestionSemestre] = useState('2026-1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(false);

  const fileInputRef = useRef(null);

  // Carga inicial del historial de estudiantes habilitados
  useEffect(() => {
    cargarListaReciente();
  }, []);

  const cargarListaReciente = async () => {
    try {
      setCargandoLista(true);
      const data = await obtenerHabilitados(15);
      setEstudiantes(data);
    } catch (err) {
      console.error('Error al cargar historial inicial:', err);
    } finally {
      setCargandoLista(false);
    }
  };

  // Manejo de eventos Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validarYEstablecerArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validarYEstablecerArchivo(e.target.files[0]);
    }
  };

  const validarYEstablecerArchivo = (selectedFile) => {
    setError(null);
    setSuccessData(null);

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setError('Formato no soportado. Seleccione únicamente archivos con extensión .xlsx o .csv.');
      return;
    }

    setFile(selectedFile);
  };

  const handleEliminarArchivo = () => {
    setFile(null);
    setError(null);
    setSuccessData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Envío asíncrono hacia el backend
  const handleSubirArchivo = async () => {
    if (!file) {
      setError('Por favor seleccione o arrastre un archivo primero.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessData(null);

      const res = await subirListaHabilitados(file, gestionSemestre);

      setSuccessData(res);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Actualizar la lista en pantalla
      cargarListaReciente();
    } catch (err) {
      setError(err.message || 'Error al procesar el archivo en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const formatoTamanio = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="etl-container">
      <div className="etl-header">

        <span
          style={{
            backgroundColor: '#f59e0b',
            color: '#0a2540',
            fontSize: '0.72rem',
            fontWeight: '800',
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'inline-block',
            marginBottom: '0.5rem',
          }}
        >
          Módulo de Ingesta ETL de Kardex
        </span>
        <h1 className="etl-title">Gestor de Integración y Carga de Habilitados</h1>
        <p className="etl-subtitle">
          Padrón Oficial de Estudiantes para Monitoreo y Acceso a la Encuesta · Sede La Paz
        </p>
      </div>

      {/* Tarjeta de Carga */}
      <div className="etl-card">
        {/* Selector de Gestión Semestral */}
        <div className="etl-filter-bar">
          <label htmlFor="gestion-select" className="etl-filter-label">
            Periodo Académico:
          </label>
          <select
            id="gestion-select"
            className="etl-select"
            value={gestionSemestre}
            onChange={(e) => setGestionSemestre(e.target.value)}
            disabled={loading}
          >
            <option value="2026-1">2026-1 (Semestre Actual)</option>
            <option value="2026-2">2026-2</option>
            <option value="2025-2">2025-2</option>
            <option value="2025-1">2025-1</option>
          </select>
        </div>

        {/* Zona Drag & Drop */}
        <div
          className={`dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="file-input-hidden"
            onChange={handleFileChange}
          />

          <svg
            className="dropzone-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <h3 className="dropzone-title">Arrastre y suelte su archivo Excel aquí</h3>
          <p className="dropzone-desc">
            El sistema procesará automáticamente el archivo para limpiar duplicados y cargar
            a los estudiantes habilitados del semestre. Solo formato .xlsx o .csv
          </p>

          <button
            type="button"
            className="btn-browse"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Examinar Archivos
          </button>
        </div>

        {/* Vista previa de archivo seleccionado */}
        {file && (
          <div className="selected-file-card">
            <div className="file-info">
              <span className="file-icon">📄</span>
              <div>
                <span className="file-name">{file.name}</span>
                <span className="file-size">({formatoTamanio(file.size)})</span>
              </div>
            </div>
            <div className="file-actions">
              <button
                type="button"
                className="btn-remove"
                onClick={handleEliminarArchivo}
                disabled={loading}
              >
                Quitar
              </button>
              <button
                type="button"
                className="btn-upload"
                onClick={handleSubirArchivo}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Procesando...
                  </>
                ) : (
                  'Procesar e Importar'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Notificación de Éxito */}
        {successData && (
          <div className="alert-box alert-success">
            <div className="alert-title">
              ✓ {successData.mensaje || 'Estudiantes habilitados cargados con éxito.'}
            </div>
            <div className="stats-grid">
              <div className="stat-chip">
                Filas leídas: <strong>{successData.total_procesados}</strong>
              </div>
              <div className="stat-chip">
                Nuevos registrados: <strong>{successData.nuevos_insertados}</strong>
              </div>
              <div className="stat-chip">
                Duplicados omitidos: <strong>{successData.omitidos_duplicados}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Notificación de Error con detalle de fila */}
        {error && (
          <div className="alert-box alert-error">
            <div className="alert-title">⚠️ Error en la validación del archivo:</div>
            <div>{error}</div>
          </div>
        )}
      </div>

      {/* Tabla del Historial de Habilitados */}
      <div className="table-section">
        <h2 className="table-title">Últimos Estudiantes Habilitados Registrados</h2>
        <div className="table-responsive">
          <table className="etl-table">
            <thead>
              <tr>
                <th>CI / Carnet</th>
                <th>Estudiante</th>
                <th>Carrera</th>
                <th>Modalidad</th>
                <th>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {cargandoLista ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    Cargando listado...
                  </td>
                </tr>
              ) : estudiantes.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Aún no hay estudiantes habilitados registrados. Suba un archivo Excel para comenzar.
                  </td>
                </tr>
              ) : (
                estudiantes.map((est) => (
                  <tr key={est.id_habilitado || est.carnet_identidad}>
                    <td><strong>{est.carnet_identidad}</strong></td>
                    <td>{`${est.apellidos || ''}, ${est.nombres || ''}`}</td>
                    <td>{est.carrera}</td>
                    <td>
                      <span className="badge-modalidad">
                        {est.modalidad_titulacion || 'Tesis'}
                      </span>
                    </td>
                    <td>{est.gestion_semestre}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
