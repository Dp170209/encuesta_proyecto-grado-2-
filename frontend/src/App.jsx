import React, { useState, useEffect } from 'react';
import GestorIntegracion from './components/GestorIntegracion/GestorIntegracion';
import VerificacionAcceso from './components/VerificacionAcceso/VerificacionAcceso';
import EncuestaForm from './components/Encuesta/EncuestaForm';
import { getGraduadoSesion, cerrarSesion } from './services/authApi';

export default function App() {
  const [vistaActual, setVistaActual] = useState('verificacion'); // 'verificacion' | 'encuesta' | 'admin'
  const [sesionGraduado, setSesionGraduado] = useState(null);

  useEffect(() => {
    const sesion = getGraduadoSesion();
    if (sesion) {
      setSesionGraduado(sesion);
    }
  }, []);

  const handleAccesoConcedido = (res) => {
    setSesionGraduado(res.graduado);
    setVistaActual('encuesta');
  };

  const handleCerrarSesion = () => {
    cerrarSesion();
    setSesionGraduado(null);
    setVistaActual('verificacion');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Barra superior de navegación institucional */}
      <header
        style={{
          backgroundColor: '#0a2540',
          color: '#ffffff',
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
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
            <h2 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f8fafc', margin: 0 }}>
              Sistema Integrado de Seguimiento a Graduados
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
              Unidad de Servicios Estudiantiles Integrales · Sede La Paz
            </p>
          </div>
        </div>

        {/* Selector de Vistas / Pestañas de Trabajo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setVistaActual('verificacion')}
            style={{
              backgroundColor: vistaActual === 'verificacion' ? '#0e3d7a' : 'transparent',
              color: '#ffffff',
              border: vistaActual === 'verificacion' ? '1.5px solid #38bdf8' : '1px solid #475569',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            1. Verificación (HU-02)
          </button>

          <button
            onClick={() => setVistaActual('encuesta')}
            style={{
              backgroundColor: vistaActual === 'encuesta' ? '#0e3d7a' : 'transparent',
              color: '#ffffff',
              border: vistaActual === 'encuesta' ? '1.5px solid #38bdf8' : '1px solid #475569',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            2. Encuesta 4 Secciones (HU-03)
          </button>

          <button
            onClick={() => setVistaActual('admin')}
            style={{
              backgroundColor: vistaActual === 'admin' ? '#0e3d7a' : 'transparent',
              color: '#ffffff',
              border: vistaActual === 'admin' ? '1.5px solid #38bdf8' : '1px solid #475569',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            3. Gestor ETL Admin (HU-01)
          </button>

          {sesionGraduado && (
            <button
              onClick={handleCerrarSesion}
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
        </div>
      </header>

      {/* Contenido principal según la vista activa */}
      <main style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
        {vistaActual === 'verificacion' && (
          <VerificacionAcceso onAccesoConcedido={handleAccesoConcedido} />
        )}

        {vistaActual === 'encuesta' && (
          <EncuestaForm
            onEncuestaFinalizada={(res) => {
              console.log('Encuesta guardada con éxito:', res);
            }}
            onVolverAInicio={() => setVistaActual('verificacion')}
          />
        )}

        {vistaActual === 'admin' && <GestorIntegracion />}
      </main>

      {/* Pie de página institucional */}
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
        © 2026 Universidad Católica Boliviana "San Pablo" · Proyecto de Grado en Ingeniería de Sistemas
      </footer>
    </div>
  );
}
