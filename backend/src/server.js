const express = require('express');
const cors = require('cors');
require('dotenv').config();

const etlRoutes = require('./routes/etlRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/etl', etlRoutes);

// Endpoint de verificación de salud (Health Check)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'USEI API Backend' });
});

// Middleware centralizado para manejo de errores de Multer y del sistema
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        exito: false,
        error: 'El archivo excede el tamaño máximo permitido de 15 MB.',
      });
    }
    return res.status(400).json({
      exito: false,
      error: `Error de subida de archivo: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      exito: false,
      error: err.message || 'Error interno del servidor.',
    });
  }

  next();
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Servidor Backend USEI activo en puerto ${PORT}`);
  console.log(` Endpoint ETL: http://localhost:${PORT}/api/etl/cargar-habilitados`);
  console.log(`===============================================`);
});

module.exports = app;
