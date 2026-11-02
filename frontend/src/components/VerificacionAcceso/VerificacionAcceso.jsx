import React, { useState } from 'react';
import './VerificacionAcceso.css';
import { verificarGraduado } from '../../services/authApi';

export default function VerificacionAcceso({ onAccesoConcedido }) {
  const [formData, setFormData] = useState({
    carnet_identidad: '',
    nombre_completo: '',
    correo_privado: '',
  });

  const [correoInvalido, setCorreoInvalido] = useState(false);
  const [avisoCorreo, setAvisoCorreo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [estudianteVerificado, setEstudianteVerificado] = useState(null);

  // Manejador de cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrorGeneral(null);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validación reactiva inmediata para el correo electrónico
    if (name === 'correo_privado') {
      const lower = value.toLowerCase().trim();
      const partes = lower.split('@');
      const dominio = partes.length === 2 ? partes[1] : '';

      const TYPOS_GMAIL = new Set([
        'gmai.com', 'gamil.com', 'gmial.com', 'gmaill.com', 'gmail.con',
        'gmail.co', 'gemail.com', 'gmail.cpm', 'gmail.om', 'gmaik.com', 'gmail.comm'
      ]);
      const TYPOS_HOTMAIL = new Set([
        'hotmial.com', 'hotmai.com', 'hotmail.con', 'hormail.com', 'hotmaill.com'
      ]);
      const TYPOS_OUTLOOK = new Set([
        'outlok.com', 'outloo.com', 'outlook.con', 'outllok.com'
      ]);
      const TYPOS_YAHOO = new Set([
        'yaho.com', 'yahoo.con', 'yaho.es', 'yahooo.com'
      ]);

      if (lower.includes(',')) {
        setAvisoCorreo("Detectamos una coma ',' en lugar de un punto. Corríjalo (ejemplo: usuario@gmail.com).");
        setCorreoInvalido(true);
      } else if (dominio === 'ucb.edu.bo' || lower.includes('@ucb.edu.bo')) {
        setAvisoCorreo('No se permiten correos académicos @ucb.edu.bo. Ingrese un correo personal.');
        setCorreoInvalido(true);
      } else if (TYPOS_GMAIL.has(dominio)) {
        setAvisoCorreo('Posible error tipográfico. ¿Quiso escribir @gmail.com?');
        setCorreoInvalido(true);
      } else if (TYPOS_HOTMAIL.has(dominio)) {
        setAvisoCorreo('Posible error tipográfico. ¿Quiso escribir @hotmail.com?');
        setCorreoInvalido(true);
      } else if (TYPOS_OUTLOOK.has(dominio)) {
        setAvisoCorreo('Posible error tipográfico. ¿Quiso escribir @outlook.com?');
        setCorreoInvalido(true);
      } else if (TYPOS_YAHOO.has(dominio)) {
        setAvisoCorreo('Posible error tipográfico. ¿Quiso escribir @yahoo.com?');
        setCorreoInvalido(true);
      } else {
        setAvisoCorreo(null);
        setCorreoInvalido(false);
      }
    }
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGeneral(null);

    // Validación básica de campos vacíos
    if (!formData.carnet_identidad.trim()) {
      setErrorGeneral('Por favor ingrese su Carnet de Identidad.');
      return;
    }

    // Validación de nombres y apellidos completos
    const palabrasNombre = formData.nombre_completo
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    if (palabrasNombre.length < 2) {
      setErrorGeneral(
        'Debe ingresar sus nombres y apellidos completos (al menos un nombre y un apellido tal como figuran en Kardex).'
      );
      return;
    }

    if (!formData.correo_privado.trim()) {
      setErrorGeneral('Por favor ingrese un correo electrónico personal.');
      return;
    }

    if (formData.correo_privado.includes(',')) {
      setErrorGeneral(
        "El correo no puede contener comas ','. Debe escribir un punto '.' (ejemplo: usuario@gmail.com)."
      );
      return;
    }

    // Validación de dominio antes de llamar a la API
    if (formData.correo_privado.toLowerCase().includes('@ucb.edu.bo')) {
      setCorreoInvalido(true);
      setErrorGeneral('No se permiten correos académicos. Ingrese un correo personal.');
      return;
    }

    try {
      setLoading(true);
      const res = await verificarGraduado({
        carnet_identidad: formData.carnet_identidad.trim(),
        nombre_completo: formData.nombre_completo.trim(),
        correo_privado: formData.correo_privado.trim(),
      });

      setEstudianteVerificado(res.graduado);

      // Si se pasa callback para redirigir a la encuesta en el flujo general
      if (onAccesoConcedido) {
        onAccesoConcedido(res);
      }
    } catch (err) {
      setErrorGeneral(err.message || 'Error al validar la identidad del estudiante.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verif-page-wrapper">
      <div className="verif-card">
        {/* Cabecera de la Tarjeta (Logos en la barra superior oficial) */}
        <div className="verif-card-header">
          <div className="verif-header-titles">
            <span className="verif-badge-sede">Portal de Titulación · Sede La Paz</span>
            <h2>Encuesta a Tiempo de Graduación</h2>
            <p>Validación de Identidad de Estudiantes Habilitados</p>
          </div>
        </div>

        <div className="verif-card-body">
          {/* Mensaje Informativo de Sesión Única */}
          <div className="verif-warning-box">
            <div className="verif-warning-title">
              <span>Atención: Registro en Sesión Única</span>
            </div>
            <p className="verif-warning-text">
              Por normativa de la USEI, debe completar y enviar la encuesta en este intento. Al finalizar, el sistema generará automáticamente su <strong>Certificado Oficial en PDF</strong> para su trámite de titulación.
            </p>
          </div>

          {/* Estado de Éxito: Estudiante Verificado */}
          {estudianteVerificado ? (
            <div className="verif-success-card">
              <div className="verif-success-icon">✓</div>
              <h3 className="verif-success-title">Identidad Verificada</h3>
              <p style={{ fontSize: '0.9rem', color: '#475569' }}>
                Bienvenido/a al proceso oficial de graduación.
              </p>

              <div className="verif-student-info">
                <div><strong>Estudiante:</strong> {estudianteVerificado.nombres} {estudianteVerificado.apellidos}</div>
                <div><strong>CI:</strong> {estudianteVerificado.carnet_identidad}</div>
                <div><strong>Carrera:</strong> {estudianteVerificado.carrera}</div>
                <div><strong>Modalidad:</strong> {estudianteVerificado.modalidad_titulacion || 'Tesis'}</div>
                <div><strong>Correo Notificación:</strong> {estudianteVerificado.correo_privado}</div>
              </div>

              <button
                type="button"
                className="verif-btn-start"
                onClick={() => {
                  if (onAccesoConcedido) {
                    onAccesoConcedido({ graduado: estudianteVerificado });
                  }
                }}
              >
                Continuar a la Encuesta →
              </button>
            </div>
          ) : (
            /* Formulario de Verificación */
            <form onSubmit={handleSubmit}>
              {/* Banner de Error */}
              {errorGeneral && (
                <div className="verif-error-banner">
                  <div>{errorGeneral}</div>
                </div>
              )}

              {/* Input: Carnet de Identidad */}
              <div className="verif-form-group">
                <label className="verif-form-label" htmlFor="carnet_identidad">
                  Carnet de Identidad (CI)
                </label>
                <input
                  id="carnet_identidad"
                  name="carnet_identidad"
                  type="text"
                  className="verif-input"
                  placeholder="Ej. 6849201"
                  value={formData.carnet_identidad}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              {/* Input: Nombre Completo */}
              <div className="verif-form-group">
                <label className="verif-form-label" htmlFor="nombre_completo">
                  Nombres y Apellidos Completos
                </label>
                <input
                  id="nombre_completo"
                  name="nombre_completo"
                  type="text"
                  className="verif-input"
                  placeholder="Nombres y Apellidos completos"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="off"
                />
                <span className="verif-input-hint">
                  Tal como figura en el registro oficial de Kardex Académico UCB
                </span>
              </div>

              {/* Input: Correo Electrónico Privado */}
              <div className="verif-form-group">
                <label className="verif-form-label" htmlFor="correo_privado">
                  Correo Electrónico Personal
                </label>
                <input
                  id="correo_privado"
                  name="correo_privado"
                  type="email"
                  className={`verif-input ${correoInvalido ? 'input-error' : ''}`}
                  placeholder="ejemplo@gmail.com (No institucional)"
                  value={formData.correo_privado}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="off"
                />
                {avisoCorreo && (
                  <span className="verif-mail-warning">
                    {avisoCorreo}
                  </span>
                )}
                {!avisoCorreo && (
                  <span className="verif-input-hint">
                    Aquí se enviará de forma inmediata su Certificado Oficial de Graduación en PDF.
                  </span>
                )}
              </div>

              {/* Botón de Validación e Inicio */}
              <button
                type="submit"
                className="verif-btn-submit"
                disabled={loading || correoInvalido}
              >
                {loading ? (
                  <>Validando con el Padrón Oficial...</>
                ) : (
                  <>Validar Identidad e Iniciar Encuesta →</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Pie de Tarjeta */}
        <div className="verif-card-footer">
          Acceso Oficial · Unidad de Servicios Estudiantiles Integrales (USEI) · U.C.B.
        </div>
      </div>
    </div>
  );
}
