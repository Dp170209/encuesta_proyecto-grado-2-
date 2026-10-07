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
          borderRadius: '12px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Cabecera del modal */}
        <div
          style={{
            backgroundColor: '#0a2540',
            color: '#ffffff',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🔐</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                Acceso Administrativo USEI
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                Módulo exclusivo para personal autorizado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.2rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
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
                backgroundColor: cargando ? '#94a3b8' : '#0e3d7a',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.25rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: cargando ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {cargando ? 'Verificando...' : 'Entrar al Panel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
