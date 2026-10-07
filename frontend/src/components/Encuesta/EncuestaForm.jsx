import React, { useState, useEffect } from 'react';
import './EncuestaForm.css';
import { guardarEncuesta, descargarCertificadoPdf } from '../../services/encuestaApi';
import { getGraduadoSesion } from '../../services/authApi';

export default function EncuestaForm({ onEncuestaFinalizada, onVolverAInicio }) {
  const [pasoActual, setPasoActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState(null);
  const [finalizada, setFinalizada] = useState(false);
  const [graduado, setGraduado] = useState(null);
  const [resultadoEmision, setResultadoEmision] = useState(null);
  const [descargandoPdf, setDescargandoPdf] = useState(false);

  // =========================================================================
  // 100% DE LAS PREGUNTAS DEL ANEXO 3 OFICIAL - SISTEMA USEI UCB
  // =========================================================================
  const [respuestas, setRespuestas] = useState({
    // --- SECCIÓN 1: DATOS GENERALES (ANEXO 3.1) ---
    S1_AnioIngreso: '2020',
    S1P01_Carrera: '',
    S1P02_ApellidoPaterno: '',
    S1P03_ApellidoMaterno: '',
    S1P04_Nombres: '',
    S1P05_Edad: '24',
    S1P06_Sexo: 'Femenino',
    S1P07_TelefonoFijo: '',
    S1P08_Celular: '',
    S1P09_CorreoElectronico: '',
    S1P10_CiudadNacimiento: 'La Paz',
    S1P11_CI: '',
    S1P12_CiudadResidencia: 'La Paz',
    S1P13_Direccion: '',

    // --- SECCIÓN 2: INFORMACIÓN FAMILIAR Y ACADÉMICA (ANEXO 3.2 Y 3.3) ---
    S2P01_EstadoCivil: 'Soltero/a',
    S2P02_TieneHijos: 'No',
    S2P03_NivelPadre: 'Educación Universitaria Completa',
    S2P04_NivelMadre: 'Educación Universitaria Completa',
    S2P05_LimitacionesPermanentes: 'Ninguna',
    S2_ModalidadTitulacion: 'Proyecto de Grado',
    S3P01_MotivoEleccionCarrera: 'Vocación o habilidades',
    S3P02_CambioCarrera: 'No',
    S3P03_MotivoCambioCarrera: '',
    S3P04_Financiamiento: 'Padres',

    // --- SECCIÓN 3: SATISFACCIÓN Y COMPETENCIAS (ANEXO 3.4) ---
    // 4.1. Matriz de Satisfacción de Competencias Desarrolladas
    S4P01_Comp_Autonomo: 'Bueno',
    S4P01_Comp_Diversidad: 'Bueno',
    S4P01_Comp_Analitica: 'Bueno',
    S4P01_Comp_Critica: 'Bueno',
    S4P01_Comp_Equipo: 'Bueno',
    S4P01_Comp_Innovar: 'Bueno',
    S4P01_Comp_Adaptacion: 'Bueno',
    S4P01_Comp_DerechosHumanos: 'Bueno',
    // 4.2. Idioma en bachillerato
    S4P02_BachilleratoIdioma: 'No',
    // 4.3. Matriz Competencia Inglés (Lee, Escucha, Escribe, Habla)
    S4P03_Ingles_Lee: 'Bueno',
    S4P03_Ingles_Escucha: 'Bueno',
    S4P03_Ingles_Escribe: 'Regular',
    S4P03_Ingles_Habla: 'Regular',
    // 4.4. Matriz Herramientas Informáticas
    S4P04_Info_Correo: 'Excelente',
    S4P04_Info_Web: 'Bueno',
    S4P04_Info_Texto: 'Excelente',
    S4P04_Info_Calculo: 'Bueno',
    // 4.5. Plantel Docente
    S4P05_Docente_Dominio: 'De acuerdo',
    S4P05_Docente_Estrategias: 'De acuerdo',
    S4P05_Docente_Evaluacion: 'De acuerdo',
    // 4.6. Plantel Administrativo
    S4P06_Admin_Calificado: 'De acuerdo',
    S4P06_Admin_Cordial: 'De acuerdo',
    S4P06_Admin_Oportuno: 'De acuerdo',
    // 4.7. Servicios de Bienestar Estudiantil
    S4P07_Bienestar_Pastoral: 'De acuerdo',
    S4P07_Bienestar_Cultural: 'De acuerdo',
    S4P07_Bienestar_Becas: 'De acuerdo',
    S4P07_Bienestar_Salud: 'De acuerdo',
    // 4.8. Aspectos de Infraestructura
    S4P08_Infra_Seguridad: 'Bueno',
    S4P08_Infra_Espacios: 'Bueno',
    S4P08_Infra_Laboratorios: 'Bueno',
    S4P08_Infra_Banios: 'Regular',
    S4P08_Infra_Aulas: 'Bueno',
    S4P08_Infra_Equipos: 'Bueno',
    S4P08_Infra_Wifi: 'Regular',
    // 4.9.0 a 4.9.2 Volvería a estudiar
    S4P09_0_VolveriaEstudiar: 'Sí',
    S4P09_1_MotivoVolveria: 'Calidad de la formación académica y prestigio institucional',
    S4P09_2_MotivoNoVolveria: '',
    // 4.9.3 a 4.9.6 Participación
    S4P09_3_ViajeIntercambio: 'No',
    S4P09_4_OrgEstudiantil: 'No',
    S4P09_5_Extracurriculares: 'No',
    S4P09_5_1_ValoracionExtracurricular: 'Bueno',
    S4P09_6_Voluntariado: 'No',
    S4P09_6_TipoVoluntariado: '',

    // --- SECCIÓN 4: ACTIVIDAD LABORAL Y POSTGRADO (ANEXO 3.5 Y 3.6) ---
    S5P01_ActividadActual: 'Trabajo actualmente',
    // Rama 5.1 (Si trabaja actualmente)
    S5P01_1_PrimerEmpleo: 'Sí',
    S5P01_2_Antiguedad: 'Entre seis meses y un año',
    S5P01_3_PropietarioSocio: 'No',
    S5P01_4_TipoInstitucion: 'Empresa Privada',
    S5P01_5_RelacionEstudios: 'Muy relacionada',
    S5P01_6_HorasSemana: '20 a 40 horas',
    S5P01_7_ModalidadVinculacion: 'Contrato a plazo fijo',
    S5P01_8_RangoSalarial: '1 a 2 Salarios Mínimos',
    S5P01_9_ComoConsiguioEmpleo: 'Pasantías',
    // Rama 5.2 (Si busca trabajo)
    S5P02_1_InteresadoEnEmpleo: 'Sí',
    S5P02_2_GestionBusqueda: 'Sí',
    S5P02_3_MotivoNoEncuentra: 'Los empleadores consideran que soy muy joven',
    // Preguntas 6.1 a 6.2.2 (Postgrado)
    S6P01_RealizoPostgrado: 'No',
    S6P01_1_MaximoGradoObtenido: 'Licenciatura',
    S6P01_2_GradoPostulando: 'Ninguno / No estoy postulando',
    S6P01_3_InteresPostgradoUCB: 'Sí',
    S6P02_1_GradoInteresAlcanzar: 'Maestría',
    S6P02_2_AreaInteresPostgrado: 'Área Tecnológica e Ingeniería de Sistemas',
  });

  // Pre-cargar datos desde la verificación
  useEffect(() => {
    const sesion = getGraduadoSesion();
    if (sesion) {
      setGraduado(sesion);
      const nombresSplit = (sesion.nombres || '').trim();
      const apellidosSplit = (sesion.apellidos || '').trim().split(' ');
      const paterno = apellidosSplit[0] || '';
      const materno = apellidosSplit.slice(1).join(' ') || '';

      setRespuestas((prev) => ({
        ...prev,
        S1P01_Carrera: sesion.carrera || prev.S1P01_Carrera || 'Ingeniería de Sistemas',
        S1P02_ApellidoPaterno: paterno,
        S1P03_ApellidoMaterno: materno,
        S1P04_Nombres: nombresSplit,
        S1P09_CorreoElectronico: sesion.correo_privado || '',
        S1P11_CI: sesion.carnet_identidad || '',
        S2_ModalidadTitulacion: sesion.modalidad_titulacion || prev.S2_ModalidadTitulacion,
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setErrorValidacion(null);

    setRespuestas((prev) => {
      const nuevo = { ...prev, [name]: value };

      // Condicional: Cambio de carrera
      if (name === 'S3P02_CambioCarrera' && value === 'No') {
        nuevo.S3P03_MotivoCambioCarrera = '';
      }

      // Condicional: Volvería a estudiar
      if (name === 'S4P09_0_VolveriaEstudiar') {
        if (value === 'Sí') {
          nuevo.S4P09_2_MotivoNoVolveria = '';
          if (!nuevo.S4P09_1_MotivoVolveria) {
            nuevo.S4P09_1_MotivoVolveria = 'Calidad docente y prestigio académico';
          }
        } else {
          nuevo.S4P09_1_MotivoVolveria = '';
          if (!nuevo.S4P09_2_MotivoNoVolveria) {
            nuevo.S4P09_2_MotivoNoVolveria = 'Expectativas profesionales diferentes';
          }
        }
      }

      // Condicional: Actividad actual
      if (name === 'S5P01_ActividadActual') {
        if (value === 'Trabajo actualmente') {
          nuevo.S5P02_1_InteresadoEnEmpleo = 'No aplica';
          nuevo.S5P02_2_GestionBusqueda = 'No aplica';
          nuevo.S5P02_3_MotivoNoEncuentra = 'No aplica';
        } else if (value === 'Buscando trabajo') {
          nuevo.S5P01_1_PrimerEmpleo = 'No aplica';
          nuevo.S5P01_2_Antiguedad = 'No aplica';
          nuevo.S5P01_3_PropietarioSocio = 'No aplica';
          nuevo.S5P01_4_TipoInstitucion = 'No aplica';
          nuevo.S5P01_5_RelacionEstudios = 'No aplica';
          nuevo.S5P01_6_HorasSemana = 'No aplica';
          nuevo.S5P01_7_ModalidadVinculacion = 'No aplica';
          nuevo.S5P01_8_RangoSalarial = 'No aplica';
          nuevo.S5P01_9_ComoConsiguioEmpleo = 'No aplica';
          nuevo.S5P02_1_InteresadoEnEmpleo = 'Sí';
          nuevo.S5P02_2_GestionBusqueda = 'Sí';
          nuevo.S5P02_3_MotivoNoEncuentra = 'Los empleadores consideran que soy muy joven';
        } else {
          // Estudios u Otro
          nuevo.S5P01_1_PrimerEmpleo = 'No aplica';
          nuevo.S5P01_2_Antiguedad = 'No aplica';
          nuevo.S5P01_3_PropietarioSocio = 'No aplica';
          nuevo.S5P01_4_TipoInstitucion = 'No aplica';
          nuevo.S5P01_5_RelacionEstudios = 'No aplica';
          nuevo.S5P01_6_HorasSemana = 'No aplica';
          nuevo.S5P01_7_ModalidadVinculacion = 'No aplica';
          nuevo.S5P01_8_RangoSalarial = 'No aplica';
          nuevo.S5P01_9_ComoConsiguioEmpleo = 'No aplica';
          nuevo.S5P02_1_InteresadoEnEmpleo = 'No';
          nuevo.S5P02_2_GestionBusqueda = 'No';
          nuevo.S5P02_3_MotivoNoEncuentra = 'No aplica';
        }
      }

      return nuevo;
    });
  };

  const validarSeccionActual = () => {
    setErrorValidacion(null);

    // SECCIÓN 1
    if (pasoActual === 1) {
      if (!respuestas.S1P01_Carrera) return 'Pregunta 1.1: Seleccione su carrera de graduación.';
      if (!respuestas.S1P04_Nombres.trim()) return 'Pregunta 1.4: Ingrese sus nombres.';
      if (!respuestas.S1P02_ApellidoPaterno.trim()) return 'Pregunta 1.2: Ingrese su apellido paterno.';
      if (!respuestas.S1P05_Edad || isNaN(respuestas.S1P05_Edad)) return 'Pregunta 1.5: Ingrese su edad.';
      if (!respuestas.S1P08_Celular.trim()) return 'Pregunta 1.8: Ingrese su teléfono móvil / celular.';
      if (!respuestas.S1P10_CiudadNacimiento) return 'Pregunta 1.10: Seleccione su ciudad de nacimiento.';
      if (!respuestas.S1P12_CiudadResidencia.trim()) return 'Pregunta 1.12: Ingrese su ciudad de residencia.';
      if (!respuestas.S1P13_Direccion.trim()) return 'Ingrese su dirección o zona de residencia.';
    }

    // SECCIÓN 2
    if (pasoActual === 2) {
      if (!respuestas.S2P01_EstadoCivil) return 'Pregunta 2.1: Indique su estado civil.';
      if (!respuestas.S2P02_TieneHijos) return 'Pregunta 2.2: Indique si tiene hijos.';
      if (!respuestas.S2P03_NivelPadre) return 'Pregunta 2.3: Indique el nivel educativo de su padre.';
      if (!respuestas.S2P04_NivelMadre) return 'Pregunta 2.4: Indique el nivel educativo de su madre.';
      if (!respuestas.S2P05_LimitacionesPermanentes) return 'Pregunta 2.5: Indique si posee limitaciones permanentes.';
      if (!respuestas.S3P01_MotivoEleccionCarrera) return 'Pregunta 3.1: Indique el motivo de elección de carrera.';
      if (respuestas.S3P02_CambioCarrera === 'Sí' && !respuestas.S3P03_MotivoCambioCarrera.trim()) {
        return 'Pregunta 3.3: Al haber cambiado de carrera, es obligatorio indicar el motivo.';
      }
      if (!respuestas.S3P04_Financiamiento) return 'Pregunta 3.4: Indique la principal fuente de financiamiento.';
    }

    // SECCIÓN 3
    if (pasoActual === 3) {
      if (respuestas.S4P09_0_VolveriaEstudiar === 'Sí' && !respuestas.S4P09_1_MotivoVolveria.trim()) {
        return 'Pregunta 4.9.1: Indique la razón principal por la que volvería a estudiar en la U.C.B.';
      }
      if (respuestas.S4P09_0_VolveriaEstudiar === 'No' && !respuestas.S4P09_2_MotivoNoVolveria.trim()) {
        return 'Pregunta 4.9.2: Indique la razón principal por la que NO volvería a estudiar en la U.C.B.';
      }
      if (respuestas.S4P09_6_Voluntariado === 'Sí' && !respuestas.S4P09_6_TipoVoluntariado.trim()) {
        return 'Pregunta 4.9.6: Indique el tipo de voluntariado que realizó o realiza.';
      }
    }

    // SECCIÓN 4
    if (pasoActual === 4) {
      if (respuestas.S5P01_ActividadActual === 'Trabajo actualmente') {
        if (!respuestas.S5P01_8_RangoSalarial) return 'Pregunta 5.1.8: Indique su rango salarial.';
        if (!respuestas.S5P01_9_ComoConsiguioEmpleo) return 'Pregunta 5.1.9: Indique cómo consiguió su primer empleo.';
      }
    }

    return null;
  };

  const handleSiguiente = () => {
    const error = validarSeccionActual();
    if (error) {
      setErrorValidacion(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setPasoActual((prev) => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAtras = () => {
    setErrorValidacion(null);
    setPasoActual((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalizar = async () => {
    const error = validarSeccionActual();
    if (error) {
      setErrorValidacion(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setLoading(true);
      setErrorValidacion(null);

      const res = await guardarEncuesta(respuestas, 2026);
      setResultadoEmision(res.data);
      setFinalizada(true);

      if (onEncuestaFinalizada) {
        onEncuestaFinalizada(res);
      }
    } catch (err) {
      setErrorValidacion(err.message || 'Error al registrar las respuestas en el servidor.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPdf = async () => {
    try {
      setDescargandoPdf(true);
      await descargarCertificadoPdf(graduado?.carnet_identidad);
    } catch (err) {
      alert(err.message || 'Error al descargar el certificado.');
    } finally {
      setDescargandoPdf(false);
    }
  };

  if (!graduado && !sessionStorage.getItem('usei_token')) {
    return (
      <div className="encuesta-page-wrapper">
        <div className="encuesta-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ color: '#0e3d7a', marginBottom: '1rem' }}>Sesión Requerida</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Para responder la encuesta a tiempo de graduación, primero debes validar tu identidad
            con tu Carnet y correo privado.
          </p>
          <button type="button" className="btn-nav-next" onClick={onVolverAInicio}>
            Ir a la Pantalla de Verificación
          </button>
        </div>
      </div>
    );
  }

  // PANTALLA DE ÉXITO Y VINCULACIÓN ALUMNI (FIGURA 35 DEL DOCUMENTO - HU-04)
  if (finalizada) {
    const numCertFormateado = resultadoEmision?.nro_certificado
      ? String(resultadoEmision.nro_certificado).padStart(5, '0')
      : '00001';
    const carreraGraduado = resultadoEmision?.carrera || respuestas.S1P01_Carrera || 'su carrera';
    const correoPrivadoDestino =
      resultadoEmision?.correo_destino || respuestas.S1P09_CorreoElectronico || graduado?.correo_privado;

    return (
      <div className="encuesta-page-wrapper">
        <div className="encuesta-card encuesta-success-screen">
          <div className="success-badge-icon">✓</div>
          <h2 className="success-screen-title">¡Encuesta Finalizada!</h2>
          <p className="success-screen-desc">Tus respuestas han sido registradas con éxito.</p>

          <div className="success-panels-container">
            {/* Panel: Certificado Enviado */}
            <div className="success-panel-card panel-email">
              <div className="panel-header-title">
                <span>✉️</span>
                <span>Certificado Enviado</span>
              </div>
              <p className="panel-text">
                Hemos enviado tu Certificado Oficial (N° USEI-2026-{numCertFormateado}) a tu correo electrónico privado: <strong>{correoPrivadoDestino}</strong>. Adjunto encontrarás información importante para habilitar la firma de tu acta de graduación.
              </p>
              <button
                type="button"
                className="btn-download-pdf-copy"
                onClick={handleDescargarPdf}
                disabled={descargandoPdf}
              >
                {descargandoPdf ? 'Generando descarga...' : '📥 Descargar copia de Certificado (PDF)'}
              </button>
            </div>

            {/* Panel: Beneficio Alumni */}
            <div className="success-panel-card panel-benefit">
              <div className="panel-header-title" style={{ color: '#92400e' }}>
                <span>🎓</span>
                <span>Beneficio Alumni UCB</span>
              </div>
              <p className="panel-text" style={{ color: '#78350f' }}>
                Recuerda que tienes un <strong>10% de descuento</strong> en todos los programas de Postgrado de la Universidad Católica Boliviana.
              </p>
            </div>
          </div>

          {/* Sección de Vinculación a WhatsApp por Carrera */}
          <div className="whatsapp-community-section">
            <h3 className="whatsapp-title">¡Únete a tu comunidad!</h3>
            <p className="whatsapp-desc">
              Mantente al tanto de ofertas laborales, talleres y networking exclusivo para graduados de <strong>{carreraGraduado}</strong>.
            </p>

            <a
              href={resultadoEmision?.url_whatsapp || 'https://chat.whatsapp.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp-join"
            >
              <span className="btn-whatsapp-icon">💬</span>
              <span>Unirme al grupo de WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const porcentajeProgreso = pasoActual * 25;

  return (
    <div className="encuesta-page-wrapper">
      <div className="encuesta-card">
        {/* Cabecera */}
        <div className="encuesta-header">
          <h2 className="encuesta-section-title">
            {pasoActual === 1 && 'Sección 1: Identificación y Datos Generales'}
            {pasoActual === 2 && 'Sección 2: Entorno Familiar y Trayectoria Académica'}
            {pasoActual === 3 && 'Sección 3: Satisfacción Institucional y Competencias U.C.B.'}
            {pasoActual === 4 && 'Sección 4: Situación Laboral y Perspectivas de Postgrado'}
          </h2>
          <p className="encuesta-section-subtitle">
            Cuestionario Oficial Completo (Anexo 3) · USEI Sede La Paz
          </p>
        </div>

        {/* Pestañas de las 4 Secciones */}
        <div className="encuesta-steps-nav">
          <div className={`step-tab ${pasoActual === 1 ? 'active' : ''} ${pasoActual > 1 ? 'completed' : ''}`}>
            1. Generales
          </div>
          <div className={`step-tab ${pasoActual === 2 ? 'active' : ''} ${pasoActual > 2 ? 'completed' : ''}`}>
            2. Familiar / Académico
          </div>
          <div className={`step-tab ${pasoActual === 3 ? 'active' : ''} ${pasoActual > 3 ? 'completed' : ''}`}>
            3. Satisfacción UCB
          </div>
          <div className={`step-tab ${pasoActual === 4 ? 'active' : ''}`}>
            4. Laboral / Postgrado
          </div>
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${porcentajeProgreso}%` }}></div>
        </div>

        <div className="encuesta-body">
          {errorValidacion && (
            <div className="encuesta-alert-error">
              <span>⚠️</span>
              <div>{errorValidacion}</div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECCIÓN 1: DATOS GENERALES (PREGUNTAS 1.1 A 1.12 + INGRESO)               */}
          {/* ========================================================================= */}
          {pasoActual === 1 && (
            <div>
              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label" htmlFor="S1_AnioIngreso">
                    Año que ingresó a la U.C.B. <span className="required">*</span>
                  </label>
                  <select
                    id="S1_AnioIngreso"
                    name="S1_AnioIngreso"
                    className="form-control-select"
                    value={respuestas.S1_AnioIngreso}
                    onChange={handleInputChange}
                  >
                    {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div className="question-group">
                  <label className="question-label" htmlFor="S1P01_Carrera">
                    1.1. Carrera de la que se graduó <span className="required">*</span>
                  </label>
                  <select
                    id="S1P01_Carrera"
                    name="S1P01_Carrera"
                    className="form-control-select"
                    value={respuestas.S1P01_Carrera}
                    onChange={handleInputChange}
                  >
                    <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
                    <option value="Administración de Empresas">Administración de Empresas</option>
                    <option value="Ingeniería Industrial">Ingeniería Industrial</option>
                    <option value="Derecho">Derecho</option>
                    <option value="Ingeniería Mecatrónica">Ingeniería Mecatrónica</option>
                    <option value="Psicología">Psicología</option>
                    <option value="Comunicación Social">Comunicación Social</option>
                    <option value="Diseño Gráfico">Diseño Gráfico</option>
                    <option value="Ingeniería Comercial">Ingeniería Comercial</option>
                    <option value="Ingeniería Civil">Ingeniería Civil</option>
                    <option value="Ingeniería Ambiental">Ingeniería Ambiental</option>
                    <option value="Economía">Economía</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label" htmlFor="S1P02_ApellidoPaterno">
                    1.2. Apellido paterno <span className="required">*</span>
                  </label>
                  <input
                    id="S1P02_ApellidoPaterno"
                    name="S1P02_ApellidoPaterno"
                    type="text"
                    className="form-control-input"
                    value={respuestas.S1P02_ApellidoPaterno}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="question-group">
                  <label className="question-label" htmlFor="S1P03_ApellidoMaterno">
                    1.3. Apellido materno
                  </label>
                  <input
                    id="S1P03_ApellidoMaterno"
                    name="S1P03_ApellidoMaterno"
                    type="text"
                    className="form-control-input"
                    value={respuestas.S1P03_ApellidoMaterno}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label" htmlFor="S1P04_Nombres">
                    1.4. Nombres <span className="required">*</span>
                  </label>
                  <input
                    id="S1P04_Nombres"
                    name="S1P04_Nombres"
                    type="text"
                    className="form-control-input"
                    value={respuestas.S1P04_Nombres}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="question-group">
                  <label className="question-label" htmlFor="S1P05_Edad">
                    1.5. Edad <span className="required">*</span>
                  </label>
                  <input
                    id="S1P05_Edad"
                    name="S1P05_Edad"
                    type="number"
                    min="18"
                    max="99"
                    className="form-control-input"
                    value={respuestas.S1P05_Edad}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label">
                    1.6. Sexo <span className="required">*</span>
                  </label>
                  <div className="radio-group-inline">
                    {['Femenino', 'Masculino', 'Otro'].map((sx) => (
                      <label key={sx} className="radio-option">
                        <input
                          type="radio"
                          name="S1P06_Sexo"
                          value={sx}
                          checked={respuestas.S1P06_Sexo === sx}
                          onChange={handleInputChange}
                        />
                        {sx}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="question-group">
                  <label className="question-label" htmlFor="S1P07_TelefonoFijo">
                    1.7. Teléfono fijo (Opcional)
                  </label>
                  <input
                    id="S1P07_TelefonoFijo"
                    name="S1P07_TelefonoFijo"
                    type="text"
                    className="form-control-input"
                    placeholder="Ej. 2240000"
                    value={respuestas.S1P07_TelefonoFijo}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label" htmlFor="S1P08_Celular">
                    1.8. Teléfono móvil / Celular <span className="required">*</span>
                  </label>
                  <input
                    id="S1P08_Celular"
                    name="S1P08_Celular"
                    type="text"
                    className="form-control-input"
                    placeholder="Ej. 71234567"
                    value={respuestas.S1P08_Celular}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="question-group">
                  <label className="question-label" htmlFor="S1P11_CI">
                    1.11. Cédula de identidad (Carnet) <span className="required">*</span>
                  </label>
                  <input
                    id="S1P11_CI"
                    name="S1P11_CI"
                    type="text"
                    className="form-control-input"
                    readOnly
                    style={{ backgroundColor: '#f8fafc', color: '#64748b' }}
                    value={respuestas.S1P11_CI}
                  />
                </div>
              </div>

              <div className="question-group">
                <label className="question-label" htmlFor="S1P09_CorreoElectronico">
                  1.9. Correo electrónico personal <span className="required">*</span>
                </label>
                <input
                  id="S1P09_CorreoElectronico"
                  name="S1P09_CorreoElectronico"
                  type="email"
                  className="form-control-input"
                  readOnly
                  style={{ backgroundColor: '#f8fafc', color: '#64748b' }}
                  value={respuestas.S1P09_CorreoElectronico}
                />
                <span style={{ fontSize: '0.74rem', color: '#b45309', display: 'block', marginTop: '0.3rem', lineHeight: '1.4' }}>
                  ⚠️ ATENCIÓN: El correo académico de la U.C.B. tiene una vigencia de 6 meses desde que te gradúas. Utilizamos tu correo personal para el envío oficial del certificado.
                </span>
              </div>

              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label" htmlFor="S1P10_CiudadNacimiento">
                    1.10. Ciudad de nacimiento <span className="required">*</span>
                  </label>
                  <select
                    id="S1P10_CiudadNacimiento"
                    name="S1P10_CiudadNacimiento"
                    className="form-control-select"
                    value={respuestas.S1P10_CiudadNacimiento}
                    onChange={handleInputChange}
                  >
                    {['La Paz', 'El Alto', 'Cochabamba', 'Santa Cruz', 'Oruro', 'Potosí', 'Chuquisaca / Sucre', 'Tarija', 'Beni', 'Pando', 'Exterior'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="question-group">
                  <label className="question-label" htmlFor="S1P12_CiudadResidencia">
                    1.12. Ciudad de residencia <span className="required">*</span>
                  </label>
                  <input
                    id="S1P12_CiudadResidencia"
                    name="S1P12_CiudadResidencia"
                    type="text"
                    className="form-control-input"
                    value={respuestas.S1P12_CiudadResidencia}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="question-group">
                <label className="question-label" htmlFor="S1P13_Direccion">
                  Dirección / Zona de residencia detallada <span className="required">*</span>
                </label>
                <input
                  id="S1P13_Direccion"
                  name="S1P13_Direccion"
                  type="text"
                  className="form-control-input"
                  placeholder="Ej. Sopocachi, Av. Arce N° 123"
                  value={respuestas.S1P13_Direccion}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECCIÓN 2: INFORMACIÓN FAMILIAR Y ACADÉMICA (PREGUNTAS 2.1 A 3.4)         */}
          {/* ========================================================================= */}
          {pasoActual === 2 && (
            <div>
              <div className="section-subgroup">
                <h3 className="section-subgroup-title">2. Entorno Familiar y Personal</h3>
              </div>

              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label" htmlFor="S2P01_EstadoCivil">
                    2.1. Indique su Estado Civil actual <span className="required">*</span>
                  </label>
                  <select
                    id="S2P01_EstadoCivil"
                    name="S2P01_EstadoCivil"
                    className="form-control-select"
                    value={respuestas.S2P01_EstadoCivil}
                    onChange={handleInputChange}
                  >
                    {['Soltero/a', 'Casado/a', 'Conviviente / Unión Libre', 'Divorciado/a', 'Viudo/a'].map((ec) => (
                      <option key={ec} value={ec}>{ec}</option>
                    ))}
                  </select>
                </div>

                <div className="question-group">
                  <label className="question-label">
                    2.2. ¿Tiene hijos? <span className="required">*</span>
                  </label>
                  <div className="radio-group-inline">
                    {['No', 'Sí'].map((h) => (
                      <label key={h} className="radio-option">
                        <input
                          type="radio"
                          name="S2P02_TieneHijos"
                          value={h}
                          checked={respuestas.S2P02_TieneHijos === h}
                          onChange={handleInputChange}
                        />
                        {h}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label" htmlFor="S2P03_NivelPadre">
                    2.3. Nivel de educación más alto alcanzado por su padre <span className="required">*</span>
                  </label>
                  <select
                    id="S2P03_NivelPadre"
                    name="S2P03_NivelPadre"
                    className="form-control-select"
                    value={respuestas.S2P03_NivelPadre}
                    onChange={handleInputChange}
                  >
                    {['Educación Universitaria Completa', 'Educación de Postgrado', 'Educación Técnica / Tecnológica', 'Educación Universitaria Incompleta', 'Secundaria', 'Primaria', 'No sabe'].map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>

                <div className="question-group">
                  <label className="question-label" htmlFor="S2P04_NivelMadre">
                    2.4. Nivel de educación más alto alcanzado por su madre <span className="required">*</span>
                  </label>
                  <select
                    id="S2P04_NivelMadre"
                    name="S2P04_NivelMadre"
                    className="form-control-select"
                    value={respuestas.S2P04_NivelMadre}
                    onChange={handleInputChange}
                  >
                    {['Educación Universitaria Completa', 'Educación de Postgrado', 'Educación Técnica / Tecnológica', 'Educación Universitaria Incompleta', 'Secundaria', 'Primaria', 'No sabe'].map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="question-group">
                <label className="question-label" htmlFor="S2P05_LimitacionesPermanentes">
                  2.5. Indique si tiene alguna de las siguientes limitaciones permanentes <span className="required">*</span>
                </label>
                <select
                  id="S2P05_LimitacionesPermanentes"
                  name="S2P05_LimitacionesPermanentes"
                  className="form-control-select"
                  value={respuestas.S2P05_LimitacionesPermanentes}
                  onChange={handleInputChange}
                >
                  {['Ninguna', 'Visual (aun usando lentes)', 'Auditiva (aun usando audífonos)', 'Motriz / Extremidades', 'Comunicación / Lenguaje', 'Otra'].map((lim) => (
                    <option key={lim} value={lim}>{lim}</option>
                  ))}
                </select>
              </div>

              <div className="section-subgroup">
                <h3 className="section-subgroup-title">3. Trayectoria de Carrera y Financiamiento</h3>
              </div>

              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label" htmlFor="S2_ModalidadTitulacion">
                    Modalidad de titulación cursada <span className="required">*</span>
                  </label>
                  <select
                    id="S2_ModalidadTitulacion"
                    name="S2_ModalidadTitulacion"
                    className="form-control-select"
                    value={respuestas.S2_ModalidadTitulacion}
                    onChange={handleInputChange}
                  >
                    <option value="Proyecto de Grado">Proyecto de Grado</option>
                    <option value="Tesis">Tesis</option>
                    <option value="Trabajo Dirigido">Trabajo Dirigido</option>
                    <option value="Examen de Grado">Examen de Grado</option>
                    <option value="Graduación por Excelencia">Graduación por Excelencia</option>
                  </select>
                </div>

                <div className="question-group">
                  <label className="question-label" htmlFor="S3P01_MotivoEleccionCarrera">
                    3.1. Principal motivo que influyó en la elección de su carrera <span className="required">*</span>
                  </label>
                  <select
                    id="S3P01_MotivoEleccionCarrera"
                    name="S3P01_MotivoEleccionCarrera"
                    className="form-control-select"
                    value={respuestas.S3P01_MotivoEleccionCarrera}
                    onChange={handleInputChange}
                  >
                    <option value="Vocación o habilidades">Vocación o habilidades</option>
                    <option value="Familia">Sugerencia familiar</option>
                    <option value="Fuente laboral de la carrera">Amplia fuente laboral / demanda del mercado</option>
                    <option value="Test vocacional">Test o programa de orientación vocacional</option>
                    <option value="Ingresos económicos que ofrece">Nivel salarial o ingresos futuros proyectados</option>
                    <option value="Amigos">Influencia de amistades</option>
                    <option value="Otro">Otro motivo</option>
                  </select>
                </div>
              </div>

              {/* Condicional 3.2 y 3.3 */}
              <div className="question-group">
                <label className="question-label">
                  3.2. ¿Cambió usted de carrera durante sus estudios? <span className="required">*</span>
                </label>
                <div className="radio-group-inline">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="S3P02_CambioCarrera"
                      value="Sí"
                      checked={respuestas.S3P02_CambioCarrera === 'Sí'}
                      onChange={handleInputChange}
                    />
                    Sí
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="S3P02_CambioCarrera"
                      value="No"
                      checked={respuestas.S3P02_CambioCarrera === 'No'}
                      onChange={handleInputChange}
                    />
                    No
                  </label>
                </div>

                {respuestas.S3P02_CambioCarrera === 'Sí' && (
                  <div className="conditional-box">
                    <span className="conditional-badge">Pregunta condicional activa (3.3):</span>
                    <label className="question-label" htmlFor="S3P03_MotivoCambioCarrera">
                      3.3. Indique el motivo por el que cambió de carrera <span className="required">*</span>
                    </label>
                    <textarea
                      id="S3P03_MotivoCambioCarrera"
                      name="S3P03_MotivoCambioCarrera"
                      className="form-control-textarea"
                      rows="3"
                      placeholder="Ej. Falta de afinidad con la carrera anterior / Descubrí vocación por mi carrera actual..."
                      value={respuestas.S3P03_MotivoCambioCarrera}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                )}
              </div>

              <div className="question-group">
                <label className="question-label" htmlFor="S3P04_Financiamiento">
                  3.4. ¿Cuál fue la principal fuente de recursos para financiar sus estudios? <span className="required">*</span>
                </label>
                <select
                  id="S3P04_Financiamiento"
                  name="S3P04_Financiamiento"
                  className="form-control-select"
                  value={respuestas.S3P04_Financiamiento}
                  onChange={handleInputChange}
                >
                  <option value="Padres">Padres</option>
                  <option value="Recursos propios">Recursos propios / Trabajo personal</option>
                  <option value="Becas">Becas institucionales</option>
                  <option value="Créditos educativos">Créditos educativos</option>
                  <option value="Otros familiares">Otros familiares</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECCIÓN 3: SATISFACCIÓN Y COMPETENCIAS (PREGUNTAS 4.1 A 4.9.6)             */}
          {/* ========================================================================= */}
          {pasoActual === 3 && (
            <div>
              <div className="section-subgroup">
                <h3 className="section-subgroup-title">
                  4.1. Grado de Satisfacción con Competencias Desarrolladas en la U.C.B.
                </h3>
              </div>

              <div className="matrix-container">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Competencia</th>
                      <th>Malo</th>
                      <th>Regular</th>
                      <th>Bueno</th>
                      <th>Excelente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'S4P01_Comp_Autonomo', label: '1. Aprender de manera autónoma' },
                      { key: 'S4P01_Comp_Diversidad', label: '2. Respetar la diversidad' },
                      { key: 'S4P01_Comp_Analitica', label: '3. Razonar de manera analítica y lógica' },
                      { key: 'S4P01_Comp_Critica', label: '4. Pensar de manera crítica' },
                      { key: 'S4P01_Comp_Equipo', label: '5. Trabajar colaborativamente en equipo' },
                      { key: 'S4P01_Comp_Innovar', label: '6. Innovar y crear ideas' },
                      { key: 'S4P01_Comp_Adaptacion', label: '7. Desarrollar capacidad de adaptación al cambio' },
                      { key: 'S4P01_Comp_DerechosHumanos', label: '8. Conciencia de derechos humanos y medio ambiente' },
                    ].map((comp) => (
                      <tr key={comp.key}>
                        <td>{comp.label}</td>
                        {['Malo', 'Regular', 'Bueno', 'Excelente'].map((val) => (
                          <td key={val}>
                            <input
                              type="radio"
                              name={comp.key}
                              value={val}
                              checked={respuestas[comp.key] === val}
                              onChange={handleInputChange}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="question-group">
                <label className="question-label">
                  4.2. ¿El colegio/escuela en que concluyó el bachillerato enseñaba otro idioma además del español? <span className="required">*</span>
                </label>
                <div className="radio-group-inline">
                  {['Sí', 'No'].map((op) => (
                    <label key={op} className="radio-option">
                      <input
                        type="radio"
                        name="S4P02_BachilleratoIdioma"
                        value={op}
                        checked={respuestas.S4P02_BachilleratoIdioma === op}
                        onChange={handleInputChange}
                      />
                      {op}
                    </label>
                  ))}
                </div>
              </div>

              {/* 4.3 Matriz Manejo del Inglés */}
              <div className="section-subgroup">
                <h3 className="section-subgroup-title">
                  4.3. Nivel de Competencia en el Manejo del Idioma Inglés
                </h3>
              </div>
              <div className="matrix-container">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Habilidad</th>
                      <th>Básico</th>
                      <th>Regular</th>
                      <th>Bueno</th>
                      <th>Excelente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'S4P03_Ingles_Lee', label: 'Lee inglés' },
                      { key: 'S4P03_Ingles_Escucha', label: 'Escucha y comprende inglés' },
                      { key: 'S4P03_Ingles_Escribe', label: 'Escribe inglés' },
                      { key: 'S4P03_Ingles_Habla', label: 'Habla inglés' },
                    ].map((h) => (
                      <tr key={h.key}>
                        <td>{h.label}</td>
                        {['Básico', 'Regular', 'Bueno', 'Excelente'].map((val) => (
                          <td key={val}>
                            <input
                              type="radio"
                              name={h.key}
                              value={val}
                              checked={respuestas[h.key] === val}
                              onChange={handleInputChange}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4.4 Matriz Manejo de Herramientas Informáticas */}
              <div className="section-subgroup">
                <h3 className="section-subgroup-title">
                  4.4. Nivel de Competencia en Herramientas Informáticas
                </h3>
              </div>
              <div className="matrix-container">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Herramienta</th>
                      <th>Básico</th>
                      <th>Regular</th>
                      <th>Bueno</th>
                      <th>Excelente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'S4P04_Info_Correo', label: 'Correo electrónico y comunicación institucional' },
                      { key: 'S4P04_Info_Web', label: 'Navegación y publicación en web' },
                      { key: 'S4P04_Info_Texto', label: 'Procesadores de texto (Word, Docs)' },
                      { key: 'S4P04_Info_Calculo', label: 'Hojas de cálculo (Excel, Sheets)' },
                    ].map((tool) => (
                      <tr key={tool.key}>
                        <td>{tool.label}</td>
                        {['Básico', 'Regular', 'Bueno', 'Excelente'].map((val) => (
                          <td key={val}>
                            <input
                              type="radio"
                              name={tool.key}
                              value={val}
                              checked={respuestas[tool.key] === val}
                              onChange={handleInputChange}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4.5 Plantel Docente */}
              <div className="section-subgroup">
                <h3 className="section-subgroup-title">
                  4.5. Grado de Acuerdo sobre el Plantel Docente U.C.B.
                </h3>
              </div>
              <div className="matrix-container">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Afirmación</th>
                      <th>En Desacuerdo</th>
                      <th>Neutral</th>
                      <th>De Acuerdo</th>
                      <th>Totalmente de Acuerdo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'S4P05_Docente_Dominio', label: 'Muestran conocimiento y dominio de su materia' },
                      { key: 'S4P05_Docente_Estrategias', label: 'Aplican estrategias adecuadas para enseñar' },
                      { key: 'S4P05_Docente_Evaluacion', label: 'Aplican sistemas de evaluación justos y equitativos' },
                    ].map((d) => (
                      <tr key={d.key}>
                        <td>{d.label}</td>
                        {['En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'].map((val) => (
                          <td key={val}>
                            <input
                              type="radio"
                              name={d.key}
                              value={val}
                              checked={respuestas[d.key] === val}
                              onChange={handleInputChange}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4.6 Plantel Administrativo */}
              <div className="section-subgroup">
                <h3 className="section-subgroup-title">
                  4.6. Grado de Acuerdo sobre el Plantel Administrativo
                </h3>
              </div>
              <div className="matrix-container">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Afirmación</th>
                      <th>En Desacuerdo</th>
                      <th>Neutral</th>
                      <th>De Acuerdo</th>
                      <th>Totalmente de Acuerdo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'S4P06_Admin_Calificado', label: 'Es calificado para el trabajo que desempeña' },
                      { key: 'S4P06_Admin_Cordial', label: 'Es cordial y amable en la atención' },
                      { key: 'S4P06_Admin_Oportuno', label: 'Es eficiente y oportuno en los requerimientos' },
                    ].map((a) => (
                      <tr key={a.key}>
                        <td>{a.label}</td>
                        {['En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'].map((val) => (
                          <td key={val}>
                            <input
                              type="radio"
                              name={a.key}
                              value={val}
                              checked={respuestas[a.key] === val}
                              onChange={handleInputChange}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4.7 Bienestar Estudiantil */}
              <div className="section-subgroup">
                <h3 className="section-subgroup-title">
                  4.7. Servicios de Bienestar Estudiantil U.C.B.
                </h3>
              </div>
              <div className="matrix-container">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>En Desacuerdo</th>
                      <th>Neutral</th>
                      <th>De Acuerdo</th>
                      <th>Totalmente de Acuerdo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'S4P07_Bienestar_Pastoral', label: 'Eventos y actividades pastorales formativas' },
                      { key: 'S4P07_Bienestar_Cultural', label: 'Eventos culturales y artísticos inclusivos' },
                      { key: 'S4P07_Bienestar_Becas', label: 'Oferta de becas amplia y equitativa' },
                      { key: 'S4P07_Bienestar_Salud', label: 'El seguro de salud es eficiente en su atención' },
                    ].map((b) => (
                      <tr key={b.key}>
                        <td>{b.label}</td>
                        {['En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'].map((val) => (
                          <td key={val}>
                            <input
                              type="radio"
                              name={b.key}
                              value={val}
                              checked={respuestas[b.key] === val}
                              onChange={handleInputChange}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4.8 Infraestructura */}
              <div className="section-subgroup">
                <h3 className="section-subgroup-title">
                  4.8. Calificación de Aspectos de Infraestructura
                </h3>
              </div>
              <div className="matrix-container">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Ambiente / Servicio</th>
                      <th>Malo</th>
                      <th>Regular</th>
                      <th>Bueno</th>
                      <th>Excelente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'S4P08_Infra_Seguridad', label: 'Seguridad dentro del campus universitario' },
                      { key: 'S4P08_Infra_Espacios', label: 'Espacios de esparcimiento y recreación' },
                      { key: 'S4P08_Infra_Laboratorios', label: 'Laboratorios y ambientes de práctica' },
                      { key: 'S4P08_Infra_Banios', label: 'Baños y áreas de servicio' },
                      { key: 'S4P08_Infra_Aulas', label: 'Estado de aulas (sillas, luz, ventilación)' },
                      { key: 'S4P08_Infra_Equipos', label: 'Equipos didácticos (sonido, proyectores, PCs)' },
                      { key: 'S4P08_Infra_Wifi', label: 'Servicio Wi-Fi en cuanto a velocidad y estabilidad' },
                    ].map((inf) => (
                      <tr key={inf.key}>
                        <td>{inf.label}</td>
                        {['Malo', 'Regular', 'Bueno', 'Excelente'].map((val) => (
                          <td key={val}>
                            <input
                              type="radio"
                              name={inf.key}
                              value={val}
                              checked={respuestas[inf.key] === val}
                              onChange={handleInputChange}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4.9.0 a 4.9.2 Volvería a estudiar */}
              <div className="question-group">
                <label className="question-label">
                  4.9.0. ¿Volvería a estudiar en la U.C.B.? <span className="required">*</span>
                </label>
                <div className="radio-group-inline">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="S4P09_0_VolveriaEstudiar"
                      value="Sí"
                      checked={respuestas.S4P09_0_VolveriaEstudiar === 'Sí'}
                      onChange={handleInputChange}
                    />
                    Sí
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="S4P09_0_VolveriaEstudiar"
                      value="No"
                      checked={respuestas.S4P09_0_VolveriaEstudiar === 'No'}
                      onChange={handleInputChange}
                    />
                    No
                  </label>
                </div>
              </div>

              {respuestas.S4P09_0_VolveriaEstudiar === 'Sí' ? (
                <div className="question-group">
                  <label className="question-label" htmlFor="S4P09_1_MotivoVolveria">
                    4.9.1. Indique la razón principal por la que volvería a estudiar en la U.C.B. <span className="required">*</span>
                  </label>
                  <input
                    id="S4P09_1_MotivoVolveria"
                    name="S4P09_1_MotivoVolveria"
                    type="text"
                    className="form-control-input"
                    value={respuestas.S4P09_1_MotivoVolveria}
                    onChange={handleInputChange}
                  />
                </div>
              ) : (
                <div className="question-group">
                  <label className="question-label" htmlFor="S4P09_2_MotivoNoVolveria">
                    4.9.2. Indique la razón principal por la que NO volvería a estudiar en la U.C.B. <span className="required">*</span>
                  </label>
                  <input
                    id="S4P09_2_MotivoNoVolveria"
                    name="S4P09_2_MotivoNoVolveria"
                    type="text"
                    className="form-control-input"
                    value={respuestas.S4P09_2_MotivoNoVolveria}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              {/* 4.9.3 a 4.9.6 */}
              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label">
                    4.9.3. ¿Realizó algún viaje de Intercambio al exterior de país? <span className="required">*</span>
                  </label>
                  <div className="radio-group-inline">
                    {['No', 'Sí'].map((op) => (
                      <label key={op} className="radio-option">
                        <input
                          type="radio"
                          name="S4P09_3_ViajeIntercambio"
                          value={op}
                          checked={respuestas.S4P09_3_ViajeIntercambio === op}
                          onChange={handleInputChange}
                        />
                        {op}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="question-group">
                  <label className="question-label">
                    4.9.4. ¿Participó en alguna organización estudiantil? <span className="required">*</span>
                  </label>
                  <div className="radio-group-inline">
                    {['No', 'Sí'].map((op) => (
                      <label key={op} className="radio-option">
                        <input
                          type="radio"
                          name="S4P09_4_OrgEstudiantil"
                          value={op}
                          checked={respuestas.S4P09_4_OrgEstudiantil === op}
                          onChange={handleInputChange}
                        />
                        {op}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4.9.5 y 4.9.5.1 */}
              <div className="question-group">
                <label className="question-label">
                  4.9.5. ¿Participó en actividades extracurriculares (danza, tuna, teatro, deportes)? <span className="required">*</span>
                </label>
                <div className="radio-group-inline">
                  {['No', 'Sí'].map((op) => (
                    <label key={op} className="radio-option">
                      <input
                        type="radio"
                        name="S4P09_5_Extracurriculares"
                        value={op}
                        checked={respuestas.S4P09_5_Extracurriculares === op}
                        onChange={handleInputChange}
                      />
                      {op}
                    </label>
                  ))}
                </div>

                {respuestas.S4P09_5_Extracurriculares === 'Sí' && (
                  <div className="conditional-box">
                    <span className="conditional-badge">4.9.5.1 Valoración de Actividades Extracurriculares:</span>
                    <label className="question-label" htmlFor="S4P09_5_1_ValoracionExtracurricular">
                      ¿Cómo califica su experiencia en dichas actividades? <span className="required">*</span>
                    </label>
                    <select
                      id="S4P09_5_1_ValoracionExtracurricular"
                      name="S4P09_5_1_ValoracionExtracurricular"
                      className="form-control-select"
                      value={respuestas.S4P09_5_1_ValoracionExtracurricular}
                      onChange={handleInputChange}
                    >
                      <option value="Excelente">Excelente</option>
                      <option value="Bueno">Bueno</option>
                      <option value="Regular">Regular</option>
                      <option value="Malo">Malo</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 4.9.6 */}
              <div className="question-group">
                <label className="question-label">
                  4.9.6. ¿Participó en algún voluntariado institucional? <span className="required">*</span>
                </label>
                <div className="radio-group-inline">
                  {['No', 'Sí'].map((op) => (
                    <label key={op} className="radio-option">
                      <input
                        type="radio"
                        name="S4P09_6_Voluntariado"
                        value={op}
                        checked={respuestas.S4P09_6_Voluntariado === op}
                        onChange={handleInputChange}
                      />
                      {op}
                    </label>
                  ))}
                </div>

                {respuestas.S4P09_6_Voluntariado === 'Sí' && (
                  <div className="conditional-box">
                    <label className="question-label" htmlFor="S4P09_6_TipoVoluntariado">
                      Señale el tipo de voluntariado que realizó o realiza <span className="required">*</span>
                    </label>
                    <input
                      id="S4P09_6_TipoVoluntariado"
                      name="S4P09_6_TipoVoluntariado"
                      type="text"
                      className="form-control-input"
                      placeholder="Ej. Pastoral Universitaria, Apoyo social a comunidades, etc."
                      value={respuestas.S4P09_6_TipoVoluntariado}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECCIÓN 4: ACTIVIDAD LABORAL Y POSTGRADO (PREGUNTAS 5.1 A 6.2.2)          */}
          {/* ========================================================================= */}
          {pasoActual === 4 && (
            <div>
              <div className="section-subgroup">
                <h3 className="section-subgroup-title">5. Actividad Laboral Actual</h3>
              </div>

              <div className="question-group">
                <label className="question-label">
                  5.1. ¿Cuál es la actividad en la que actualmente ocupa mayor parte de su tiempo? <span className="required">*</span>
                </label>
                <div className="radio-group">
                  {[
                    'Trabajo actualmente',
                    'Buscando trabajo',
                    'Estudios',
                    'Otro',
                  ].map((act) => (
                    <label key={act} className="radio-option">
                      <input
                        type="radio"
                        name="S5P01_ActividadActual"
                        value={act}
                        checked={respuestas.S5P01_ActividadActual === act}
                        onChange={handleInputChange}
                      />
                      {act}
                    </label>
                  ))}
                </div>
              </div>

              {/* RAMA 5.1: SI TRABAJA ACTUALMENTE */}
              {respuestas.S5P01_ActividadActual === 'Trabajo actualmente' && (
                <div className="conditional-box" style={{ marginBottom: '1.5rem' }}>
                  <span className="conditional-badge">Módulo de Inserción Laboral Activo:</span>

                  <div className="form-row-2">
                    <div className="question-group">
                      <label className="question-label">
                        5.1.1. ¿Este es su primer empleo? <span className="required">*</span>
                      </label>
                      <div className="radio-group-inline">
                        {['Sí', 'No'].map((op) => (
                          <label key={op} className="radio-option">
                            <input
                              type="radio"
                              name="S5P01_1_PrimerEmpleo"
                              value={op}
                              checked={respuestas.S5P01_1_PrimerEmpleo === op}
                              onChange={handleInputChange}
                            />
                            {op}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="question-group">
                      <label className="question-label" htmlFor="S5P01_2_Antiguedad">
                        5.1.2. Antigüedad en su empleo actual <span className="required">*</span>
                      </label>
                      <select
                        id="S5P01_2_Antiguedad"
                        name="S5P01_2_Antiguedad"
                        className="form-control-select"
                        value={respuestas.S5P01_2_Antiguedad}
                        onChange={handleInputChange}
                      >
                        <option value="Menos de tres meses">Menos de tres meses</option>
                        <option value="Entre tres meses y seis meses">Entre tres meses y seis meses</option>
                        <option value="Entre seis meses y un año">Entre seis meses y un año</option>
                        <option value="Más de un año">Más de un año</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="question-group">
                      <label className="question-label">
                        5.1.3. ¿Es usted propietario o socio del lugar donde trabaja? <span className="required">*</span>
                      </label>
                      <div className="radio-group-inline">
                        {['No', 'Sí'].map((op) => (
                          <label key={op} className="radio-option">
                            <input
                              type="radio"
                              name="S5P01_3_PropietarioSocio"
                              value={op}
                              checked={respuestas.S5P01_3_PropietarioSocio === op}
                              onChange={handleInputChange}
                            />
                            {op}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="question-group">
                      <label className="question-label" htmlFor="S5P01_4_TipoInstitucion">
                        5.1.4. Tipo de institución en la que trabaja <span className="required">*</span>
                      </label>
                      <select
                        id="S5P01_4_TipoInstitucion"
                        name="S5P01_4_TipoInstitucion"
                        className="form-control-select"
                        value={respuestas.S5P01_4_TipoInstitucion}
                        onChange={handleInputChange}
                      >
                        <option value="Empresa Privada">Empresa Privada</option>
                        <option value="Institución Pública / Estatal">Institución Pública / Estatal</option>
                        <option value="ONG / Fundación">ONG / Fundación</option>
                        <option value="Emprendimiento Propio / Independiente">Emprendimiento Propio / Independiente</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="question-group">
                      <label className="question-label" htmlFor="S5P01_5_RelacionEstudios">
                        5.1.5. Relación de su trabajo con los estudios <span className="required">*</span>
                      </label>
                      <select
                        id="S5P01_5_RelacionEstudios"
                        name="S5P01_5_RelacionEstudios"
                        className="form-control-select"
                        value={respuestas.S5P01_5_RelacionEstudios}
                        onChange={handleInputChange}
                      >
                        <option value="Muy relacionada">Muy relacionada</option>
                        <option value="Relacionada">Relacionada</option>
                        <option value="Poco relacionada">Poco relacionada</option>
                        <option value="Nada relacionada">Nada relacionada</option>
                      </select>
                    </div>

                    <div className="question-group">
                      <label className="question-label" htmlFor="S5P01_6_HorasSemana">
                        5.1.6. Horas a la semana dedicadas a su empleo <span className="required">*</span>
                      </label>
                      <select
                        id="S5P01_6_HorasSemana"
                        name="S5P01_6_HorasSemana"
                        className="form-control-select"
                        value={respuestas.S5P01_6_HorasSemana}
                        onChange={handleInputChange}
                      >
                        <option value="Menos de 20 horas">Menos de 20 horas (Medio tiempo)</option>
                        <option value="20 a 40 horas">20 a 40 horas (Tiempo completo)</option>
                        <option value="Más de 40 horas">Más de 40 horas</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="question-group">
                      <label className="question-label" htmlFor="S5P01_7_ModalidadVinculacion">
                        5.1.7. Modalidad de vinculación a su empleo <span className="required">*</span>
                      </label>
                      <select
                        id="S5P01_7_ModalidadVinculacion"
                        name="S5P01_7_ModalidadVinculacion"
                        className="form-control-select"
                        value={respuestas.S5P01_7_ModalidadVinculacion}
                        onChange={handleInputChange}
                      >
                        <option value="Contrato a plazo fijo">Contrato a plazo fijo</option>
                        <option value="Contrato indefinido">Contrato indefinido</option>
                        <option value="Consultoría / Por producto">Consultoría / Por producto</option>
                        <option value="Pasantía">Pasantía</option>
                        <option value="Sin contrato formal">Sin contrato formal</option>
                      </select>
                    </div>

                    <div className="question-group">
                      <label className="question-label" htmlFor="S5P01_8_RangoSalarial">
                        5.1.8. Rango salarial o ingreso promedio mensual <span className="required">*</span>
                      </label>
                      <select
                        id="S5P01_8_RangoSalarial"
                        name="S5P01_8_RangoSalarial"
                        className="form-control-select"
                        value={respuestas.S5P01_8_RangoSalarial}
                        onChange={handleInputChange}
                      >
                        <option value="Menos de 1 Salario Mínimo Nacional">Menos de 1 Salario Mínimo Nacional</option>
                        <option value="1 a 2 Salarios Mínimos">1 a 2 Salarios Mínimos</option>
                        <option value="2 a 3 Salarios Mínimos">2 a 3 Salarios Mínimos</option>
                        <option value="Más de 4 Salarios Mínimos">Más de 4 Salarios Mínimos</option>
                      </select>
                    </div>
                  </div>

                  <div className="question-group" style={{ marginBottom: 0 }}>
                    <label className="question-label" htmlFor="S5P01_9_ComoConsiguioEmpleo">
                      5.1.9. Indique cómo consiguió su primer empleo <span className="required">*</span>
                    </label>
                    <select
                      id="S5P01_9_ComoConsiguioEmpleo"
                      name="S5P01_9_ComoConsiguioEmpleo"
                      className="form-control-select"
                      value={respuestas.S5P01_9_ComoConsiguioEmpleo}
                      onChange={handleInputChange}
                    >
                      <option value="Pasantías">Pasantías en la empresa</option>
                      <option value="Redes sociales o amistades">Redes sociales o amistades</option>
                      <option value="Bolsa de trabajo universitaria">Bolsa de trabajo / USEI</option>
                      <option value="Convocatorias públicas o periódicos">Convocatorias públicas o periódicos</option>
                      <option value="Convenios interinstitucionales">Convenios interinstitucionales UCB</option>
                      <option value="Emprendimiento propio">Emprendimiento propio</option>
                      <option value="Otro">Otro medio</option>
                    </select>
                  </div>
                </div>
              )}

              {/* RAMA 5.2: SI ESTÁ BUSCANDO TRABAJO */}
              {respuestas.S5P01_ActividadActual === 'Buscando trabajo' && (
                <div className="conditional-box" style={{ marginBottom: '1.5rem' }}>
                  <span className="conditional-badge">Búsqueda Laboral Activa:</span>

                  <div className="form-row-2">
                    <div className="question-group">
                      <label className="question-label">
                        5.2.1. ¿Está usted interesado(a) en conseguir empleo? <span className="required">*</span>
                      </label>
                      <div className="radio-group-inline">
                        {['Sí', 'No'].map((op) => (
                          <label key={op} className="radio-option">
                            <input
                              type="radio"
                              name="S5P02_1_InteresadoEnEmpleo"
                              value={op}
                              checked={respuestas.S5P02_1_InteresadoEnEmpleo === op}
                              onChange={handleInputChange}
                            />
                            {op}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="question-group">
                      <label className="question-label">
                        5.2.2. En el último mes, ¿ha realizado gestiones para conseguir trabajo? <span className="required">*</span>
                      </label>
                      <div className="radio-group-inline">
                        {['Sí', 'No'].map((op) => (
                          <label key={op} className="radio-option">
                            <input
                              type="radio"
                              name="S5P02_2_GestionBusqueda"
                              value={op}
                              checked={respuestas.S5P02_2_GestionBusqueda === op}
                              onChange={handleInputChange}
                            />
                            {op}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="question-group" style={{ marginBottom: 0 }}>
                    <label className="question-label" htmlFor="S5P02_3_MotivoNoEncuentra">
                      5.2.3. Principal motivo por el cual considera que no encuentra empleo <span className="required">*</span>
                    </label>
                    <select
                      id="S5P02_3_MotivoNoEncuentra"
                      name="S5P02_3_MotivoNoEncuentra"
                      className="form-control-select"
                      value={respuestas.S5P02_3_MotivoNoEncuentra}
                      onChange={handleInputChange}
                    >
                      <option value="Los empleadores consideran que soy muy joven">Los empleadores consideran que soy muy joven / falta de experiencia</option>
                      <option value="No hay trabajo disponible en mi profesión">No hay vacantes o trabajo en mi profesión</option>
                      <option value="No sé cómo buscar empleo">No sé cómo buscar empleo de manera efectiva</option>
                      <option value="Los salarios son muy bajos">Los salarios ofrecidos son muy bajos</option>
                      <option value="Dicen que no tengo las competencias requeridas">No cumplo con todas las competencias técnicas exigidas</option>
                      <option value="Otro">Otro motivo</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 6. POSTGRADO */}
              <div className="section-subgroup">
                <h3 className="section-subgroup-title">6. Información de Postgrado</h3>
              </div>

              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label">
                    6.1. ¿Ha realizado cursos a nivel de posgrado? <span className="required">*</span>
                  </label>
                  <div className="radio-group-inline">
                    {['No', 'Sí'].map((op) => (
                      <label key={op} className="radio-option">
                        <input
                          type="radio"
                          name="S6P01_RealizoPostgrado"
                          value={op}
                          checked={respuestas.S6P01_RealizoPostgrado === op}
                          onChange={handleInputChange}
                        />
                        {op}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="question-group">
                  <label className="question-label" htmlFor="S6P01_1_MaximoGradoObtenido">
                    6.1.1. ¿Cuál es el máximo grado académico que ha obtenido? <span className="required">*</span>
                  </label>
                  <select
                    id="S6P01_1_MaximoGradoObtenido"
                    name="S6P01_1_MaximoGradoObtenido"
                    className="form-control-select"
                    value={respuestas.S6P01_1_MaximoGradoObtenido}
                    onChange={handleInputChange}
                  >
                    <option value="Licenciatura">Licenciatura</option>
                    <option value="Diplomado">Diplomado</option>
                    <option value="Especialidad">Especialidad</option>
                    <option value="Maestría">Maestría</option>
                    <option value="Doctorado">Doctorado</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label" htmlFor="S6P01_2_GradoPostulando">
                    6.1.2. ¿Cuál es el grado académico al que está postulando? <span className="required">*</span>
                  </label>
                  <select
                    id="S6P01_2_GradoPostulando"
                    name="S6P01_2_GradoPostulando"
                    className="form-control-select"
                    value={respuestas.S6P01_2_GradoPostulando}
                    onChange={handleInputChange}
                  >
                    <option value="Ninguno / No estoy postulando">Ninguno / No estoy postulando</option>
                    <option value="Diplomado">Diplomado</option>
                    <option value="Especialidad">Especialidad</option>
                    <option value="Maestría">Maestría</option>
                    <option value="Doctorado">Doctorado</option>
                  </select>
                </div>

                <div className="question-group">
                  <label className="question-label">
                    6.1.3. ¿Le interesaría seguir cursos de postgrado en la U.C.B.? <span className="required">*</span>
                  </label>
                  <div className="radio-group-inline">
                    {['Sí', 'No'].map((op) => (
                      <label key={op} className="radio-option">
                        <input
                          type="radio"
                          name="S6P01_3_InteresPostgradoUCB"
                          value={op}
                          checked={respuestas.S6P01_3_InteresPostgradoUCB === op}
                          onChange={handleInputChange}
                        />
                        {op}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row-2">
                <div className="question-group">
                  <label className="question-label" htmlFor="S6P02_1_GradoInteresAlcanzar">
                    6.2.1. Grado académico que le interesaría alcanzar <span className="required">*</span>
                  </label>
                  <select
                    id="S6P02_1_GradoInteresAlcanzar"
                    name="S6P02_1_GradoInteresAlcanzar"
                    className="form-control-select"
                    value={respuestas.S6P02_1_GradoInteresAlcanzar}
                    onChange={handleInputChange}
                  >
                    <option value="Maestría">Maestría</option>
                    <option value="Diplomado">Diplomado</option>
                    <option value="Especialidad">Especialidad</option>
                    <option value="Doctorado">Doctorado</option>
                    <option value="No por el momento">No por el momento</option>
                  </select>
                </div>

                <div className="question-group">
                  <label className="question-label" htmlFor="S6P02_2_AreaInteresPostgrado">
                    6.2.2. Área de interés para su curso de postgrado <span className="required">*</span>
                  </label>
                  <select
                    id="S6P02_2_AreaInteresPostgrado"
                    name="S6P02_2_AreaInteresPostgrado"
                    className="form-control-select"
                    value={respuestas.S6P02_2_AreaInteresPostgrado}
                    onChange={handleInputChange}
                  >
                    <option value="Área Tecnológica e Ingeniería de Sistemas">Área Tecnológica e Ingeniería de Sistemas</option>
                    <option value="Gestión Empresarial y Finanzas">Gestión Empresarial y Finanzas</option>
                    <option value="Derecho y Ciencias Políticas">Derecho y Ciencias Políticas</option>
                    <option value="Ciencias Sociales y Humanidades">Ciencias Sociales y Humanidades</option>
                    <option value="Educación y Docencia Universitaria">Educación y Docencia Universitaria</option>
                    <option value="Salud y Bienestar">Salud y Bienestar</option>
                    <option value="Otra área">Otra área</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Botones de Navegación */}
          <div className="encuesta-actions">
            {pasoActual > 1 ? (
              <button
                type="button"
                className="btn-nav-back"
                onClick={handleAtras}
                disabled={loading}
              >
                ← Atrás
              </button>
            ) : (
              <div></div>
            )}

            {pasoActual < 4 ? (
              <button
                type="button"
                className="btn-nav-next"
                onClick={handleSiguiente}
                disabled={loading}
              >
                Continuar →
              </button>
            ) : (
              <button
                type="button"
                className="btn-nav-finish"
                onClick={handleFinalizar}
                disabled={loading}
              >
                {loading ? 'Registrando respuestas...' : 'Finalizar Encuesta ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
