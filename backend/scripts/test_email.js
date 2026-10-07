require('dotenv').config();
const { enviarCertificadoGraduado } = require('../src/services/emailService');
const { generarCertificadoPDF } = require('../src/services/pdfService');

async function main() {
  const destinatario = process.argv[2] || process.env.SMTP_USER;

  if (!destinatario) {
    console.error('Error: Debes proporcionar un correo destino. Ejemplo:');
    console.error('node scripts/test_email.js tu_correo@gmail.com');
    process.exit(1);
  }

  console.log('--- Probando envío de correo USEI ---');
  console.log('Destinatario:', destinatario);
  console.log('SMTP_USER:', process.env.SMTP_USER || '(No configurado)');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '********' : '(No configurado)');

  const pdfBuffer = await generarCertificadoPDF({
    nro_certificado: 2216,
    nombre_completo: 'PRUEBA CERTIFICADO USEI',
    carrera: 'Ingeniería de Sistemas',
    fecha_emision: new Date(),
  });

  const resultado = await enviarCertificadoGraduado({
    destinatario,
    nombreCompleto: 'Estudiante de Prueba',
    nroCertificado: 2216,
    pdfBuffer,
  });

  if (resultado.exito) {
    console.log(' Correo enviado exitosamente. Revisa tu bandeja de entrada o spam.');
  } else {
    console.error(' Falló el envío:', resultado.error);
  }
}

main().catch(console.error);
