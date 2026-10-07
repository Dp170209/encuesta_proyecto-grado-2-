const db = require('../src/config/db');

async function testQuery() {
  const qCarreras = `
    SELECT 
      eh.carrera,
      COUNT(*) AS total_kardex,
      COUNT(re.id_respuesta) AS encuestas_completadas,
      COUNT(*) - COUNT(re.id_respuesta) AS brecha_pendientes,
      CASE 
        WHEN COUNT(*) > 0 THEN ROUND((COUNT(re.id_respuesta)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
        ELSE 0 
      END AS tasa_cobertura_pct
    FROM estudiantes_habilitados eh
    LEFT JOIN graduado g ON LOWER(TRIM(eh.carnet_identidad)) = LOWER(TRIM(g.carnet_identidad))
    LEFT JOIN respuesta_encuesta re ON g.id_graduado = re.id_graduado
    GROUP BY eh.carrera
    ORDER BY total_kardex DESC, eh.carrera ASC;
  `;
  const res = await db.query(qCarreras);
  console.log('Resultados por carrera:', res.rows.slice(0, 5));

  const qTotales = `
    SELECT 
      COUNT(*) AS total_habilitados,
      COUNT(re.id_respuesta) AS encuestas_finalizadas,
      COUNT(*) - COUNT(re.id_respuesta) AS brecha_pendientes,
      CASE 
        WHEN COUNT(*) > 0 THEN ROUND((COUNT(re.id_respuesta)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
        ELSE 0 
      END AS tasa_respuesta_pct
    FROM estudiantes_habilitados eh
    LEFT JOIN graduado g ON LOWER(TRIM(eh.carnet_identidad)) = LOWER(TRIM(g.carnet_identidad))
    LEFT JOIN respuesta_encuesta re ON g.id_graduado = re.id_graduado;
  `;
  const resTotales = await db.query(qTotales);
  console.log('Totales generales:', resTotales.rows[0]);

  process.exit(0);
}

testQuery().catch(e => { console.error(e); process.exit(1); });
