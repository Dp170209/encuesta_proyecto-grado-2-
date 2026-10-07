import React, { useState, useEffect } from 'react';
import GestorIntegracion from './components/GestorIntegracion/GestorIntegracion';
import VerificacionAcceso from './components/VerificacionAcceso/VerificacionAcceso';
import EncuestaForm from './components/Encuesta/EncuestaForm';
import DashboardAdmin from './components/Admin/DashboardAdmin';
import LoginAdminModal from './components/Admin/LoginAdminModal';
import { getGraduadoSesion, cerrarSesion } from './services/authApi';
import { getAdminSesion, cerrarSesionAdmin } from './services/adminApi';

export default function App() {
  // Estado para el flujo del Graduado (Estudiante)
  const [sesionGraduado, setSesionGraduado] = useState(null);

  // Estado para el flujo de Administrador (USEI)
  const [sesionAdmin, setSesionAdmin] = useState(null);
  const [modoAdminActivo, setModoAdminActivo] = useState(false);
  const [vistaAdmin, setVistaAdmin] = useState('dashboard'); // 'dashboard' (HU-05) | 'etl' (HU-01)
  const [modalAdminAbierto, setModalAdminAbierto] = useState(false);

  useEffect(() => {
    // Restaurar sesión de graduado si existe
    const graduado = getGraduadoSesion();
    if (graduado) {
      setSesionGraduado(graduado);
    }

    // Restaurar sesión de administrador si existe
    const admin = getAdminSesion();
    if (admin) {
      setSesionAdmin(admin);
    }
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ===================================================================
          1. HEADER NAVEGACIÓN (SEGREGA ROLES SEGÚN MODO ACTIVO)
          =================================================================== */}
      <header
        style={{
          backgroundColor: modoAdminActivo ? '#091e34' : '#0a2540',
          color: '#ffffff',
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: modoAdminActivo ? '3px solid #f59e0b' : 'none',
        }}
      >
        {/* Identidad Institucional */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              backgroundColor: '#f59e0b',
              color: '#0a2540',
              fontWeight: '800',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontSize: '1rem',
              letterSpacing: '0.5px',
            }}
          >
            USEI - UCB
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
              {modoAdminActivo
                ? 'Portal de Inteligencia y Gestión Administrativa'
                : 'Sistema Integrado de Seguimiento a Graduados'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
              Unidad de Servicios Estudiantiles Integrales · Sede La Paz
            </p>
          </div>
        </div>

        {/* ===================================================================
            SI ESTAMOS EN MODO ADMINISTRADOR (PANEL PRIVADO USEI)
            =================================================================== */}
        {modoAdminActivo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Pestañas exclusivas del administrador */}
            <button
              onClick={() => setVistaAdmin('dashboard')}
              style={{
                backgroundColor: vistaAdmin === 'dashboard' ? '#0e3d7a' : 'transparent',
                color: '#ffffff',
                border: vistaAdmin === 'dashboard' ? '1.5px solid #38bdf8' : '1px solid #475569',
                padding: '0.45rem 0.95rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
              }}
            >
              📊 1. Dashboard Analítico (HU-05)
            </button>

            <button
              onClick={() => setVistaAdmin('etl')}
              style={{
                backgroundColor: vistaAdmin === 'etl' ? '#0e3d7a' : 'transparent',
                color: '#ffffff',
                border: vistaAdmin === 'etl' ? '1.5px solid #38bdf8' : '1px solid #475569',
                padding: '0.45rem 0.95rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
              }}
            >
              📁 2. Gestor ETL Kardex (HU-01)
            </button>

            {/* Badge de Administrador y Salir */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginLeft: '0.5rem',
                paddingLeft: '0.75rem',
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
                👤 {sesionAdmin?.nombre_completo || 'Admin'}
              </span>

              <button
                onClick={handleCerrarSesionAdmin}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#fca5a5',
                  border: '1px solid #ef4444',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cerrar Sesión Admin
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
              🔐 Portal Administrativo USEI
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
          vistaAdmin === 'dashboard' ? (
            <DashboardAdmin />
          ) : (
            <GestorIntegracion />
          )
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
          3. PIE DE PÁGINA INSTITUCIONAL
          =================================================================== */}
      <footer
        style={{
          textAlign: 'center',
          padding: '1.25rem',
          fontSize: '0.8rem',
          color: '#64748b',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
        }}
      >
        © 2026 Universidad Católica Boliviana "San Pablo" · Unidad de Servicios Estudiantiles Integrales (USEI)
      </footer>
    </div>
  );
}
