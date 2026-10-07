const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * Asegura la existencia de un administrador por defecto si la tabla está vacía
 */
async function seedDefaultAdmin() {
  try {
    const res = await db.query('SELECT COUNT(*) FROM administrador_usei');
    const total = parseInt(res.rows[0].count, 10);

    if (total === 0) {
      const email = 'admin@ucb.edu.bo';
      const passwordPlano = 'admin123';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(passwordPlano, salt);

      await db.query(
        `INSERT INTO administrador_usei (correo_institucional, password_hash, nombre_completo, estado_activo)
         VALUES ($1, $2, $3, true)`,
        [email, hash, 'Administrador General USEI']
      );

      console.log(`[SEED] Administrador USEI creado por defecto:`);
      console.log(`       Usuario: ${email}`);
      console.log(`       Password: ${passwordPlano}`);
    }
  } catch (error) {
    console.error('[SEED Error] Error al verificar/crear administrador por defecto:', error.message);
  }
}

module.exports = {
  seedDefaultAdmin,
};
