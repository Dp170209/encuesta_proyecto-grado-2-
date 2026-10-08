import React, { useState } from 'react';
import { loginAdmin } from '../../services/adminApi';

export default function LoginAdminModal({ isOpen, onClose, onLoginExitoso }) {
  const [correo, setCorreo] = useState('admin@ucb.edu.bo');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await loginAdmin({
        correo_institucional: correo,
        password,
      });
      setCargando(false);
      onLoginExitoso(res.admin);
      onClose();
    } catch (err) {
      setCargando(false);
      setError(err.message || 'Error al autenticar administrador.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          borderTop: '4px solid #f59e0b',
        }}
      >
        {/* Cabecera del modal con logotipos oficiales */}
        <div
          style={{
            background: 'linear-gradient(145deg, #0a2540 0%, #0e3d7a 100%)',
            color: '#ffffff',
            padding: '1.4rem 1.5rem',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🔐</span>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#cbd5e1',
                fontSize: '1.1rem',
                cursor: 'pointer',
                padding: '0.3rem 0.5rem',
                borderRadius: '6px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          <div>
            <span
              style={{
                backgroundColor: '#f59e0b',
                color: '#0a2540',
                fontSize: '0.68rem',
                fontWeight: '800',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '0.35rem',
              }}
            >
              Módulo Administrativo
            </span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc' }}>
              Portal de Gestión y Analítica USEI
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#93c5fd' }}>
              Autenticación oficial para personal autorizado de la U.C.B.
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                color: '#b91c1c',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '0.35rem',
              }}
            >
              Correo Institucional (@ucb.edu.bo):
            </label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ejemplo@ucb.edu.bo"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '0.35rem',
              }}
            >
              Contraseña:
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: '#64748b' }}>
              💡 Credencial inicial del sistema: <code>admin@ucb.edu.bo</code> / <code>admin123</code>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={cargando}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '0.6rem 1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              style={{
                background: cargando ? '#94a3b8' : 'linear-gradient(145deg, #0e3d7a 0%, #0a2540 100%)',
                color: '#ffffff',
                border: 'none',
                borderBottom: '2px solid #f59e0b',
                padding: '0.65rem 1.4rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: '700',
                cursor: cargando ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 8px rgba(10, 37, 64, 0.25)',
                transition: 'all 0.2s',
              }}
            >
              {cargando ? '⏳ Verificando...' : '🔒 Ingresar al Panel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
