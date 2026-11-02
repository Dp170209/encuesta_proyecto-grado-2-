import React, { useState, useEffect } from 'react';
import GestorIntegracion from './components/GestorIntegracion/GestorIntegracion';
import VerificacionAcceso from './components/VerificacionAcceso/VerificacionAcceso';
import EncuestaForm from './components/Encuesta/EncuestaForm';
import DashboardAdmin from './components/Admin/DashboardAdmin';
import RespuestasEstudiantes from './components/Admin/RespuestasEstudiantes';
import EstudiantesPendientes from './components/Admin/EstudiantesPendientes';
import LoginAdminModal from './components/Admin/LoginAdminModal';
import { cerrarSesion } from './services/authApi';
import { getAdminSesion, cerrarSesionAdmin } from './services/adminApi';

export default function App() {
  // Estado para el flujo del Graduado (Estudiante)
  const [sesionGraduado, setSesionGraduado] = useState(null);

  // Estado para el flujo de Administrador (USEI)
  const [sesionAdmin, setSesionAdmin] = useState(null);
  const [modoAdminActivo, setModoAdminActivo] = useState(false);
  const [vistaAdmin, setVistaAdmin] = useState('dashboard'); // 'dashboard' | 'etl' | 'respuestas' | 'pendientes'
  const [modalAdminAbierto, setModalAdminAbierto] = useState(false);

  useEffect(() => {
    // REGLA: Cada vez que el estudiante salga o recargue la página, el proceso se reinicia desde cero
    cerrarSesion();
    setSesionGraduado(null);

    // Restaurar únicamente la sesión administrativa si existe
    const admin = getAdminSesion();
    if (admin) {
      setSesionAdmin(admin);
    }

    // Limpieza obligatoria si el usuario cierra la ventana o sale de la pestaña
    const handleBeforeUnload = () => {
      cerrarSesion();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Manejadores para el Graduado
  const handleAccesoGraduado = (res) => {
    setSesionGraduado(res.graduado);
  };

  const handleCerrarSesionGraduado = () => {
    cerrarSesion();
    setSesionGraduado(null);
  };

  // Manejadores para el Administrador
  const handleAbrirAdmin = () => {
    if (sesionAdmin) {
      setModoAdminActivo(true);
    } else {
      setModalAdminAbierto(true);
    }
  };

  const handleLoginAdminExitoso = (admin) => {
    setSesionAdmin(admin);
    setModoAdminActivo(true);
    setVistaAdmin('dashboard');
  };

  const handleCerrarSesionAdmin = () => {
    cerrarSesionAdmin();
    setSesionAdmin(null);
    setModoAdminActivo(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Cinta Dorada Heráldica Superior */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #fbbf24 100%)' }} />

      {/* ===================================================================
          1. HEADER NAVEGACIÓN INSTITUCIONAL UCB & USEI
          =================================================================== */}
      <header
        className="app-header"
        style={{
          background: modoAdminActivo
            ? 'linear-gradient(135deg, #061527 0%, #0a2540 100%)'
            : 'linear-gradient(135deg, #071a2f 0%, #0a2540 55%, #0e3d7a 100%)',
          borderBottom: modoAdminActivo ? '3px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Identidad Institucional con Logotipos Oficiales UCB y USEI (Único lugar donde van los logos) */}
        <div className="app-header-brand">
          <div className="app-logos-container">
            <div className="app-logo-card">
              <img
                src="/logo_ucb.png"
                alt="Universidad Católica Boliviana San Pablo"
                className="app-header-logo-img"
              />
            </div>

            <div className="app-logo-card">
              <img
                src="/logo_usei.jpg"
                alt="Unidad de Servicios Estudiantiles Integrales"
                className="app-header-logo-img"
                style={{ borderRadius: '4px' }}
              />
            </div>
          </div>

          <div className="app-header-title-box">
            <h1 className="app-header-title">
              {modoAdminActivo
                ? 'Portal de Inteligencia y Gestión Estratégica USEI'
                : 'Sistema Integrado de Seguimiento a Graduados'}
            </h1>
          </div>
        </div>

        {/* ===================================================================
            BOTONES DE NAVEGACIÓN Y PERFIL
            =================================================================== */}
        {modoAdminActivo ? (
          <div className="app-header-actions" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Pestañas exclusivas del administrador */}
            <button
              onClick={() => setVistaAdmin('dashboard')}
              style={{
                backgroundColor: vistaAdmin === 'dashboard' ? '#0e3d7a' : 'transparent',
                color: '#ffffff',
                border: vistaAdmin === 'dashboard' ? '1.5px solid #38bdf8' : '1px solid #475569',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              1. Estadísticas y Reportes
            </button>

            <button
              onClick={() => setVistaAdmin('etl')}
              style={{
                backgroundColor: vistaAdmin === 'etl' ? '#0e3d7a' : 'transparent',
                color: '#ffffff',
                border: vistaAdmin === 'etl' ? '1.5px solid #38bdf8' : '1px solid #475569',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              2. Cargar Estudiantes
            </button>

            <button
              onClick={() => setVistaAdmin('respuestas')}
              style={{
                backgroundColor: vistaAdmin === 'respuestas' ? '#0e3d7a' : 'transparent',
                color: '#ffffff',
                border: vistaAdmin === 'respuestas' ? '1.5px solid #38bdf8' : '1px solid #475569',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              3. Respuestas de Estudiantes
            </button>

            <button
              onClick={() => setVistaAdmin('pendientes')}
              style={{
                backgroundColor: vistaAdmin === 'pendientes' ? '#0e3d7a' : 'transparent',
                color: '#ffffff',
                border: vistaAdmin === 'pendientes' ? '1.5px solid #38bdf8' : '1px solid #475569',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              4. Estudiantes Pendientes
            </button>

            {/* Badge de Administrador y Salir */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginLeft: '0.35rem',
                paddingLeft: '0.65rem',
                borderLeft: '1px solid #334155',
              }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  color: '#93c5fd',
                  fontWeight: '600',
                }}
              >
                {sesionAdmin?.nombre_completo || 'Administrador'}
              </span>

              <button
                onClick={handleCerrarSesionAdmin}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#fca5a5',
                  border: '1px solid #ef4444',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        ) : (
          /* ===================================================================
              SI ESTAMOS EN MODO GRADUADO (PORTAL PÚBLICO DE ENCUESTA)
              =================================================================== */
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Si el graduado está llenando encuesta, botón de salir */}
            {sesionGraduado && (
              <button
                onClick={handleCerrarSesionGraduado}
                title="Cerrar sesión de graduado"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  border: '1px solid #ef4444',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Salir ({sesionGraduado.nombres?.split(' ')[0]})
              </button>
            )}

            {/* Botón Discreto para Acceso del Administrador */}
            <button
              onClick={handleAbrirAdmin}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
                border: '1px solid #475569',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
              }}
            >
              Portal Administrativo USEI
            </button>
          </div>
        )}
      </header>

      {/* ===================================================================
          2. CONTENIDO PRINCIPAL SEGÚN EL ROL ACTIVO
          =================================================================== */}
      <main style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
        {modoAdminActivo ? (
          /* VISTA ADMINISTRADOR */
          <>
            {vistaAdmin === 'dashboard' && <DashboardAdmin />}
            {vistaAdmin === 'etl' && <GestorIntegracion />}
            {vistaAdmin === 'respuestas' && <RespuestasEstudiantes />}
            {vistaAdmin === 'pendientes' && <EstudiantesPendientes />}
          </>
        ) : (
          /* VISTA GRADUADO (FLUJO PÚBLICO) */
          sesionGraduado ? (
            <EncuestaForm
              onEncuestaFinalizada={(res) => {
                console.log('Encuesta registrada y certificado emitido:', res);
              }}
              onVolverAInicio={handleCerrarSesionGraduado}
            />
          ) : (
            <VerificacionAcceso onAccesoConcedido={handleAccesoGraduado} />
          )
        )}
      </main>

      {/* Modal de Login Exclusivo para Administrador */}
      <LoginAdminModal
        isOpen={modalAdminAbierto}
        onClose={() => setModalAdminAbierto(false)}
        onLoginExitoso={handleLoginAdminExitoso}
      />

      {/* ===================================================================
          3. PIE DE PÁGINA INSTITUCIONAL UCB & USEI
          =================================================================== */}
      <footer
        style={{
          backgroundColor: '#0a2540',
          color: '#cbd5e1',
          borderTop: '3px solid #f59e0b',
          padding: '1.75rem 2rem 1.25rem',
          fontSize: '0.82rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div>
            <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '0.86rem' }}>
              Universidad Católica Boliviana "San Pablo" · Sede La Paz
            </div>
            <div style={{ color: '#93c5fd', fontSize: '0.76rem' }}>
              Unidad de Servicios Estudiantiles Integrales (USEI) · Sede San Pablo
            </div>
          </div>

          <div style={{ textAlign: 'right', minWidth: '220px' }}>
            <div style={{ color: '#f59e0b', fontWeight: '700', fontSize: '0.8rem' }}>
              Atención y Soporte Titulación:
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '0.76rem' }}>
              📧 usei.lapaz@ucb.edu.bo · 📞 (+591) 2-2782222
            </div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.2rem' }}>
              © 2026 UCB "San Pablo". Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
