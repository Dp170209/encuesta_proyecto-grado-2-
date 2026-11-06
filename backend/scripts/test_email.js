require('dotenv').config();
const { enviarCertificadoGraduado } = require('../src/services/emailService');
const { generarCertificadoPDF } = require('../src/services/pdfService');

async function main() {
  const destinatario = process.argv[2] || 'jaredpitiu1709@gmail.com';
  // Genera un número correlativo dinámico para que Gmail no agrupe el correo como repetido
  const nroCertificado = parseInt(process.argv[3], 10) || Math.floor((Date.now() % 100000));

  console.log('--- Enviando Certificado Oficial Real a la cuenta del graduado ---');
  console.log('Destinatario:', destinatario);
  console.log('N° Certificado emitido:', nroCertificado);
  console.log('Remitente SMTP:', process.env.SMTP_USER);

  const pdfBuffer = await generarCertificadoPDF({
    nro_certificado: nroCertificado,
    nombre_completo: 'JARED PIMENTEL',
    carnet_identidad: '8492041',
    carrera: 'Ingeniería de Sistemas',
    fecha_emision: new Date(),
  });

  const resultado = await enviarCertificadoGraduado({
    destinatario,
    nombreCompleto: 'Jared Pimentel',
    nroCertificado: nroCertificado,
    pdfBuffer,
    carrera: 'Ingeniería de Sistemas',
    urlWhatsapp: 'https://chat.whatsapp.com/J8Vd17pM6fT05zQ8sF9uX1',
  });

  if (resultado.exito) {
    console.log(`✓ Correo con Certificado Oficial PDF (N° ${nroCertificado}) enviado exitosamente a: ${destinatario}`);
    console.log('Message ID:', resultado.messageId);
  } else {
    console.error('✗ Falló el envío:', resultado.error);
  }
}

main().catch(console.error);
