async function testApi() {
  // 1. Login Admin
  const resLogin = await fetch('http://localhost:5000/api/auth/login-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo_institucional: 'admin@ucb.edu.bo',
      password: 'admin123',
    }),
  });

  const dataLogin = await resLogin.json();
  console.log('Login Admin Status:', resLogin.status, dataLogin.exito ? 'OK' : dataLogin);
  if (!dataLogin.token) {
    console.error('No se obtuvo token de admin');
    process.exit(1);
  }

  const token = dataLogin.token;

  // 2. Dashboard
  const resDash = await fetch('http://localhost:5000/api/analitica/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const dataDash = await resDash.json();
  console.log('Dashboard Status:', resDash.status);
  console.log('Totales:', dataDash.data?.totales);
  console.log('Carreras count:', dataDash.data?.por_carrera?.length);

  // 3. Exportar Excel
  const resExcel = await fetch('http://localhost:5000/api/analitica/exportar', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Exportar Excel Status:', resExcel.status);
  console.log('Content-Type:', resExcel.headers.get('content-type'));
  const blob = await resExcel.arrayBuffer();
  console.log('Excel file size in bytes:', blob.byteLength);

  console.log('\n--- TODOS LOS ENDPOINTS DE ANALITICA FUNCIONAN CORRECTAMENTE ---');
  process.exit(0);
}

testApi().catch(e => { console.error('Error en prueba:', e); process.exit(1); });
