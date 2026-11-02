import React, { useState, useEffect, useMemo } from 'react';
import './RespuestasEstudiantes.css';
import { getRespuestasEstudiantes, getDetalleRespuesta, descargarRespuestasExcel } from '../../services/adminApi';

export default function RespuestasEstudiantes() {
  const [respuestas, setRespuestas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCarrera, setFiltroCarrera] = useState('Todas');
  const [filtroSemestre, setFiltroSemestre] = useState('Todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [descargando, setDescargando] = useState(false);

  // Estado del Modal de Detalle
  const [modalAbierto, setModalAbierto] = useState(false);
  const [detalleEstudiante, setDetalleEstudiante] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [filtroPregunta, setFiltroPregunta] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await getRespuestasEstudiantes({
        carrera: filtroCarrera,
        semestre: filtroSemestre,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        busqueda: busqueda.trim(),
      });
      setRespuestas(res.data || []);
      setSeleccionados([]);
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroCarrera, filtroSemestre, fechaDesde, fechaHasta]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setFiltroCarrera('Todas');
    setFiltroSemestre('Todos');
    setFechaDesde('');
    setFechaHasta('');
  };

  // Selección individual y masiva
  const handleToggleSeleccion = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleTodos = () => {
    if (seleccionados.length === respuestas.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(respuestas.map((r) => r.id_respuesta));
    }
  };

  // Abrir Modal de Respuestas
  const handleVerRespuestas = async (id_respuesta) => {
    setModalAbierto(true);
    setCargandoDetalle(true);
    setFiltroPregunta('');
    try {
      const data = await getDetalleRespuesta(id_respuesta);
      setDetalleEstudiante(data);
    } catch (err) {
      alert(`Error al cargar las respuestas: ${err.message}`);
      setModalAbierto(false);
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Descarga de Excel
  const handleDescargarExcel = async (soloSeleccionados = false) => {
    setDescargando(true);
    try {
      await descargarRespuestasExcel({
        carrera: filtroCarrera,
        semestre: filtroSemestre,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        busqueda: busqueda.trim(),
        ids: soloSeleccionados ? seleccionados : undefined,
      });
    } catch (err) {
      alert(`Error al generar el archivo Excel: ${err.message}`);
    } finally {
      setDescargando(false);
    }
  };

  // Obtener lista única de carreras y semestres para filtros
  const carrerasUnicas = useMemo(() => {
    const setCarreras = new Set();
    respuestas.forEach((r) => {
      if (r.carrera) setCarreras.add(r.carrera);
    });
    return Array.from(setCarreras).sort();
  }, [respuestas]);

  // Preguntas mapeadas en orden lógico para el modal
  const preguntasOrganizadas = useMemo(() => {
    if (!detalleEstudiante || !detalleEstudiante.contenido_json) return [];
    const json = detalleEstudiante.contenido_json;

    const lista = [
      // 1. Datos Generales
      { seccion: '1. Datos Generales', pregunta: '1.1. Carrera de Graduación', valor: detalleEstudiante.carrera },
      { seccion: '1. Datos Generales', pregunta: '1.2. Año de Ingreso a la Universidad', valor: json.S1_AnioIngreso },
      { seccion: '1. Datos Generales', pregunta: '1.3. Apellido Paterno', valor: json.S1P02_ApellidoPaterno },
      { seccion: '1. Datos Generales', pregunta: '1.4. Apellido Materno', valor: json.S1P03_ApellidoMaterno || 'No registra' },
      { seccion: '1. Datos Generales', pregunta: '1.5. Nombres', valor: json.S1P04_Nombres },
      { seccion: '1. Datos Generales', pregunta: '1.6. Edad', valor: json.S1P05_Edad },
      { seccion: '1. Datos Generales', pregunta: '1.7. Sexo', valor: json.S1P06_Sexo },
      { seccion: '1. Datos Generales', pregunta: '1.8. Teléfono Fijo', valor: json.S1P07_TelefonoFijo || 'No registra' },
      { seccion: '1. Datos Generales', pregunta: '1.9. Teléfono Móvil / Celular', valor: json.S1P08_Celular || detalleEstudiante.celular },
      { seccion: '1. Datos Generales', pregunta: '1.10. Correo Electrónico Personal', valor: json.S1P09_CorreoElectronico || detalleEstudiante.correo_privado },
      { seccion: '1. Datos Generales', pregunta: '1.11. Carnet de Identidad', valor: detalleEstudiante.carnet_identidad },
      { seccion: '1. Datos Generales', pregunta: '1.12. Ciudad de Nacimiento', valor: json.S1P10_CiudadNacimiento },
      { seccion: '1. Datos Generales', pregunta: '1.13. Ciudad de Residencia', valor: json.S1P12_CiudadResidencia },
      { seccion: '1. Datos Generales', pregunta: '1.14. Dirección de Domicilio', valor: json.S1P13_Direccion },

      // 2. Información Familiar y Académica
      { seccion: '2. Información Familiar y Académica', pregunta: '2.1. Estado Civil', valor: json.S2P01_EstadoCivil },
      { seccion: '2. Información Familiar y Académica', pregunta: '2.2. ¿Tiene Hijos?', valor: json.S2P02_TieneHijos },
      { seccion: '2. Información Familiar y Académica', pregunta: '2.3. Nivel de Instrucción del Padre', valor: json.S2P03_NivelPadre },
      { seccion: '2. Información Familiar y Académica', pregunta: '2.4. Nivel de Instrucción de la Madre', valor: json.S2P04_NivelMadre },
      { seccion: '2. Información Familiar y Académica', pregunta: '2.5. Limitaciones Permanentes / Discapacidad', valor: json.S2P05_LimitacionesPermanentes || 'Ninguna' },
      { seccion: '2. Información Familiar y Académica', pregunta: '2.6. Modalidad de Titulación', valor: json.S2_ModalidadTitulacion || detalleEstudiante.modalidad_titulacion },
      { seccion: '2. Información Familiar y Académica', pregunta: '3.1. Motivo de Elección de Carrera', valor: json.S3P01_MotivoEleccionCarrera },
      { seccion: '2. Información Familiar y Académica', pregunta: '3.2. ¿Pensó o gestionó cambio de carrera?', valor: json.S3P02_CambioCarrera },
      { seccion: '2. Información Familiar y Académica', pregunta: '3.3. Motivo de Cambio de Carrera', valor: json.S3P03_MotivoCambioCarrera || 'No aplica' },
      { seccion: '2. Información Familiar y Académica', pregunta: '3.4. Principal Fuente de Financiamiento', valor: json.S3P04_Financiamiento },

      // 3. Satisfacción y Formación
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Competencia: Aprendizaje Autónomo', valor: json.S4P01_Comp_Autonomo },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Competencia: Respeto a la Diversidad', valor: json.S4P01_Comp_Diversidad },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Competencia: Capacidad Analítica', valor: json.S4P01_Comp_Analitica },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Competencia: Pensamiento Crítico', valor: json.S4P01_Comp_Critica },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Competencia: Trabajo en Equipo', valor: json.S4P01_Comp_Equipo },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Competencia: Capacidad de Innovación', valor: json.S4P01_Comp_Innovar },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Competencia: Adaptación al Cambio', valor: json.S4P01_Comp_Adaptacion },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Competencia: Enfoque en Derechos Humanos', valor: json.S4P01_Comp_DerechosHumanos },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Idioma extranjero en Bachillerato/Colegio', valor: json.S4P02_BachilleratoIdioma },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Inglés: Comprensión Lectora', valor: json.S4P03_Ingles_Lee },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Inglés: Comprensión Auditiva', valor: json.S4P03_Ingles_Escucha },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Inglés: Expresión Escrita', valor: json.S4P03_Ingles_Escribe },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Inglés: Expresión Oral', valor: json.S4P03_Ingles_Habla },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Informática: Correo Electrónico y Búsquedas', valor: json.S4P04_Info_Correo },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Informática: Navegación Web y Plataformas', valor: json.S4P04_Info_Web },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Informática: Procesador de Textos', valor: json.S4P04_Info_Texto },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Informática: Hojas de Cálculo', valor: json.S4P04_Info_Calculo },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Docentes: Dominio de la Materia', valor: json.S4P05_Docente_Dominio },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Docentes: Estrategias de Enseñanza', valor: json.S4P05_Docente_Estrategias },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Docentes: Criterios Claros de Evaluación', valor: json.S4P05_Docente_Evaluacion },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Administrativos: Personal Calificado', valor: json.S4P06_Admin_Calificado },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Administrativos: Trato Cordial y Respetuoso', valor: json.S4P06_Admin_Cordial },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Administrativos: Atención Oportuna', valor: json.S4P06_Admin_Oportuno },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Bienestar: Pastoral Universitaria', valor: json.S4P07_Bienestar_Pastoral },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Bienestar: Actividades Culturales y Deportivas', valor: json.S4P07_Bienestar_Cultural },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Bienestar: Programa de Becas', valor: json.S4P07_Bienestar_Becas },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Bienestar: Servicios de Salud', valor: json.S4P07_Bienestar_Salud },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Infraestructura: Seguridad y Vigilancia', valor: json.S4P08_Infra_Seguridad },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Infraestructura: Espacios de Esparcimiento', valor: json.S4P08_Infra_Espacios },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Infraestructura: Laboratorios y Talleres', valor: json.S4P08_Infra_Laboratorios },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Infraestructura: Sanitarios / Baños', valor: json.S4P08_Infra_Banios },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Infraestructura: Aulas de Clase', valor: json.S4P08_Infra_Aulas },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Infraestructura: Equipos Tecnológicos', valor: json.S4P08_Infra_Equipos },
      { seccion: '3. Satisfacción y Competencias', pregunta: 'Infraestructura: Conexión Wi-Fi', valor: json.S4P08_Infra_Wifi },
      { seccion: '3. Satisfacción y Competencias', pregunta: '4.9. ¿Volvería a estudiar en la UCB?', valor: json.S4P09_0_VolveriaEstudiar },
      { seccion: '3. Satisfacción y Competencias', pregunta: '4.9.1. Motivo por el que SÍ volvería', valor: json.S4P09_1_MotivoVolveria || 'No aplica' },
      { seccion: '3. Satisfacción y Competencias', pregunta: '4.9.2. Motivo por el que NO volvería', valor: json.S4P09_2_MotivoNoVolveria || 'No aplica' },
      { seccion: '3. Satisfacción y Competencias', pregunta: '4.9.3. ¿Realizó viajes de intercambio?', valor: json.S4P09_3_ViajeIntercambio || 'No' },
      { seccion: '3. Satisfacción y Competencias', pregunta: '4.9.4. ¿Participó en sociedades u organizaciones estudiantiles?', valor: json.S4P09_4_OrgEstudiantil || 'No' },
      { seccion: '3. Satisfacción y Competencias', pregunta: '4.9.5. ¿Participó en actividades extracurriculares?', valor: json.S4P09_5_Extracurriculares || 'No' },
      { seccion: '3. Satisfacción y Competencias', pregunta: '4.9.5.1. Valoración de actividades extracurriculares', valor: json.S4P09_5_1_ValoracionExtracurricular || 'No aplica' },
      { seccion: '3. Satisfacción y Competencias', pregunta: '4.9.6. ¿Participó en programas de voluntariado?', valor: json.S4P09_6_Voluntariado || 'No' },
      { seccion: '3. Satisfacción y Competencias', pregunta: '4.9.6.1. Tipo de voluntariado', valor: json.S4P09_6_TipoVoluntariado || 'No aplica' },

      // 4. Inserción Laboral
      { seccion: '4. Inserción Laboral', pregunta: '5.1. Situación / Actividad Laboral Actual', valor: json.S5P01_ActividadActual },
      { seccion: '4. Inserción Laboral', pregunta: '5.1.1. ¿Es su primer empleo?', valor: json.S5P01_1_PrimerEmpleo || 'No aplica' },
      { seccion: '4. Inserción Laboral', pregunta: '5.1.2. Antigüedad en el empleo', valor: json.S5P01_2_Antiguedad || 'No aplica' },
      { seccion: '4. Inserción Laboral', pregunta: '5.1.3. ¿Es propietario o socio?', valor: json.S5P01_3_PropietarioSocio || 'No aplica' },
      { seccion: '4. Inserción Laboral', pregunta: '5.1.4. Tipo de Institución / Empleador', valor: json.S5P01_4_TipoInstitucion || 'No aplica' },
      { seccion: '4. Inserción Laboral', pregunta: '5.1.5. Relación del trabajo con la carrera', valor: json.S5P01_5_RelacionEstudios || 'No aplica' },
      { seccion: '4. Inserción Laboral', pregunta: '5.1.6. Dedicación semanal (Horas)', valor: json.S5P01_6_HorasSemana || 'No aplica' },
      { seccion: '4. Inserción Laboral', pregunta: '5.1.7. Modalidad de vinculación / Contrato', valor: json.S5P01_7_ModalidadVinculacion || 'No aplica' },
      { seccion: '4. Inserción Laboral', pregunta: '5.1.8. Rango Salarial Mensual', valor: json.S5P01_8_RangoSalarial || 'No aplica' },
      { seccion: '4. Inserción Laboral', pregunta: '5.1.9. Medio por el que consiguió el empleo', valor: json.S5P01_9_ComoConsiguioEmpleo || 'No aplica' },
      { seccion: '4. Inserción Laboral', pregunta: '5.2.1. ¿Está interesado en conseguir trabajo?', valor: json.S5P02_1_InteresadoEnEmpleo || 'No aplica' },
      { seccion: '4. Inserción Laboral', pregunta: '5.2.2. ¿Realiza gestiones activas de búsqueda?', valor: json.S5P02_2_GestionBusqueda || 'No aplica' },
      { seccion: '4. Inserción Laboral', pregunta: '5.2.3. Motivo por el que no encuentra empleo', valor: json.S5P02_3_MotivoNoEncuentra || 'No aplica' },

      // 5. Postgrado y Educación Continua
      { seccion: '5. Postgrado y Especialización', pregunta: '6.1. ¿Realizó algún programa de postgrado?', valor: json.S6P01_RealizoPostgrado || 'No' },
      { seccion: '5. Postgrado y Especialización', pregunta: '6.1.1. Máximo grado académico obtenido', valor: json.S6P01_1_MaximoGradoObtenido || 'No registra' },
      { seccion: '5. Postgrado y Especialización', pregunta: '6.1.2. Grado al que postula actualmente', valor: json.S6P01_2_GradoPostulando || 'No aplica' },
      { seccion: '5. Postgrado y Especialización', pregunta: '6.1.3. ¿Interés en realizar postgrado en UCB?', valor: json.S6P01_3_InteresPostgradoUCB },
      { seccion: '5. Postgrado y Especialización', pregunta: '6.2.1. Grado académico de mayor interés', valor: json.S6P02_1_GradoInteresAlcanzar },
      { seccion: '5. Postgrado y Especialización', pregunta: '6.2.2. Área temática de interés en postgrado', valor: json.S6P02_2_AreaInteresPostgrado },
    ];

    return lista;
  }, [detalleEstudiante]);

  // Filtro de preguntas en vivo en el modal
  const preguntasFiltradas = useMemo(() => {
    if (!filtroPregunta.trim()) return preguntasOrganizadas;
    const q = filtroPregunta.toLowerCase().trim();
    return preguntasOrganizadas.filter(
      (item) =>
        item.pregunta.toLowerCase().includes(q) ||
        item.seccion.toLowerCase().includes(q) ||
        String(item.valor || '').toLowerCase().includes(q)
    );
  }, [preguntasOrganizadas, filtroPregunta]);

  return (
    <div className="respuestas-container">
      {/* Cabecera del Módulo */}
      <div className="respuestas-header">
        <div>
          <h2 className="respuestas-title">Respuestas de Estudiantes</h2>
          <p className="respuestas-subtitle">
            Consulta individual de formularios finalizados y exportación a base de datos Excel.
          </p>
        </div>

        {/* Acciones de Exportación */}
        <div className="respuestas-export-actions">
          {seleccionados.length > 0 && (
            <button
              type="button"
              className="btn-export-selected"
              onClick={() => handleDescargarExcel(true)}
              disabled={descargando}
            >
              Descargar Seleccionados ({seleccionados.length}) (.xlsx)
            </button>
          )}

          <button
            type="button"
            className="btn-export-all"
            onClick={() => handleDescargarExcel(false)}
            disabled={descargando || respuestas.length === 0}
          >
            {descargando ? 'Generando Excel...' : 'Exportar Base de Datos Completa (.xlsx)'}
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="respuestas-toolbar">
        <form onSubmit={handleBuscar} className="toolbar-search-form">
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Buscar por nombre, apellido o Carnet de Identidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="submit" className="toolbar-btn-search">
            Buscar
          </button>
        </form>

        <div className="toolbar-filters-row">
          <div className="toolbar-filter-item">
            <label>Carrera:</label>
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

          <div className="toolbar-filter-item">
            <label>Fecha Desde:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="toolbar-date-input"
            />
          </div>

          <div className="toolbar-filter-item">
            <label>Fecha Hasta:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="toolbar-date-input"
            />
          </div>

          <button
            type="button"
            onClick={handleLimpiarFiltros}
            className="toolbar-btn-clean"
            title="Restablecer todos los filtros"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="respuestas-error-banner">
          <div>{error}</div>
        </div>
      )}

      {/* Tabla de Estudiantes con Respuestas */}
      <div className="respuestas-table-wrapper">
        <table className="respuestas-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={respuestas.length > 0 && seleccionados.length === respuestas.length}
                  onChange={handleToggleTodos}
                  title="Seleccionar todos"
                />
              </th>
              <th>N° Certificado</th>
              <th>Carnet de Identidad</th>
              <th>Estudiante</th>
              <th>Carrera</th>
              <th>Modalidad</th>
              <th>Fecha de Llenado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan="8" className="table-loading-cell">
                  Cargando base de datos de encuestas...
                </td>
              </tr>
            ) : respuestas.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty-cell">
                  No se encontraron respuestas registradas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              respuestas.map((r) => {
                const isSelected = seleccionados.includes(r.id_respuesta);
                return (
                  <tr key={r.id_respuesta} className={isSelected ? 'row-selected' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSeleccion(r.id_respuesta)}
                      />
                    </td>
                    <td>
                      <span className="badge-cert">
                        {r.nro_certificado
                          ? `USEI-2026-${String(r.nro_certificado).padStart(5, '0')}`
                          : 'Emitido'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: '#1e293b' }}>{r.carnet_identidad}</td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{r.nombre_completo}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{r.correo_privado}</div>
                    </td>
                    <td>{r.carrera}</td>
                    <td>{r.modalidad_titulacion || 'Tesis'}</td>
                    <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {new Date(r.fecha_registro).toLocaleString('es-BO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-ver-respuestas"
                        onClick={() => handleVerRespuestas(r.id_respuesta)}
                      >
                        Ver Respuestas
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen inferior */}
      <div className="respuestas-footer-info">
        <span>Total mostrados: <strong>{respuestas.length}</strong> estudiantes</span>
        {seleccionados.length > 0 && (
          <span> | Seleccionados para exportación: <strong>{seleccionados.length}</strong></span>
        )}
      </div>

      {/* ===================================================================
          MODAL INTERACTIVO: VER RESPUESTAS DEL ESTUDIANTE
          =================================================================== */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Cabecera del Modal */}
            <div className="modal-header">
              <div>
                <span className="modal-pretitle">Formulario de Encuesta Oficial · USEI U.C.B.</span>
                <h3 className="modal-title">
                  {detalleEstudiante ? detalleEstudiante.nombre_completo : 'Cargando...'}
                </h3>
                {detalleEstudiante && (
                  <p className="modal-sub">
                    CI: <strong>{detalleEstudiante.carnet_identidad}</strong> | Carrera: <strong>{detalleEstudiante.carrera}</strong> | Fecha: {new Date(detalleEstudiante.fecha_registro).toLocaleString('es-BO')}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalAbierto(false)}
              >
                ✕
              </button>
            </div>

            {/* Buscador de preguntas en el modal */}
            <div className="modal-search-bar">
              <input
                type="text"
                placeholder="Buscar una pregunta o respuesta específica (ej. salario, postgrado, empleo, inglés)..."
                value={filtroPregunta}
                onChange={(e) => setFiltroPregunta(e.target.value)}
                className="modal-search-input"
              />
              {filtroPregunta && (
                <button
                  type="button"
                  className="modal-search-clear"
                  onClick={() => setFiltroPregunta('')}
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Contenido de Respuestas */}
            <div className="modal-body">
              {cargandoDetalle ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Cargando detalle de respuestas...
                </div>
              ) : preguntasFiltradas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                  No se encontraron preguntas que coincidan con la búsqueda.
                </div>
              ) : (
                <div className="modal-qa-list">
                  {preguntasFiltradas.map((item, index) => (
                    <div key={index} className="modal-qa-card">
                      <div className="qa-section-tag">{item.seccion}</div>
                      <div className="qa-question">{item.pregunta}</div>
                      <div className="qa-answer">{String(item.valor || 'Sin respuesta')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setModalAbierto(false)}
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
