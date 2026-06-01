-- ============================================================
-- documentosgps.sql — Schema + Datos de Prueba Completos
-- Versión: HU-01 a HU-15
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS documentosgps
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE documentosgps;

-- ============================================================
-- TABLA ESTADO
-- ============================================================

CREATE TABLE estado (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL
);

INSERT INTO estado (nombre) VALUES
  ('Activo'),           -- id 1  → entidades
  ('Inactivo'),         -- id 2  → entidades (borrado lógico)
  ('Borrador'),         -- id 3  → expediente recién creado
  ('Derivado'),         -- id 4  → expediente enviado a un área
  ('En Revisión'),      -- id 5  → revisor tiene tarea activa
  ('En Colaboración'),  -- id 6  → se solicitó colaboración
  ('En Aprobación'),    -- id 7  → aprobador tiene tarea activa
  ('Terminado'),        -- id 8  → expediente cerrado con éxito
  ('Pendiente'),        -- id 9  → tarea generada, aún sin abrir
  ('En Progreso'),      -- id 10 → tarea abierta por el responsable
  ('Completada'),       -- id 11 → tarea aprobada/resuelta
  ('Rechazada');        -- id 12 → tarea rechazada

-- ============================================================
-- MÓDULO 1: USUARIOS Y ROLES
-- ============================================================

CREATE TABLE rol (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(50)  NOT NULL,
  descripcion VARCHAR(255),
  estado_id   INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_rol_estado FOREIGN KEY (estado_id) REFERENCES estado(id)
);

CREATE TABLE usuario (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  rol_id          INT          NOT NULL,
  nombre_completo VARCHAR(100) NOT NULL,
  correo          VARCHAR(100) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  estado_id       INT          NOT NULL DEFAULT 1,
  CONSTRAINT fk_usuario_rol    FOREIGN KEY (rol_id)    REFERENCES rol(id),
  CONSTRAINT fk_usuario_estado FOREIGN KEY (estado_id) REFERENCES estado(id)
);

-- ============================================================
-- MÓDULO 2: MANTENEDORES BASE
-- ============================================================

CREATE TABLE contratista (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(150) NOT NULL,
  rut             VARCHAR(20)  NOT NULL UNIQUE,
  correo_contacto VARCHAR(100),
  telefono        VARCHAR(20),
  estado_id       INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_contratista_estado FOREIGN KEY (estado_id) REFERENCES estado(id)
);

CREATE TABLE area (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  contratista_id INT          NOT NULL,
  proceso_id     INT,
  nombre         VARCHAR(150) NOT NULL,
  estado_id      INT          NOT NULL DEFAULT 1,
  CONSTRAINT fk_area_contratista FOREIGN KEY (contratista_id) REFERENCES contratista(id),
  CONSTRAINT fk_area_estado      FOREIGN KEY (estado_id)      REFERENCES estado(id)
);

CREATE TABLE disciplina (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  area_id   INT          NOT NULL,
  nombre    VARCHAR(150) NOT NULL,
  estado_id INT          NOT NULL DEFAULT 1,
  CONSTRAINT fk_disciplina_area   FOREIGN KEY (area_id)   REFERENCES area(id),
  CONSTRAINT fk_disciplina_estado FOREIGN KEY (estado_id) REFERENCES estado(id)
);

CREATE TABLE categoria (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  estado_id   INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_categoria_estado FOREIGN KEY (estado_id) REFERENCES estado(id)
);

CREATE TABLE subtipo (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT          NOT NULL,
  nombre       VARCHAR(100) NOT NULL,
  estado_id    INT          NOT NULL DEFAULT 1,
  CONSTRAINT fk_subtipo_categoria FOREIGN KEY (categoria_id) REFERENCES categoria(id),
  CONSTRAINT fk_subtipo_estado    FOREIGN KEY (estado_id)    REFERENCES estado(id)
);

CREATE TABLE tipo_documento (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  estado_id   INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_tipodoc_estado FOREIGN KEY (estado_id) REFERENCES estado(id)
);

CREATE TABLE tipo_colaboracion (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  estado_id   INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_tipocolab_estado FOREIGN KEY (estado_id) REFERENCES estado(id)
);

-- ============================================================
-- MÓDULO 3: PROCESOS Y ETAPAS
-- ============================================================

CREATE TABLE proceso (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  descripcion VARCHAR(255),
  estado_id   INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_proceso_estado FOREIGN KEY (estado_id) REFERENCES estado(id)
);

ALTER TABLE area
  ADD CONSTRAINT fk_area_proceso FOREIGN KEY (proceso_id) REFERENCES proceso(id);

CREATE TABLE etapa (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  proceso_id         INT          NOT NULL,
  revisor_id         INT          NOT NULL,
  aprobador_id       INT          NOT NULL,
  titulo             VARCHAR(150) NOT NULL,
  secuencia          INT          NOT NULL,
  dias_revision      INT          NOT NULL DEFAULT 5,
  dias_aprobacion    INT          NOT NULL DEFAULT 5,
  requiere_aprobador TINYINT(1)   NOT NULL DEFAULT 1,
  CONSTRAINT fk_etapa_proceso   FOREIGN KEY (proceso_id)   REFERENCES proceso(id),
  CONSTRAINT fk_etapa_revisor   FOREIGN KEY (revisor_id)   REFERENCES usuario(id),
  CONSTRAINT fk_etapa_aprobador FOREIGN KEY (aprobador_id) REFERENCES usuario(id)
);

-- ============================================================
-- MÓDULO 4: TABLAS PIVOTE N:M
-- ============================================================

CREATE TABLE area_usuario (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  area_id     INT NOT NULL,
  usuario_id  INT NOT NULL,
  rol_en_area ENUM('Colaborador','Lector') NOT NULL,
  CONSTRAINT fk_areusu_area    FOREIGN KEY (area_id)    REFERENCES area(id),
  CONSTRAINT fk_areusu_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  UNIQUE KEY uq_area_usuario (area_id, usuario_id)
);

CREATE TABLE proyecto (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  contratista_id INT          NOT NULL,
  nombre         VARCHAR(150) NOT NULL,
  descripcion    TEXT,
  fecha_inicio   DATE,
  estado_id      INT          NOT NULL DEFAULT 1,
  CONSTRAINT fk_proyecto_contratista FOREIGN KEY (contratista_id) REFERENCES contratista(id),
  CONSTRAINT fk_proyecto_estado      FOREIGN KEY (estado_id)      REFERENCES estado(id)
);

CREATE TABLE proyecto_area (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  proyecto_id INT NOT NULL,
  area_id     INT NOT NULL,
  CONSTRAINT fk_proyare_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyecto(id),
  CONSTRAINT fk_proyare_area     FOREIGN KEY (area_id)     REFERENCES area(id),
  UNIQUE KEY uq_proyecto_area (proyecto_id, area_id)
);

-- ============================================================
-- MÓDULO 5: EXPEDIENTES
-- ============================================================

CREATE TABLE expediente (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  area_id         INT          NOT NULL,
  disciplina_id   INT,
  tipo_doc_id     INT          NOT NULL,
  categoria_id    INT          NOT NULL,
  subtipo_id      INT,
  n_documento     VARCHAR(100),
  creado_por      INT          NOT NULL,
  correlativo     VARCHAR(30)  NOT NULL UNIQUE,
  nombre          VARCHAR(255) NOT NULL,
  materia         VARCHAR(255),
  emisor          VARCHAR(150),
  origen          ENUM('Externo','Interno') NOT NULL DEFAULT 'Externo',
  reservado       TINYINT(1)   NOT NULL DEFAULT 0,
  fecha_documento DATE,
  fecha_ingreso   DATE         NOT NULL,
  estado_id       INT          NOT NULL DEFAULT 3,
  CONSTRAINT fk_exp_area       FOREIGN KEY (area_id)       REFERENCES area(id),
  CONSTRAINT fk_exp_disciplina FOREIGN KEY (disciplina_id) REFERENCES disciplina(id),
  CONSTRAINT fk_exp_tipo_doc   FOREIGN KEY (tipo_doc_id)   REFERENCES tipo_documento(id),
  CONSTRAINT fk_exp_categoria  FOREIGN KEY (categoria_id)  REFERENCES categoria(id),
  CONSTRAINT fk_exp_subtipo    FOREIGN KEY (subtipo_id)    REFERENCES subtipo(id),
  CONSTRAINT fk_exp_creado_por FOREIGN KEY (creado_por)    REFERENCES usuario(id),
  CONSTRAINT fk_exp_estado     FOREIGN KEY (estado_id)     REFERENCES estado(id)
);

CREATE TABLE documento_adjunto (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  expediente_id  INT          NOT NULL,
  subido_por     INT          NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  tipo_archivo   VARCHAR(50),
  ruta_volumen   VARCHAR(500) NOT NULL,
  fecha_carga    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_docadj_expediente FOREIGN KEY (expediente_id) REFERENCES expediente(id),
  CONSTRAINT fk_docadj_subido_por FOREIGN KEY (subido_por)    REFERENCES usuario(id)
);

CREATE TABLE historial_expediente (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  expediente_id   INT         NOT NULL,
  usuario_id      INT         NOT NULL,
  estado_anterior VARCHAR(50),
  estado_nuevo    VARCHAR(50) NOT NULL,
  comentario      TEXT,
  fecha           DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_expediente FOREIGN KEY (expediente_id) REFERENCES expediente(id),
  CONSTRAINT fk_hist_usuario    FOREIGN KEY (usuario_id)    REFERENCES usuario(id)
);

-- ============================================================
-- MÓDULO 6: TAREAS Y VISADORES
-- ============================================================

CREATE TABLE tarea (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  expediente_id     INT          NOT NULL,
  etapa_id          INT          NOT NULL,
  asignado_a        INT          NOT NULL,
  tarea_padre_id    INT,
  tipo_colab_id     INT,
  tipo              ENUM('Revision','Aprobacion','Colaboracion') NOT NULL,
  estado_id         INT          NOT NULL DEFAULT 9,
  fecha_vencimiento DATE,
  CONSTRAINT fk_tarea_expediente FOREIGN KEY (expediente_id)  REFERENCES expediente(id),
  CONSTRAINT fk_tarea_etapa      FOREIGN KEY (etapa_id)       REFERENCES etapa(id),
  CONSTRAINT fk_tarea_asignado   FOREIGN KEY (asignado_a)     REFERENCES usuario(id),
  CONSTRAINT fk_tarea_padre      FOREIGN KEY (tarea_padre_id) REFERENCES tarea(id),
  CONSTRAINT fk_tarea_tipo_colab FOREIGN KEY (tipo_colab_id)  REFERENCES tipo_colaboracion(id),
  CONSTRAINT fk_tarea_estado     FOREIGN KEY (estado_id)      REFERENCES estado(id)
);

CREATE TABLE visador (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT          NOT NULL,
  area_id    INT          NOT NULL,
  cargo      VARCHAR(100),
  estado_id  INT          NOT NULL DEFAULT 1,
  CONSTRAINT fk_visador_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  CONSTRAINT fk_visador_area    FOREIGN KEY (area_id)    REFERENCES area(id),
  CONSTRAINT fk_visador_estado  FOREIGN KEY (estado_id)  REFERENCES estado(id)
);

-- ============================================================
-- DATOS INICIALES — NO MODIFICAR
-- ============================================================

-- Roles (HU-01/02)
INSERT INTO rol (nombre, descripcion) VALUES
  ('Administrador', 'Acceso total al sistema'),
  ('Colaborador',   'Puede crear y gestionar expedientes en su área'),
  ('Lector',        'Solo puede visualizar expedientes');

-- Usuarios — NO MODIFICAR CREDENCIALES
INSERT INTO usuario (rol_id, nombre_completo, correo, password_hash, estado_id) VALUES
  (1, 'Gonzalo Matus',     'gmatusz@gmail.com', '$2b$10$UOv60PulnOpwrlO3GnRZ2eeSGqAjuioa1iWEi40uCpLFSuHDvPAUK', 1),
  (2, 'Constanza Venegas', 'cony@gmail.com',    '$2b$10$UOv60PulnOpwrlO3GnRZ2eeSGqAjuioa1iWEi40uCpLFSuHDvPAUK', 1),
  (2, 'Benjamín Castillo', 'benja@gmail.com',   '$2b$10$UOv60PulnOpwrlO3GnRZ2eeSGqAjuioa1iWEi40uCpLFSuHDvPAUK', 1);

-- Usuario Lector de prueba (HU-03)
INSERT INTO usuario (rol_id, nombre_completo, correo, password_hash, estado_id) VALUES
  (3, 'Cristian Cliente',  'cristian@gmail.com', '$2b$10$UOv60PulnOpwrlO3GnRZ2eeSGqAjuioa1iWEi40uCpLFSuHDvPAUK', 1);

-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

-- ── Tipos de Colaboración (HU-12) ─────────────────────────────────────────
INSERT INTO tipo_colaboracion (nombre, descripcion) VALUES
  ('Revisión técnica', 'Revisión desde el área técnica'),
  ('Revisión legal',   'Revisión desde el área legal'),
  ('Visto bueno',      'Aprobación informal de un área relacionada');

-- ── Tipos de Documento (HU-09) ────────────────────────────────────────────
INSERT INTO tipo_documento (nombre, descripcion) VALUES
  ('Carta',    'Comunicación formal entre partes'),
  ('Oficio',   'Documento oficial emitido por una institución'),
  ('Memo',     'Comunicación interna breve'),
  ('Informe',  'Documento técnico o de gestión con análisis'),
  ('Contrato', 'Acuerdo formal entre dos o más partes');

-- ── Categorías y Subtipos (HU-08) ─────────────────────────────────────────
INSERT INTO categoria (nombre, descripcion) VALUES
  ('Documentación Técnica',     'Documentos relacionados con ingeniería y obras'),
  ('Documentación Administrativa', 'Documentos de gestión y administración'),
  ('Documentación Legal',       'Contratos, resoluciones y documentos legales');

-- Subtipos de "Documentación Técnica" (categoria_id = 1)
INSERT INTO subtipo (categoria_id, nombre) VALUES
  (1, 'Planos'),
  (1, 'Especificaciones Técnicas'),
  (1, 'Informes de Terreno');

-- Subtipos de "Documentación Administrativa" (categoria_id = 2)
INSERT INTO subtipo (categoria_id, nombre) VALUES
  (2, 'Circulares'),
  (2, 'Resoluciones Internas'),
  (2, 'Actas de Reunión');

-- Subtipos de "Documentación Legal" (categoria_id = 3)
INSERT INTO subtipo (categoria_id, nombre) VALUES
  (3, 'Contratos Marco'),
  (3, 'Adendas'),
  (3, 'Resoluciones Exentas');

-- ── Contratistas (HU-05) ──────────────────────────────────────────────────
INSERT INTO contratista (nombre, rut, correo_contacto, telefono) VALUES
  ('Agrosana S.A.',    '76.123.456-7', 'contacto@agrosana.cl',     '+56912345678'),
  ('MegaCorp Ltda.',   '77.234.567-8', 'contacto@megacorp.cl',     '+56923456789'),
  ('Constructora XYZ', '78.345.678-9', 'contacto@constructora.cl', '+56934567890');

-- ── Áreas sin proceso aún (HU-06) — proceso_id se asigna más adelante
INSERT INTO area (contratista_id, nombre) VALUES
  (1, 'Ingeniería'),       -- id 1
  (1, 'Contabilidad'),     -- id 2
  (1, 'Proyectos'),        -- id 3
  (2, 'Ingeniería'),       -- id 4
  (2, 'Recursos Humanos'), -- id 5
  (3, 'Obras Civiles'),    -- id 6
  (3, 'Administración');   -- id 7

-- ── Disciplinas (MER v3 / Reunion1) ───────────────────────────────────────
INSERT INTO disciplina (area_id, nombre) VALUES
  (1, 'Movimientos de Tierra'),
  (1, 'Estudios de Agua'),
  (1, 'Estudios de Suelo'),
  (1, 'Metalúrgica'),
  (4, 'Estructuras'),
  (4, 'Instalaciones');

-- ── Proyectos (HU-07) ─────────────────────────────────────────────────────
INSERT INTO proyecto (contratista_id, nombre, descripcion, fecha_inicio) VALUES
  (1, 'Proyecto Riego Norte',    'Instalación de sistemas de riego en zona norte', '2026-01-15'),
  (1, 'Expansión Planta Sur',    'Ampliación de planta de procesamiento',          '2026-03-01'),
  (2, 'Torre Corporativa',       'Construcción de edificio corporativo',            '2026-02-01'),
  (3, 'Pavimentación Acceso A',  'Obras de pavimentación en acceso principal',     '2026-04-01');

-- Relaciones proyecto–área (HU-07)
INSERT INTO proyecto_area (proyecto_id, area_id) VALUES
  (1, 1), (1, 3),
  (2, 1), (2, 2),
  (3, 4), (3, 5),
  (4, 6), (4, 7);

-- ── Procesos (HU-10) ──────────────────────────────────────────────────────
INSERT INTO proceso (nombre, descripcion) VALUES
  ('Revisión de Documentos Técnicos', 'Proceso de revisión y aprobación de documentación técnica de ingeniería'),
  ('Gestión Administrativa',          'Proceso de revisión de documentación administrativa y contable'),
  ('Revisión Legal',                  'Proceso de revisión de contratos y documentación legal');

-- ── Etapas por proceso (HU-11)
-- Proceso 1: Revisión de Documentos Técnicos — 2 etapas
-- Revisor: Constanza (id=2), Aprobador: Gonzalo (id=1)
INSERT INTO etapa (proceso_id, titulo, secuencia, revisor_id, aprobador_id, dias_revision, dias_aprobacion, requiere_aprobador) VALUES
  (1, 'Revisión Técnica',   1, 2, 1, 5, 3, 1),
  (1, 'Aprobación Final',   2, 2, 1, 3, 5, 1);

-- Proceso 2: Gestión Administrativa — 1 etapa
INSERT INTO etapa (proceso_id, titulo, secuencia, revisor_id, aprobador_id, dias_revision, dias_aprobacion, requiere_aprobador) VALUES
  (2, 'Revisión Administrativa', 1, 3, 1, 5, 5, 1);

-- Proceso 3: Revisión Legal — 2 etapas
INSERT INTO etapa (proceso_id, titulo, secuencia, revisor_id, aprobador_id, dias_revision, dias_aprobacion, requiere_aprobador) VALUES
  (3, 'Revisión Legal',     1, 2, 1, 7, 5, 1),
  (3, 'Visación Final',     2, 3, 1, 5, 3, 0);

-- ── HU-13: Asignar procesos a áreas ───────────────────────────────────────
UPDATE area SET proceso_id = 1 WHERE id = 1;  -- Agrosana Ingeniería → Revisión Técnica
UPDATE area SET proceso_id = 2 WHERE id = 2;  -- Agrosana Contabilidad → Gestión Administrativa
UPDATE area SET proceso_id = 1 WHERE id = 3;  -- Agrosana Proyectos → Revisión Técnica
UPDATE area SET proceso_id = 1 WHERE id = 4;  -- MegaCorp Ingeniería → Revisión Técnica
UPDATE area SET proceso_id = 2 WHERE id = 5;  -- MegaCorp RRHH → Gestión Administrativa
UPDATE area SET proceso_id = 1 WHERE id = 6;  -- Constructora Obras Civiles → Revisión Técnica
UPDATE area SET proceso_id = 3 WHERE id = 7;  -- Constructora Administración → Revisión Legal

-- ── HU-03: Asignar usuarios a áreas ───────────────────────────────────────
-- Constanza (id=2) es Colaboradora en Ingeniería Agrosana (id=1) y Obras Civiles (id=6)
-- Benjamín (id=3) es Colaborador en Contabilidad Agrosana (id=2) y Proyectos Agrosana (id=3)
-- Cristian/Lector (id=4) es Lector en Ingeniería Agrosana (id=1)
INSERT INTO area_usuario (area_id, usuario_id, rol_en_area) VALUES
  (1, 2, 'Colaborador'),
  (1, 4, 'Lector'),
  (2, 3, 'Colaborador'),
  (3, 3, 'Colaborador'),
  (6, 2, 'Colaborador'),
  (4, 3, 'Lector');

-- ── HU-14/15: Expedientes de prueba en distintos estados ──────────────────
-- Expediente 1: Borrador (recién creado por Constanza en Ingeniería Agrosana)
INSERT INTO expediente
  (area_id, tipo_doc_id, categoria_id, subtipo_id, n_documento, creado_por,
   correlativo, nombre, materia, emisor, origen, reservado, fecha_documento, fecha_ingreso, estado_id)
VALUES
  (1, 4, 1, 2, 'INF-2026-001', 2,
   'EXP-2026-0001', 'Informe Estudio de Suelo Sector Norte',
   'Análisis geotécnico para fundaciones', 'Laboratorio Geotécnico Sur', 'Externo', 0,
   '2026-05-10', '2026-05-12', 3);

-- Expediente 2: Borrador (creado por Benjamín en Contabilidad)
INSERT INTO expediente
  (area_id, tipo_doc_id, categoria_id, subtipo_id, n_documento, creado_por,
   correlativo, nombre, materia, emisor, origen, reservado, fecha_documento, fecha_ingreso, estado_id)
VALUES
  (2, 1, 2, 5, 'CARTA-2026-042', 3,
   'EXP-2026-0002', 'Carta Solicitud Presupuesto Anual',
   'Solicitud de presupuesto para ejercicio 2026', 'Gerencia General', 'Interno', 0,
   '2026-05-15', '2026-05-15', 3);

-- Expediente 3: En Revisión (para demo del flujo de tareas)
INSERT INTO expediente
  (area_id, tipo_doc_id, categoria_id, subtipo_id, n_documento, creado_por,
   correlativo, nombre, materia, emisor, origen, reservado, fecha_documento, fecha_ingreso, estado_id)
VALUES
  (1, 2, 1, 1, 'OF-2026-010', 2,
   'EXP-2026-0003', 'Oficio Aprobación Planos Estructurales',
   'Revisión y aprobación de planos de estructura', 'Dirección de Obras', 'Externo', 0,
   '2026-04-20', '2026-04-22', 5);

-- Expediente 4: Reservado (solo acceso reservado)
INSERT INTO expediente
  (area_id, tipo_doc_id, categoria_id, subtipo_id, n_documento, creado_por,
   correlativo, nombre, materia, emisor, origen, reservado, fecha_documento, fecha_ingreso, estado_id)
VALUES
  (1, 5, 3, 7, 'CONT-2026-003', 2,
   'EXP-2026-0004', 'Contrato Marco Proveedor Equipos',
   'Contrato de suministro de equipos industriales', 'Proveedor Industrial Norte', 'Externo', 1,
   '2026-03-01', '2026-03-05', 3);

-- Historial de los expedientes de prueba
INSERT INTO historial_expediente (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario) VALUES
  (1, 2, NULL,        'Borrador',     'Expediente creado'),
  (2, 3, NULL,        'Borrador',     'Expediente creado'),
  (3, 2, NULL,        'Borrador',     'Expediente creado'),
  (3, 2, 'Borrador',  'En Revisión',  'Derivado para revisión técnica de planos'),
  (4, 2, NULL,        'Borrador',     'Expediente creado');