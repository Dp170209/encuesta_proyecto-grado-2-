const xlsx = require('xlsx');
const db = require('../config/db');

/**
 * Normaliza nombres de encabezados eliminando tildes, espacios extras y pasando a minúsculas
 */
function normalizeHeader(header) {
  if (!header) return '';
  return header
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
    .replace(/[^a-z0-9_]/g, '_')    // Reemplaza símbolos o espacios por guion bajo
    .replace(/_+/g, '_');
}

/**
 * Mapea las columnas del archivo a las propiedades requeridas
 */
function resolveColumns(row) {
  const normalized = {};
  for (const key of Object.keys(row)) {
    normalized[normalizeHeader(key)] = row[key];
  }

  // Búsqueda flexible de columnas obligatorias
  const carnet =
    normalized.carnet ||
    normalized.carnet_identidad ||
    normalized.carnet_de_identidad ||
    normalized.ci ||
    normalized.c_i ||
    normalized.cedula ||
    normalized.documento_identidad;

  const nombres =
    normalized.nombres ||
    normalized.nombre ||
    normalized.primer_nombre;

  const apellidos =
    normalized.apellidos ||
    normalized.apellido ||
    (normalized.apellido_paterno
      ? `${normalized.apellido_paterno} ${normalized.apellido_materno || ''}`.trim()
      : undefined);

  const carrera =
    normalized.carrera ||
    normalized.programa ||
    normalized.carrera_estudiante;

  const modalidad =
    normalized.modalidad_titulacion ||
    normalized.modalidad ||
    normalized.modalidad_de_titulacion ||
    'Regular';

  const gestion =
    normalized.gestion_semestre ||
    normalized.gestion ||
    normalized.semestre ||
    '';

  return {
    carnet: carnet !== undefined && carnet !== null ? String(carnet).trim() : null,
    nombres: nombres !== undefined && nombres !== null ? String(nombres).trim() : null,
    apellidos: apellidos !== undefined && apellidos !== null ? String(apellidos).trim() : null,
    carrera: carrera !== undefined && carrera !== null ? String(carrera).trim() : null,
    modalidad_titulacion: modalidad !== undefined && modalidad !== null ? String(modalidad).trim() : null,
    gestion_semestre: gestion !== undefined && gestion !== null ? String(gestion).trim() : '',
  };
}

/**
 * Procesa el buffer del archivo Excel/CSV y persiste los datos en PostgreSQL
 */
async function procesarArchivoHabilitados(fileBuffer, defaultGestion = '2026-1') {
  // 1. Lectura del libro con SheetJS
  let workbook;
  try {
    workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });
  } catch (error) {
    throw new Error(`No se pudo leer el archivo cargado. Asegúrese de que sea un archivo Excel o CSV válido.`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('El archivo no contiene ninguna hoja de cálculo.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: null });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('El archivo cargado está vacío o no contiene filas con datos legibles.');
  }

  // 2. Validación de columnas obligatorias en la cabecera
  const firstRow = rawRows[0];
  const resolvedSample = resolveColumns(firstRow);
  const missingHeaders = [];

  if (resolvedSample.carnet === null) missingHeaders.push('Carnet / CI');
  if (resolvedSample.nombres === null) missingHeaders.push('Nombres');
  if (resolvedSample.apellidos === null) missingHeaders.push('Apellidos');
  if (resolvedSample.carrera === null) missingHeaders.push('Carrera');

  if (missingHeaders.length > 0) {
    throw new Error(
      `El archivo no contiene las columnas obligatorias requeridas: ${missingHeaders.join(', ')}. ` +
      `Verifique la fila de encabezados en el archivo.`
    );
  }

  // 3. Validación y sanitización fila por fila
  const estudiantesValidados = [];
  const carnetsEnArchivo = new Set();
  const duplicadosEnArchivo = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const excelRowNum = i + 2; // Fila 1 es cabecera, datos inician en fila 2

    const item = resolveColumns(raw);

    // Detección de filas vacías accidentales
    const estaFilaVacia = !item.carnet && !item.nombres && !item.apellidos && !item.carrera;
    if (estaFilaVacia) {
      continue; // Ignorar filas en blanco al final del archivo
    }

    // Validar obligatoriedad de campos críticos por fila
    if (!item.carnet) {
      throw new Error(`Error en fila ${excelRowNum}: El campo "Carnet" es obligatorio y está vacío.`);
    }
    if (!item.nombres) {
      throw new Error(`Error en fila ${excelRowNum}: El campo "Nombres" es obligatorio y está vacío.`);
    }
    if (!item.apellidos) {
      throw new Error(`Error en fila ${excelRowNum}: El campo "Apellidos" es obligatorio y está vacío.`);
    }
    if (!item.carrera) {
      throw new Error(`Error en fila ${excelRowNum}: El campo "Carrera" es obligatorio y está vacío.`);
    }

    // Prevención de duplicados dentro del mismo archivo
    if (carnetsEnArchivo.has(item.carnet)) {
      duplicadosEnArchivo.push({ carnet: item.carnet, fila: excelRowNum });
      continue; // Omitir repetición dentro del mismo archivo
    }
    carnetsEnArchivo.add(item.carnet);

    estudiantesValidados.push({
      carnet_identidad: item.carnet,
      nombres: item.nombres,
      apellidos: item.apellidos,
      carrera: item.carrera,
      modalidad_titulacion: item.modalidad_titulacion || 'Tesis',
      gestion_semestre: item.gestion_semestre || defaultGestion,
    });
  }

  if (estudiantesValidados.length === 0) {
    throw new Error('No se encontraron registros válidos para procesar en el archivo.');
  }

  // 4. Inserción con control de concurrencia y prevención de duplicados en PostgreSQL
  const client = await db.pool.connect();
  let insertados = 0;
  let duplicadosEnBD = 0;

  try {
    await client.query('BEGIN');

    // Consultar carnets ya existentes en la BD
    const carnetsArray = estudiantesValidados.map((e) => e.carnet_identidad);
    const existingResult = await client.query(
      `SELECT carnet_identidad FROM estudiantes_habilitados WHERE carnet_identidad = ANY($1::varchar[])`,
      [carnetsArray]
    );

    const carnetsExistentes = new Set(existingResult.rows.map((r) => r.carnet_identidad));

    // Filtrar solo los nuevos no existentes
    const paraInsertar = estudiantesValidados.filter((e) => {
      if (carnetsExistentes.has(e.carnet_identidad)) {
        duplicadosEnBD++;
        return false;
      }
      return true;
    });

    if (paraInsertar.length > 0) {
      // Inserción por lotes con consulta parametrizada segura (OWASP Top 10 - Prevención SQLi)
      const values = [];
      const chunks = [];
      let paramCounter = 1;

      for (const item of paraInsertar) {
        chunks.push(
          `($${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++})`
        );
        values.push(
          item.carnet_identidad,
          item.nombres,
          item.apellidos,
          item.carrera,
          item.modalidad_titulacion,
          item.gestion_semestre
        );
      }

      const queryText = `
        INSERT INTO estudiantes_habilitados 
        (carnet_identidad, nombres, apellidos, carrera, modalidad_titulacion, gestion_semestre)
        VALUES ${chunks.join(', ')}
      `;

      await client.query(queryText, values);
      insertados = paraInsertar.length;
    }

    await client.query('COMMIT');

    return {
      exito: true,
      mensaje: 'Estudiantes habilitados cargados con éxito.',
      total_procesados: rawRows.length,
      nuevos_insertados: insertados,
      omitidos_duplicados: duplicadosEnBD + duplicadosEnArchivo.length,
      detalle_duplicados: {
        en_archivo: duplicadosEnArchivo.length,
        ya_en_base_datos: duplicadosEnBD,
      },
    };
  } catch (dbError) {
    await client.query('ROLLBACK');
    throw new Error(`Error en base de datos al registrar estudiantes: ${dbError.message}`);
  } finally {
    client.release();
  }
}

/**
 * Obtiene el historial de los últimos estudiantes habilitados registrados
 */
async function listarEstudiantesHabilitados(limite = 50) {
  const result = await db.query(
    `SELECT id_habilitado, carnet_identidad, nombres, apellidos, carrera, modalidad_titulacion, gestion_semestre
     FROM estudiantes_habilitados
     ORDER BY id_habilitado DESC
     LIMIT $1`,
    [limite]
  );
  return result.rows;
}

module.exports = {
  procesarArchivoHabilitados,
  listarEstudiantesHabilitados,
};
