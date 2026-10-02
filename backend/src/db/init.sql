-- Esquema inicial de Base de Datos - Sistema Integrado USEI UCB

-- 1. Tabla: Administrador USEI
CREATE TABLE IF NOT EXISTS administrador_usei (
    id_admin SERIAL PRIMARY KEY,
    correo_institucional VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    estado_activo BOOLEAN DEFAULT TRUE
);

-- 2. Tabla: Estudiantes Habilitados (Carga Masiva ETL)
CREATE TABLE IF NOT EXISTS estudiantes_habilitados (
    id_habilitado SERIAL PRIMARY KEY,
    carnet_identidad VARCHAR(20) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    carrera VARCHAR(100) NOT NULL,
    modalidad_titulacion VARCHAR(50),
    gestion_semestre VARCHAR(20) NOT NULL
);

-- Índice único opcional para acelerar búsquedas y garantizar unicidad por carnet
CREATE UNIQUE INDEX IF NOT EXISTS idx_habilitados_carnet ON estudiantes_habilitados(carnet_identidad);

-- 3. Tabla: Graduado (Registro Central de Trazabilidad)
CREATE TABLE IF NOT EXISTS graduado (
    id_graduado SERIAL PRIMARY KEY,
    carnet_identidad VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo_privado VARCHAR(150) NOT NULL,
    celular VARCHAR(20) NOT NULL,
    carrera VARCHAR(100) NOT NULL,
    anio_ingreso INTEGER
);

-- 4. Tabla: Catálogo de Preguntas (Traductor de LimeSurvey)
CREATE TABLE IF NOT EXISTS catalogo_preguntas (
    id_pregunta SERIAL PRIMARY KEY,
    tipo_encuesta VARCHAR(50) NOT NULL,
    codigo_pregunta VARCHAR(50) NOT NULL,
    enunciado_completo TEXT NOT NULL
);

-- 5. Tabla: Respuesta Encuesta (El núcleo híbrido JSONB)
CREATE TABLE IF NOT EXISTS respuesta_encuesta (
    id_respuesta SERIAL PRIMARY KEY,
    id_graduado INTEGER NOT NULL,
    tipo_encuesta VARCHAR(50) NOT NULL,
    gestion_academica INTEGER NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contenido_json JSONB NOT NULL,
    CONSTRAINT fk_graduado_encuesta FOREIGN KEY (id_graduado) 
        REFERENCES graduado(id_graduado) ON DELETE CASCADE
);

-- 6. Tabla: Certificados Emitidos (Auditoría USEI)
CREATE TABLE IF NOT EXISTS certificados_emitidos (
    nro_certificado SERIAL PRIMARY KEY,
    id_graduado INTEGER NOT NULL,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ruta_archivo_pdf VARCHAR(255) NOT NULL,
    CONSTRAINT fk_graduado_certificado FOREIGN KEY (id_graduado) 
        REFERENCES graduado(id_graduado) ON DELETE CASCADE
);
