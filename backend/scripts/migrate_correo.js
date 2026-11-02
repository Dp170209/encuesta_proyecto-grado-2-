const db = require('../src/config/db');

async function migrate() {
  try {
    await db.query('ALTER TABLE estudiantes_habilitados ADD COLUMN IF NOT EXISTS correo_institucional VARCHAR(150);');
    console.log('Columna correo_institucional agregada o ya existente.');

    // Asignar correos institucionales de ejemplo a quienes no tengan
    await db.query(`
      UPDATE estudiantes_habilitados 
      SET correo_institucional = LOWER(REPLACE(TRIM(nombres), ' ', '.')) || '.' || LOWER(SPLIT_PART(TRIM(apellidos), ' ', 1)) || '@ucb.edu.bo'
      WHERE correo_institucional IS NULL;
    `);
    console.log('Estudiantes actualizados con correo institucional.');
    process.exit(0);
  } catch (error) {
    console.error('Error en migración:', error);
    process.exit(1);
  }
}

migrate();
