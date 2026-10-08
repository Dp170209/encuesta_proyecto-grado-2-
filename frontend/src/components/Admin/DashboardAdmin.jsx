import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { getDashboardAnalitica, descargarReporteExcel } from '../../services/adminApi';

// Registro de controladores y elementos de Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function DashboardAdmin() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [descargandoExcel, setDescargandoExcel] = useState(false);
  const [error, setError] = useState(null);
  const [filtroCarrera, setFiltroCarrera] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getDashboardAnalitica();
      setDatos(data);
      setUltimaActualizacion(new Date());
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor analítico.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleDescargarExcel = async () => {
    setDescargandoExcel(true);
    try {
      await descargarReporteExcel();
    } catch (err) {
      alert(`Error al descargar Excel: ${err.message}`);
    } finally {
      setDescargandoExcel(false);
    }
  };

  if (cargando && !datos) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#0e3d7a' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1s infinite' }}>⚙️</div>
        <h3 style={{ margin: 0, fontWeight: '700' }}>Cargando Indicadores de Inteligencia de Negocios...</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Consultando registros consolidados de Kardex y USEI en PostgreSQL
        </p>
      </div>
    );
  }

  const totales = datos?.totales || {
    total_habilitados: 0,
    encuestas_finalizadas: 0,
    brecha_pendientes: 0,
    tasa_respuesta_pct: 0,
  };

  const totalHabilitados = parseInt(totales.total_habilitados, 10);
  const totalFinalizadas = parseInt(totales.encuestas_finalizadas, 10);
  const brechaPendientes = parseInt(totales.brecha_pendientes, 10);
  const tasaPct = parseFloat(totales.tasa_respuesta_pct);

  // Filtrado de carreras
  const carrerasFiltradas = (datos?.por_carrera || []).filter((c) =>
    c.carrera.toLowerCase().includes(filtroCarrera.toLowerCase())
  );

  // =========================================================================
  // Configuración de Datos Gráficos
  // =========================================================================

  // 1. Gráfico Circular (Doughnut): Estado de Encuestas (Completadas vs Pendientes)
  const pieData = {
    labels: ['Encuestas Completadas', 'Pendientes de Llenado'],
    datasets: [
      {
        data: [totalFinalizadas, brechaPendientes],
        backgroundColor: ['#0e3d7a', '#f59e0b'],
        hoverBackgroundColor: ['#1d4ed8', '#d97706'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          font: { size: 12, weight: 'bold' },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const pct = totalHabilitados > 0 ? ((val / totalHabilitados) * 100).toFixed(1) : 0;
            return ` ${context.label}: ${val} graduados (${pct}%)`;
          },
        },
      },
    },
    cutout: '62%',
  };

  // 2. Gráfico de Barras: Distribución Kardex vs USEI por Carrera
  const barLabels = (datos?.por_carrera || []).slice(0, 8).map((c) => {
    // Acortar nombres largos si es necesario
    if (c.carrera.length > 20) return c.carrera.substring(0, 18) + '...';
    return c.carrera;
  });

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Inscritos Kardex (Meta)',
        data: (datos?.por_carrera || []).slice(0, 8).map((c) => parseInt(c.total_kardex, 10)),
        backgroundColor: 'rgba(148, 163, 184, 0.75)',
        borderColor: '#64748b',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Encuestas USEI (Logrado)',
        data: (datos?.por_carrera || []).slice(0, 8).map((c) => parseInt(c.encuestas_completadas, 10)),
        backgroundColor: '#0e3d7a',
        borderColor: '#0a2540',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 12, weight: 'bold' } },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw} graduados`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
        grid: { color: '#f1f5f9' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Barra superior de bienvenida y acciones */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📊</span>
              <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0a2540', margin: 0, letterSpacing: '-0.3px' }}>
                Tablero Analítico de Graduados · USEI
              </h1>
              <span
                style={{
                  backgroundColor: '#f59e0b',
                  color: '#0a2540',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}
              >
                BI Real-Time
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.82rem' }}>
              Monitoreo y Cobertura Frente al Padrón Oficial de Titulación · Actualizado a las{' '}
              {ultimaActualizacion.toLocaleTimeString('es-BO')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={cargarDatos}
            disabled={cargando}
            style={{
              backgroundColor: '#ffffff',
              color: '#0e3d7a',
              border: '1.5px solid #0e3d7a',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: cargando ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            🔄 Actualizar
          </button>

          <button
            onClick={handleDescargarExcel}
            disabled={descargandoExcel}
            style={{
              backgroundColor: descargandoExcel ? '#15803d' : '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: descargandoExcel ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            {descargandoExcel ? '⏳ Generando Excel...' : '📥 Exportar a Excel (.xlsx)'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #f87171',
            color: '#b91c1c',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* =====================================================================
          1. TARJETAS SUPERIORES DE RESUMEN (CARDS KPI)
          ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Total Habilitados */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '1.35rem',
            border: '1px solid #e2e8f0',
            borderTop: '4px solid #0e3d7a',
            boxShadow: '0 4px 12px rgba(10, 37, 64, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.7rem',
            }}
          >
            👥
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Total Habilitados
            </p>
            <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.85rem', fontWeight: '800', color: '#0a2540' }}>
              {totalHabilitados}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Padrón Kardex General</span>
          </div>
        </div>

        {/* Card 2: Encuestas Finalizadas */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '1.35rem',
            border: '1px solid #e2e8f0',
            borderTop: '4px solid #16a34a',
            boxShadow: '0 4px 12px rgba(10, 37, 64, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.7rem',
            }}
          >
            ✅
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Encuestas Finalizadas
            </p>
            <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.85rem', fontWeight: '800', color: '#16a34a' }}>
              {totalFinalizadas}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>Certificados Emitidos</span>
          </div>
        </div>

        {/* Card 3: Tasa de Respuesta */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '1.35rem',
            border: '1px solid #e2e8f0',
            borderTop: '4px solid #f59e0b',
            boxShadow: '0 4px 12px rgba(10, 37, 64, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#fef3c7',
              color: '#d97706',
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.7rem',
            }}
          >
            📈
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Tasa de Respuesta
            </p>
            <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.85rem', fontWeight: '800', color: '#0a2540' }}>
              {tasaPct}%
            </h3>
            <div
              style={{
                width: '100%',
                height: '7px',
                backgroundColor: '#e2e8f0',
                borderRadius: '999px',
                overflow: 'hidden',
                marginTop: '0.45rem',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, tasaPct))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0e3d7a 0%, #f59e0b 100%)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Brecha / Pendientes */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '1.35rem',
            border: '1px solid #e2e8f0',
            borderTop: '4px solid #dc2626',
            boxShadow: '0 4px 12px rgba(10, 37, 64, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.7rem',
            }}
          >
            ⏳
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Brecha (Pendientes)
            </p>
            <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.85rem', fontWeight: '800', color: '#dc2626' }}>
              {brechaPendientes}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Sin encuesta registrada</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. SECCIÓN DE GRÁFICOS DINÁMICOS (Chart.js)
          ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Gráfico 1: Estado de Encuestas (Pie / Donut) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
              Estado de Cobertura de Encuestas
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Proporción de estudiantes que completaron vs los que están pendientes
            </p>
          </div>
          <div style={{ flex: 1, minHeight: '260px', position: 'relative' }}>
            <Doughnut data={pieData} options={pieOptions} />
          </div>
        </div>

        {/* Gráfico 2: Distribución por Carrera (Bar Chart) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
              Distribución de Graduados por Carrera
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Comparativa de Meta en Kardex frente a Encuestas Registradas en USEI
            </p>
          </div>
          <div style={{ flex: 1, minHeight: '260px', position: 'relative' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. TABLA COMPARATIVA DE COBERTURA (Kardex vs USEI)
          ===================================================================== */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>
              Matriz Comparativa de Cobertura: Kardex vs. USEI
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Desglose detallado por carrera con cálculo de brecha de participación
            </p>
          </div>

          <div style={{ width: '280px' }}>
            <input
              type="text"
              placeholder="🔍 Filtrar por nombre de carrera..."
              value={filtroCarrera}
              onChange={(e) => setFiltroCarrera(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#0a2540', color: '#ffffff', borderBottom: '3px solid #f59e0b' }}>
                <th style={{ padding: '0.95rem 1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Carrera</th>
                <th style={{ padding: '0.95rem 1rem', fontWeight: '700', textAlign: 'center', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inscritos Kardex</th>
                <th style={{ padding: '0.95rem 1rem', fontWeight: '700', textAlign: 'center', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Encuestas USEI</th>
                <th style={{ padding: '0.95rem 1rem', fontWeight: '700', textAlign: 'center', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brecha (Pendientes)</th>
                <th style={{ padding: '0.95rem 1rem', fontWeight: '700', minWidth: '150px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tasa de Cobertura</th>
                <th style={{ padding: '0.95rem 1.25rem', fontWeight: '700', textAlign: 'center', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {carrerasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No se encontraron registros de carreras que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                carrerasFiltradas.map((c, idx) => {
                  const kardex = parseInt(c.total_kardex, 10);
                  const completadas = parseInt(c.encuestas_completadas, 10);
                  const brecha = parseInt(c.brecha_pendientes, 10);
                  const tasa = parseFloat(c.tasa_cobertura_pct);

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <td style={{ padding: '0.9rem 1.25rem', fontWeight: '600', color: '#0f172a' }}>
                        {c.carrera}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center', fontWeight: '700', color: '#475569' }}>
                        {kardex}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center', fontWeight: '700', color: '#0e3d7a' }}>
                        {completadas}
                      </td>
                      <td
                        style={{
                          padding: '0.9rem 1rem',
                          textAlign: 'center',
                          fontWeight: '700',
                          color: brecha > 0 ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {brecha}
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: '700', minWidth: '45px', color: '#334155' }}>{tasa}%</span>
                          <div
                            style={{
                              flex: 1,
                              height: '7px',
                              backgroundColor: '#e2e8f0',
                              borderRadius: '999px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, tasa)}%`,
                                height: '100%',
                                backgroundColor: tasa === 100 ? '#16a34a' : tasa >= 50 ? '#0e3d7a' : '#f59e0b',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'center' }}>
                        {tasa === 100 ? (
                          <span
                            style={{
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                            }}
                          >
                            Completo
                          </span>
                        ) : tasa > 0 ? (
                          <span
                            style={{
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                            }}
                          >
                            En Proceso
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                            }}
                          >
                            Sin Iniciar
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Pie de tabla con totales */}
            <tfoot>
              <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '800', color: '#0f172a', borderTop: '2px solid #cbd5e1' }}>
                <td style={{ padding: '0.95rem 1.25rem' }}>TOTAL CONSOLIDADO GENERAL</td>
                <td style={{ padding: '0.95rem 1rem', textAlign: 'center' }}>{totalHabilitados}</td>
                <td style={{ padding: '0.95rem 1rem', textAlign: 'center', color: '#0e3d7a' }}>{totalFinalizadas}</td>
                <td style={{ padding: '0.95rem 1rem', textAlign: 'center', color: '#dc2626' }}>{brechaPendientes}</td>
                <td style={{ padding: '0.95rem 1rem' }}>{tasaPct}% Cobertura</td>
                <td style={{ padding: '0.95rem 1.25rem', textAlign: 'center' }}>
                  {tasaPct >= 80 ? '⭐ Óptimo' : '📊 En Seguimiento'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
