const fs = require('fs');
const path = require('path');
const { generarCertificadoPDF } = require('../src/services/pdfService');

async function main() {
  const buffer = await generarCertificadoPDF({
    nro_certificado: 2216,
    nombre_completo: 'RODRIGO STEVEN ZALLES GONZALES',
    carrera: 'Ingeniería Industrial',
    fecha_emision: '2023-07-31T20:04:00',
  });

  const outPath = path.join(__dirname, 'test_certificado.pdf');
  fs.writeFileSync(outPath, buffer);
  console.log('Certificado generado con exito en:', outPath);
}

main().catch(console.error);
