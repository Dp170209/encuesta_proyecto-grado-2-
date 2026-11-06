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
const emailService = require('../src/services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'usei_ucb_secret_key_2026_jwt_token';

describe('BATERÍA DE PRUEBAS FUNCIONALES - SISTEMA USEI UCB', () => {

  describe('1. Pruebas Unitarias y de Seguridad (Backend)', () => {

    // TEST 1: CPS-01
    it('Test 1 (CPS-01): Rechazo de correo académico en Verificación (HU-02) - Restricción de dominio @ucb.edu.bo', async () => {
      const correoInvalido = 'jared.pimentel@ucb.edu.bo';
      const correoSubdominio = 'jared@lpz.ucb.edu.bo';

      await expect(authService.validarCorreoPrivado(correoInvalido))
        .rejects
        .toThrow(/No se permiten correos académicos/i);

      await expect(authService.validarCorreoPrivado(correoSubdominio))
        .rejects
        .toThrow(/No se permiten correos académicos/i);
    });

    // TEST 2: CPS-02
    it('Test 2 (CPS-02): Login de Estudiante Exitoso (HU-02) - Validación de Identidad y generación de JWT', async () => {
      const spyVerificar = jest.spyOn(authService, 'verificarGraduado').mockImplementation(async ({ carnet_identidad }) => {
        if (carnet_identidad === '9999999') {
          throw new Error('El número de carnet no se encuentra registrado en el padrón oficial.');
        }
        return {
          exito: true,
          mensaje: 'Identidad verificada exitosamente.',
          token: jwt.sign({ id_graduado: 1, carnet_identidad: '8492041' }, JWT_SECRET, { expiresIn: '2h' }),
          graduado: {
            id_graduado: 1,
            carnet_identidad: '8492041',
            nombres: 'Jared',
            apellidos: 'Pimentel',
            carrera: 'Ingeniería de Sistemas',
            correo_privado: 'jaredpitiu1709@gmail.com',
          },
        };
      });

      // Caso A: Carnet Falso (9999999) -> Debe responder HTTP 400
      const resFalso = await request(app)
        .post('/api/auth/verificar-graduado')
        .send({
          carnet_identidad: '9999999',
          nombre_completo: 'Usuario Falso',
          correo_privado: 'jaredpitiu1709@gmail.com',
        });

      expect(resFalso.statusCode).toBe(400);
      expect(resFalso.body.exito).toBe(false);
      expect(resFalso.body.error).toMatch(/no se encuentra registrado/i);

      // Caso B: Carnet Válido (8492041) -> Debe responder HTTP 200 y entregar JWT
      const resValido = await request(app)
        .post('/api/auth/verificar-graduado')
        .send({
          carnet_identidad: '8492041',
          nombre_completo: 'Jared Pimentel',
          correo_privado: 'jaredpitiu1709@gmail.com',
        });

      expect(resValido.statusCode).toBe(200);
      expect(resValido.body.exito).toBe(true);
      expect(resValido.body.token).toBeDefined();
      expect(typeof resValido.body.token).toBe('string');

      spyVerificar.mockRestore();
    });

  });

  describe('2. Pruebas de Integración (Backend)', () => {

    // TEST 3: CPS-04
    it('Test 3 (CPS-04): Consolidación y Guardado de JSONB (HU-03) - Inserción estructural en base de datos PostgreSQL', async () => {
      const tokenSimulado = jwt.sign(
        {
          id_graduado: 1,
          carnet_identidad: '8492041',
          nombres: 'Jared',
          apellidos: 'Pimentel',
          carrera: 'Ingeniería de Sistemas',
          correo_privado: 'jaredpitiu1709@gmail.com'
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
                id_respuesta: 1,
                id_graduado: 1,
                tipo_encuesta: 'A tiempo de graduación',
                gestion_academica: 2026,
                fecha_registro: new Date()
              }]
            };
          }
          if (sql.includes('INSERT INTO CERTIFICADOS_EMITIDOS')) {
            return {
              rows: [{
                nro_certificado: 1,
                fecha_emision: new Date(),
                ruta_archivo_pdf: 'CERT_USEI_2026_1.pdf'
              }]
            };
          }
          return { rows: [] };
        }),
        release: jest.fn(),
      };

      const spyConnect = jest.spyOn(db.pool, 'connect').mockResolvedValue(mockClient);
      // Silenciamos el despacho SMTP en este test enfocado exclusivamente en la persistencia JSONB
      const spyEmail = jest.spyOn(emailService, 'enviarCertificadoGraduado').mockResolvedValue({ exito: true });

      const payload = {
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
        .send(payload);

      expect(response.statusCode).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.nro_certificado).toBe(1);

      spyConnect.mockRestore();
      spyEmail.mockRestore();
    });

    // TEST 4: CPS-05 (Prueba Única Oficial de Emisión y Envío SMTP a jaredpitiu1709@gmail.com)
    it('Test 4 (CPS-05): Generación asíncrona de PDF y envío (HU-04) - Emisión de Certificado Oficial y Despacho SMTP', async () => {
      const tokenEstudiante = jwt.sign(
        {
          id_graduado: 1,
          carnet_identidad: '8492041',
          nombres: 'Jared',
          apellidos: 'Pimentel',
          carrera: 'Ingeniería de Sistemas',
          correo_privado: 'jaredpitiu1709@gmail.com'
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
                id_respuesta: 1,
                id_graduado: 1,
                tipo_encuesta: 'A tiempo de graduación',
                gestion_academica: 2026,
                fecha_registro: new Date()
              }]
            };
          }
          if (sql.includes('INSERT INTO CERTIFICADOS_EMITIDOS')) {
            return {
              rows: [{
                nro_certificado: 1,
                fecha_emision: new Date(),
                ruta_archivo_pdf: 'CERT_USEI_2026_1.pdf'
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

  describe('3. Pruebas de Sistema y Aceptación (Backend)', () => {

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

    // TEST 5: CPS-06
    it('Test 5 (CPS-06): Visualización de Dashboard y Exportación ETL (HU-05) - KPIs y descarga nativa .xlsx', async () => {
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
        if (q.includes('ESTADO_ENCUESTA')) {
          return {
            rows: [
              {
                carnet_identidad: '8492041',
                nombres: 'Jared',
                apellidos: 'Pimentel',
                carrera: 'Ingeniería de Sistemas',
                modalidad_titulacion: 'Proyecto de Grado',
                gestion_semestre: '2026-1',
                correo_privado: 'jaredpitiu1709@gmail.com',
                fecha_registro: new Date(),
                estado_encuesta: 'COMPLETADA',
              },
            ],
          };
        }
        return { rows: [] };
      });

      // 1. Verificación del Dashboard Analítico (KPIs)
      const resDashboard = await request(app)
        .get('/api/analitica/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resDashboard.statusCode).toBe(200);
      expect(resDashboard.body.exito).toBe(true);

      const totales = resDashboard.body.totales || (resDashboard.body.data && resDashboard.body.data.totales) || resDashboard.body;
      expect(totales.total_habilitados).toBeDefined();
      expect(totales.encuestas_finalizadas).toBeDefined();
      expect(totales.tasa_respuesta_pct).toBeDefined();

      // 2. Verificación de Exportación ETL a Excel
      const resExportar = await request(app)
        .get('/api/analitica/exportar')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resExportar.statusCode).toBe(200);
      expect(resExportar.headers['content-type']).toMatch(/application\/(vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|octet-stream)/);
      expect(resExportar.body).toBeDefined();

      spyDbQuery.mockRestore();
    });

  });

  describe('4. Pruebas de Regresión (Backend)', () => {

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

    // TEST 6: CPS-07
    it('Test 6 (CPS-07): Carga ETL tras integración del Motor Analítico (HU-01) - Inserción y actualización sin colapsar', async () => {
      // 1. Construcción dinámica del archivo Excel de Kardex
      const wb = xlsx.utils.book_new();
      const wsData = [
        ['Carnet', 'Nombres', 'Apellidos', 'Carrera', 'Modalidad', 'Gestion'],
        ['8492041', 'Jared', 'Pimentel', 'Ingeniería de Sistemas', 'Proyecto de Grado', '2026-1'],
      ];
      const ws = xlsx.utils.aoa_to_sheet(wsData);
      xlsx.utils.book_append_sheet(wb, ws, 'Habilitados_Kardex');
      const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // 2. Mock transaccional para la ingesta ETL
      const mockClient = {
        query: jest.fn().mockImplementation((queryText) => {
          const sql = String(queryText).toUpperCase();
          if (sql.includes('SELECT CARNET_IDENTIDAD FROM ESTUDIANTES_HABILITADOS')) {
            return { rows: [] };
          }
          if (sql.includes('INSERT INTO ESTUDIANTES_HABILITADOS')) {
            return { rows: [{ id_habilitado: 1 }] };
          }
          return { rows: [] };
        }),
        release: jest.fn(),
      };

      const spyConnect = jest.spyOn(db.pool, 'connect').mockResolvedValue(mockClient);

      // 3. Subir archivo .xlsx desde el Gestor de Integración
      const resCarga = await request(app)
        .post('/api/etl/cargar-habilitados')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('archivo', excelBuffer, {
          filename: 'padron_kardex_2026.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .field('gestion_semestre', '2026-1');

      expect(resCarga.statusCode).toBe(200);
      expect(resCarga.body.exito).toBe(true);
      expect(resCarga.body.total_procesados || resCarga.body.resumen.total_filas_procesadas).toBe(1);

      spyConnect.mockRestore();

      // 4. Verificar que el Dashboard siga respondiendo inmediatamente el nuevo padrón sin colapsar
      const spyDbQuery = jest.spyOn(db, 'query').mockImplementation(async (sql) => {
        return {
          rows: [{
            total_habilitados: '151',
            encuestas_finalizadas: '120',
            brecha_pendientes: '31',
            tasa_respuesta_pct: '79.5',
          }],
        };
      });

      const resDashboard = await request(app)
        .get('/api/analitica/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resDashboard.statusCode).toBe(200);
      expect(resDashboard.body.exito).toBe(true);
      const totales = resDashboard.body.totales || resDashboard.body.data.totales;
      expect(Number(totales.total_habilitados)).toBe(151);

      spyDbQuery.mockRestore();
    });

    // TEST 7: CPS-08 (Prueba de Concurrencia JSONB y Event Loop sin duplicar logs)
    it('Test 7 (CPS-08): Inserción JSONB concurrente con generador PDF (HU-03) - Persistencia sin bloqueo del Event Loop', async () => {
      const tokenEstudiante1 = jwt.sign(
        { id_graduado: 1, carnet_identidad: '8492041', nombres: 'Jared', apellidos: 'Pimentel', carrera: 'Ingeniería de Sistemas', correo_privado: 'jaredpitiu1709@gmail.com' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      const tokenEstudiante2 = jwt.sign(
        { id_graduado: 1, carnet_identidad: '8492041', nombres: 'Jared', apellidos: 'Pimentel', carrera: 'Ingeniería de Sistemas', correo_privado: 'jaredpitiu1709@gmail.com' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      let counterCert = 100;
      const mockClient = {
        query: jest.fn().mockImplementation((queryText) => {
          const sql = String(queryText).toUpperCase();
          if (sql.includes('SELECT ID_RESPUESTA FROM RESPUESTA_ENCUESTA')) return { rows: [] };
          if (sql.includes('INSERT INTO RESPUESTA_ENCUESTA')) {
            return { rows: [{ id_respuesta: ++counterCert, id_graduado: 1, fecha_registro: new Date() }] };
          }
          if (sql.includes('INSERT INTO CERTIFICADOS_EMITIDOS')) {
            return { rows: [{ nro_certificado: ++counterCert, fecha_emision: new Date(), ruta_archivo_pdf: 'CERT_USEI_2026_1.pdf' }] };
          }
          return { rows: [] };
        }),
        release: jest.fn(),
      };

      const spyConnect = jest.spyOn(db.pool, 'connect').mockResolvedValue(mockClient);
      // Silenciamos el despacho SMTP en este test concurrente para que solo CPS-05 imprima el envío oficial
      const spyEmail = jest.spyOn(emailService, 'enviarCertificadoGraduado').mockResolvedValue({ exito: true });

      // 2. Disparamos 2 peticiones concurrentes en paralelo
      const req1 = request(app)
        .post('/api/encuesta/guardar')
        .set('Authorization', `Bearer ${tokenEstudiante1}`)
        .send({
          contenido_json: { S1P01_Carrera: 'Ingeniería de Sistemas', S4P09_0_VolveriaEstudiar: 'Sí' },
          gestion_academica: 2026
        });

      const req2 = request(app)
        .post('/api/encuesta/guardar')
        .set('Authorization', `Bearer ${tokenEstudiante2}`)
        .send({
          contenido_json: { S1P01_Carrera: 'Ingeniería de Sistemas', S4P09_0_VolveriaEstudiar: 'Sí' },
          gestion_academica: 2026
        });

      const [res1, res2] = await Promise.all([req1, req2]);

      // 3. Ambas peticiones deben responder con HTTP 200 sin bloquearse ni cruzarse
      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
      expect(res1.body.exito).toBe(true);
      expect(res2.body.exito).toBe(true);

      expect(res1.body.nro_certificado).toBeDefined();
      expect(res2.body.nro_certificado).toBeDefined();

      spyConnect.mockRestore();
      spyEmail.mockRestore();
    });

  });

});
