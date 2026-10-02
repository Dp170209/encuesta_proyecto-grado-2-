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

    // Validación reactiva inmediata para rechazar dominio institucional
    if (name === 'correo_privado') {
      const lower = value.toLowerCase();
      if (lower.includes('@ucb.edu.bo')) {
        setCorreoInvalido(true);
      } else {
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
    if (!formData.nombre_completo.trim()) {
      setErrorGeneral('Por favor ingrese sus Nombres y Apellidos.');
      return;
    }
    if (!formData.correo_privado.trim()) {
      setErrorGeneral('Por favor ingrese un correo electrónico personal.');
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
        {/* Cabecera institucional */}
        <div className="verif-card-header">
          <h2>Encuesta a Tiempo de Graduación</h2>
          <p>Unidad de Servicios Estudiantiles Integrales (USEI)</p>
        </div>

        <div className="verif-card-body">
          {/* Mensaje Permanente de Sesión Única */}
          <div className="verif-warning-box">
            <div className="verif-warning-title">
              <span>⚠️</span>
              <span>¡Aviso Importante!</span>
            </div>
            <p className="verif-warning-text">
              Debes finalizar la encuesta en esta sesión, ya que, de otra manera, tendrás que iniciar nuevamente.
            </p>
          </div>

          {/* Estado de Éxito: Estudiante Verificado */}
          {estudianteVerificado ? (
            <div className="verif-success-card">
              <div className="verif-success-icon">✓</div>
              <h3 className="verif-success-title">¡Identidad Verificada!</h3>
              <p style={{ fontSize: '0.9rem', color: '#475569' }}>
                Bienvenido/a al proceso de graduación.
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
                  alert('¡Acceso concedido! Redirigiendo a la Sección 1 del Formulario de Encuesta (Sprint 2)...');
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
                  <span>⛔</span>
                  <div>{errorGeneral}</div>
                </div>
              )}

              {/* Input: Carnet de Identidad */}
              <div className="verif-form-group">
                <label className="verif-form-label" htmlFor="carnet_identidad">
                  Carnet de Identidad
                </label>
                <input
                  id="carnet_identidad"
                  name="carnet_identidad"
                  type="text"
                  className="verif-input"
                  placeholder="Ej. 1234567"
                  value={formData.carnet_identidad}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              {/* Input: Nombre Completo */}
              <div className="verif-form-group">
                <label className="verif-form-label" htmlFor="nombre_completo">
                  Nombre Completo
                </label>
                <input
                  id="nombre_completo"
                  name="nombre_completo"
                  type="text"
                  className="verif-input"
                  placeholder="Apellidos y Nombres"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="off"
                />
                <span className="verif-input-hint">
                  Tal como está registrado en la Universidad
                </span>
              </div>

              {/* Input: Correo Electrónico Privado */}
              <div className="verif-form-group">
                <label className="verif-form-label" htmlFor="correo_privado">
                  Correo Electrónico Privado
                </label>
                <input
                  id="correo_privado"
                  name="correo_privado"
                  type="email"
                  className={`verif-input ${correoInvalido ? 'input-error' : ''}`}
                  placeholder="tucorreo@gmail.com"
                  value={formData.correo_privado}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="off"
                />
                {correoInvalido && (
                  <span className="verif-mail-warning">
                    * No se permiten correos @ucb.edu.bo. Ingrese un correo personal.
                  </span>
                )}
              </div>

              {/* Botón de Validación e Inicio */}
              <button
                type="submit"
                className="verif-btn-submit"
                disabled={loading || correoInvalido}
              >
                {loading ? 'Validando con USEI...' : 'Validar Identidad e Iniciar'}
              </button>
            </form>
          )}
        </div>

        {/* Pie de Tarjeta */}
        <div className="verif-card-footer">
          © 2026 Universidad Católica Boliviana "San Pablo"
        </div>
      </div>
    </div>
  );
}
