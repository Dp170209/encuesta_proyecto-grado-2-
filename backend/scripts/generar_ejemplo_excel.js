const xlsx = require('xlsx');
const path = require('path');

const datosEjemplo = [
  {
    Carnet: '8492012',
    Nombres: 'Juan Carlos',
    Apellidos: 'Pérez Ramos',
    Carrera: 'Ingeniería de Sistemas',
    Modalidad: 'Proyecto de Grado',
    Gestion: '2026-1'
  },
  {
    Carnet: '9381023',
    Nombres: 'María Elena',
    Apellidos: 'Gómez Flores',
    Carrera: 'Administración de Empresas',
    Modalidad: 'Tesis',
    Gestion: '2026-1'
  },
  {
    Carnet: '7281944',
    Nombres: 'Rodrigo',
    Apellidos: 'Mamani Quispe',
    Carrera: 'Ingeniería Industrial',
    Modalidad: 'Trabajo Dirigido',
    Gestion: '2026-1'
  },
  {
    Carnet: '6192840',
    Nombres: 'Camila Sofía',
    Apellidos: 'Vargas Torrico',
    Carrera: 'Derecho',
    Modalidad: 'Examen de Grado',
    Gestion: '2026-1'
  }
];

const worksheet = xlsx.utils.json_to_sheet(datosEjemplo);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Habilitados');

const outputPath = path.join(__dirname, 'plantilla_estudiantes_ejemplo.xlsx');
xlsx.writeFile(workbook, outputPath);

console.log(`Archivo Excel de prueba generado exitosamente en: ${outputPath}`);
