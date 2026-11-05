// Mock estricto de nodemailer para interceptar envíos SMTP reales
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'mocked-smtp-message-12345',
      response: '250 OK: Message accepted',
    }),
  }),
}));

// Mock estricto de pdfkit para interceptar la compilación gráfica sin tocar disco
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
    image: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    strokeColor: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    lineWidth: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    polygon: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    on: jest.fn(function (event, callback) {
      if (event === 'data') callback(Buffer.from('%PDF-1.4 Mocked Certificate Stream'));
      if (event === 'end') callback();
      return this;
    }),
    end: jest.fn(),
    page: { width: 792, height: 612 },
  }));
});

const request = require('supertest');
const jwt = require('jsonwebtoken');
const xlsx = require('xlsx');
const app = require('../src/server');
const db = require('../src/config/db');
const authService = require('../src/services/authService');

const JWT_SECRET = process.env.JWT_SECRET || 'usei_ucb_secret_key_2026_jwt_token';

describe('BATERÍA DE PRUEBAS FUNCIONALES - SISTEMA USEI UCB', () => {

  describe('1. Pruebas Unitarias y de Seguridad (Backend)', () => {

    // TEST 1: CPS-01
    it('Test 1 (CPS-01): Validar que la función de restricción de dominio rechace cualquier correo que termine en @ucb.edu.bo', async () => {
      const correoInvalido = 'juan.perez@ucb.edu.bo';
      const correoSubdominio = 'estudiante@lpz.ucb.edu.bo';

      await expect(authService.validarCorreoPrivado(correoInvalido))
        .rejects
        .toThrow(/No se permiten correos académicos/i);

      await expect(authService.validarCorreoPrivado(correoSubdominio))
        .rejects
        .toThrow(/No se permiten correos académicos/i);
    });

    // TEST 2: CPS-02
    it('Test 2 (CPS-02): Verificación de Graduado con Supertest (/api/auth/verificar-graduado)', async () => {
      const spyVerificar = jest.spyOn(authService, 'verificarGraduado').mockImplementation(async ({ carnet_identidad }) => {
        if (carnet_identidad === '9999999') {
          throw new Error('El número de carnet no se encuentra registrado en el padrón oficial.');
        }
        return {
          exito: true,
          mensaje: 'Identidad verificada exitosamente.',
          token: jwt.sign({ id_graduado: 1, carnet_identidad: '123456' }, JWT_SECRET, { expiresIn: '2h' }),
          graduado: {
            id_graduado: 1,
            carnet_identidad: '123456',
            nombres: 'Juan',
            apellidos: 'Perez',
            carrera: 'Ingeniería de Sistemas',
          },
        };
      });

      // Carnet Falso -> 400
      const resFalso = await request(app)
        .post('/api/auth/verificar-graduado')
        .send({
          carnet_identidad: '9999999',
          nombre_completo: 'Usuario Falso',
          correo_privado: 'falso@gmail.com',
        });

      expect(resFalso.statusCode).toBe(400);
      expect(resFalso.body.exito).toBe(false);
      expect(resFalso.body.error).toMatch(/no se encuentra registrado/i);

      // Carnet Válido -> 200 y Token JWT
      const resValido = await request(app)
        .post('/api/auth/verificar-graduado')
        .send({
          carnet_identidad: '123456',
          nombre_completo: 'Juan Perez',
          correo_privado: 'juan@gmail.com',
        });

      expect(resValido.statusCode).toBe(200);
      expect(resValido.body.exito).toBe(true);
      expect(resValido.body.token).toBeDefined();

      spyVerificar.mockRestore();
    });

  });

  describe('2. Pruebas de Integración (Backend)', () => {

    // TEST 3: CPS-04
    it('Test 3 (CPS-04): Simulación de petición al endpoint /api/encuesta/guardar con JWT simulado', async () => {
      const tokenSimulado = jwt.sign(
        {
          id_graduado: 45,
          carnet_identidad: '8492041',
          nombres: 'Juan',
          apellidos: 'Perez',
          carrera: 'Ingeniería de Sistemas',
          correo_privado: 'juan.perez@gmail.com'
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const mockClient = {
        query: jest.fn().mockImplementation((queryText) => {
          const sql = String(queryText).toUpperCase();
          if (sql.includes('SELECT ID_RESPUESTA FROM RESPUESTA_ENCUESTA')) return { rows: [] };
          if (sql.includes('INSERT INTO RESPUESTA_ENCUESTA')) {
            return {
              rows: [{
                id_respuesta: 10,
                id_graduado: 45,
                tipo_encuesta: 'A tiempo de graduación',
                gestion_academica: 2026,
                fecha_registro: new Date()
              }]
            };
          }
          if (sql.includes('INSERT INTO CERTIFICADOS_EMITIDOS')) {
            return {
              rows: [{
                nro_certificado: 105,
                fecha_emision: new Date(),
                ruta_archivo_pdf: 'CERT_USEI_2026_45.pdf'
              }]
            };
          }
          return { rows: [] };
        }),
        release: jest.fn(),
      };

      const spyConnect = jest.spyOn(db.pool, 'connect').mockResolvedValue(mockClient);

      const payloadFalso = {
        contenido_json: {
          S1P01_Carrera: 'Ingeniería de Sistemas',
          S2P01_EstadoCivil: 'Soltero/a',
          S3P01_MotivoEleccionCarrera: 'Vocación o habilidades',
          S4P09_0_VolveriaEstudiar: 'Sí',
          S5P01_ActividadActual: 'Trabajo actualmente',
        },
        gestion_academica: 2026,
      };

      const response = await request(app)
        .post('/api/encuesta/guardar')
        .set('Authorization', `Bearer ${tokenSimulado}`)
        .send(payloadFalso);

      expect(response.statusCode).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.nro_certificado).toBe(105);

      spyConnect.mockRestore();
    });

    // TEST 4: CPS-05
    it('Test 4 (CPS-05): Módulo de Emisión y Despacho Asíncrono - HTTP 200 y Redirección a WhatsApp (HU-04)', async () => {
      const tokenEstudiante = jwt.sign(
        {
          id_graduado: 88,
          carnet_identidad: '5987123',
          nombres: 'María',
          apellidos: 'Gómez',
          carrera: 'Ingeniería de Sistemas',
          correo_privado: 'maria.gomez@gmail.com'
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const mockClient = {
        query: jest.fn().mockImplementation((queryText) => {
          const sql = String(queryText).toUpperCase();
          if (sql.includes('SELECT ID_RESPUESTA FROM RESPUESTA_ENCUESTA')) return { rows: [] };
          if (sql.includes('INSERT INTO RESPUESTA_ENCUESTA')) {
            return {
              rows: [{
                id_respuesta: 25,
                id_graduado: 88,
                tipo_encuesta: 'A tiempo de graduación',
                gestion_academica: 2026,
                fecha_registro: new Date()
              }]
            };
          }
          if (sql.includes('INSERT INTO CERTIFICADOS_EMITIDOS')) {
            return {
              rows: [{
                nro_certificado: 204,
                fecha_emision: new Date(),
                ruta_archivo_pdf: 'CERT_USEI_2026_88.pdf'
              }]
            };
          }
          return { rows: [] };
        }),
        release: jest.fn(),
      };

      const spyConnect = jest.spyOn(db.pool, 'connect').mockResolvedValue(mockClient);

      const response = await request(app)
        .post('/api/encuesta/guardar')
        .set('Authorization', `Bearer ${tokenEstudiante}`)
        .send({
          contenido_json: {
            S1P01_Carrera: 'Ingeniería de Sistemas',
            S4P09_0_VolveriaEstudiar: 'Sí',
            S5P01_ActividadActual: 'Trabajo actualmente'
          },
          gestion_academica: 2026
        });

      // Verificación de respuesta HTTP 200
      expect(response.statusCode).toBe(200);
      expect(response.body.exito).toBe(true);

      // Verificación de la pasarela de redirección al grupo de WhatsApp oficial de la carrera
      const urlWhatsapp = response.body.url_whatsapp || (response.body.data && response.body.data.url_whatsapp);
      expect(urlWhatsapp).toBeDefined();
      expect(urlWhatsapp).toMatch(/^https:\/\/chat\.whatsapp\.com\//);

      spyConnect.mockRestore();
    });

  });

  describe('3. Pruebas de Sistema - Motor Analítico (Backend)', () => {

    const adminToken = jwt.sign(
      {
        id_admin: 1,
        rol: 'ADMIN',
        nombre_completo: 'Lic. Administrador USEI',
        correo_institucional: 'admin.usei@ucb.edu.bo'
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // TEST 5: CPS-06 (Parte 1 - KPIs)
    it('Test 5 (CPS-06 - KPIs): Petición GET a /api/analitica/dashboard - HTTP 200 y nodos numéricos de seguimiento', async () => {
      const spyDbQuery = jest.spyOn(db, 'query').mockImplementation(async (sql) => {
        const q = String(sql).toUpperCase();
        if (q.includes('TASA_RESPUESTA_PCT') || q.includes('ESTUDIANTES_HABILITADOS')) {
          return {
            rows: [{
              total_habilitados: '150',
              encuestas_finalizadas: '120',
              brecha_pendientes: '30',
              tasa_respuesta_pct: '80.0',
            }],
          };
        }
        if (q.includes('GROUP BY EH.CARRERA')) {
          return {
            rows: [
              { carrera: 'Ingeniería de Sistemas', total_kardex: '50', encuestas_completadas: '45', brecha_pendientes: '5', tasa_cobertura_pct: '90.0' },
            ],
          };
        }
        if (q.includes('GROUP BY EH.GESTION_SEMESTRE')) {
          return {
            rows: [
              { gestion_semestre: '2026-1', total_kardex: '150', encuestas_completadas: '120', brecha_pendientes: '30', tasa_cobertura_pct: '80.0' },
            ],
          };
        }
        return { rows: [] };
      });

      const response = await request(app)
        .get('/api/analitica/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.exito).toBe(true);

      const totales = response.body.totales || (response.body.data && response.body.data.totales) || response.body;
      expect(totales.total_habilitados).toBeDefined();
      expect(totales.encuestas_finalizadas).toBeDefined();
      expect(totales.tasa_respuesta_pct).toBeDefined();

      expect(Number(totales.total_habilitados)).toBeGreaterThanOrEqual(0);
      expect(Number(totales.encuestas_finalizadas)).toBeGreaterThanOrEqual(0);
      expect(Number(totales.tasa_respuesta_pct)).toBeGreaterThanOrEqual(0);

      spyDbQuery.mockRestore();
    });

    // TEST 6: CPS-06 (Parte 2 - Exportación ETL)
    it('Test 6 (CPS-06 - ETL): Petición GET a /api/analitica/exportar - HTTP 200 y Content-Type Excel (.xlsx)', async () => {
      const spyDbQuery = jest.spyOn(db, 'query').mockImplementation(async (sql) => {
        const q = String(sql).toUpperCase();
        if (q.includes('TASA_RESPUESTA_PCT') || q.includes('ESTUDIANTES_HABILITADOS')) {
          return {
            rows: [{
              total_habilitados: '150',
              encuestas_finalizadas: '120',
              brecha_pendientes: '30',
              tasa_respuesta_pct: '80.0',
            }],
          };
        }
        if (q.includes('GROUP BY EH.CARRERA')) {
          return {
            rows: [
              { carrera: 'Ingeniería de Sistemas', total_kardex: '50', encuestas_completadas: '45', brecha_pendientes: '5', tasa_cobertura_pct: '90.0' },
            ],
          };
        }
        if (q.includes('ESTADO_ENCUESTA')) {
          return {
            rows: [
              {
                carnet_identidad: '8492041',
                nombres: 'Juan',
                apellidos: 'Perez',
                carrera: 'Ingeniería de Sistemas',
                modalidad_titulacion: 'Proyecto de Grado',
                gestion_semestre: '2026-1',
                correo_privado: 'juan.perez@gmail.com',
                fecha_registro: new Date(),
                estado_encuesta: 'COMPLETADA',
              },
            ],
          };
        }
        return { rows: [] };
      });

      const response = await request(app)
        .get('/api/analitica/exportar')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/(vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|octet-stream)/);
      expect(response.body).toBeDefined();

      spyDbQuery.mockRestore();
    });

  });

  describe('4. Pruebas de Regresión - Módulo ETL de Padrón Kardex (HU-01)', () => {

    const adminToken = jwt.sign(
      {
        id_admin: 1,
        rol: 'ADMIN',
        nombre_completo: 'Lic. Administrador USEI',
        correo_institucional: 'admin.usei@ucb.edu.bo'
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // TEST 7: REGRESIÓN ETL (HU-01)
    it('Test 7 (Regresión ETL): Procesamiento de buffer Excel en /api/etl/cargar-habilitados con librerías integradas', async () => {
      // 1. Construcción dinámica de un archivo Excel .xlsx válido en memoria (SheetJS)
      const wb = xlsx.utils.book_new();
      const wsData = [
        ['Carnet', 'Nombres', 'Apellidos', 'Carrera', 'Modalidad', 'Gestion'],
        ['8492041', 'Juan Carlos', 'Perez Rodriguez', 'Ingeniería de Sistemas', 'Proyecto de Grado', '2026-1'],
        ['7462819', 'Ana Maria', 'Guzman Rios', 'Administración de Empresas', 'Examen de Grado', '2026-1'],
      ];
      const ws = xlsx.utils.aoa_to_sheet(wsData);
      xlsx.utils.book_append_sheet(wb, ws, 'Habilitados_Kardex');
      const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // 2. Mock de la conexión transaccional a la base de datos PostgreSQL
      const mockClient = {
        query: jest.fn().mockImplementation((queryText) => {
          const sql = String(queryText).toUpperCase();
          if (sql.includes('SELECT CARNET_IDENTIDAD FROM ESTUDIANTES_HABILITADOS')) {
            return { rows: [] }; // Ningún carnet duplicado previamente
          }
          if (sql.includes('INSERT INTO ESTUDIANTES_HABILITADOS')) {
            return { rows: [{ id_habilitado: 1 }] };
          }
          return { rows: [] };
        }),
        release: jest.fn(),
      };

      const spyConnect = jest.spyOn(db.pool, 'connect').mockResolvedValue(mockClient);

      // 3. Envío de la petición multipart/form-data con Supertest
      const response = await request(app)
        .post('/api/etl/cargar-habilitados')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('archivo', excelBuffer, {
          filename: 'padron_kardex_2026.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .field('gestion_semestre', '2026-1');

      // 4. Aserciones de verificación de regresión
      expect(response.statusCode).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.resumen).toBeDefined();
      expect(response.body.resumen.total_filas_procesadas).toBe(2);
      expect(response.body.resumen.insertados).toBe(2);

      spyConnect.mockRestore();
    });

  });

});
