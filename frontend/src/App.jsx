import React, { useState } from 'react';
import GestorIntegracion from './components/GestorIntegracion/GestorIntegracion';
import VerificacionAcceso from './components/VerificacionAcceso/VerificacionAcceso';

export default function App() {
  const [vistaActual, setVistaActual] = useState('graduado'); // 'graduado' o 'admin'
  const [sesionGraduado, setSesionGraduado] = useState(null);

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

        {/* Selector de Vistas / Roles para navegación del Sprint 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setVistaActual('graduado')}
            style={{
              backgroundColor: vistaActual === 'graduado' ? '#0e3d7a' : 'transparent',
              color: '#ffffff',
              border: vistaActual === 'graduado' ? '1.5px solid #38bdf8' : '1px solid #475569',
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🎓 Portal Graduado (HU-02)
          </button>

          <button
            onClick={() => setVistaActual('admin')}
            style={{
              backgroundColor: vistaActual === 'admin' ? '#0e3d7a' : 'transparent',
              color: '#ffffff',
              border: vistaActual === 'admin' ? '1.5px solid #38bdf8' : '1px solid #475569',
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📊 Gestor ETL Admin (HU-01)
          </button>
        </div>
      </header>

      {/* Contenido principal según la vista seleccionada */}
      <main style={{ flex: 1 }}>
        {vistaActual === 'graduado' ? (
          <VerificacionAcceso
            onAccesoConcedido={(res) => {
              setSesionGraduado(res.graduado);
            }}
          />
        ) : (
          <GestorIntegracion />
        )}
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
