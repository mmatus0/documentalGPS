-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-04-2026 a las 16:03:54
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS documentosgps
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE documentosgps;

-- ============================================================
-- MÓDULO 1: USUARIOS Y ROLES
-- ============================================================

CREATE TABLE rol (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(50)  NOT NULL,
  descripcion   VARCHAR(255),
  estado_activo TINYINT(1)   NOT NULL DEFAULT 1
);

CREATE TABLE usuario (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  rol_id           INT          NOT NULL,
  nombre_completo  VARCHAR(100) NOT NULL,
  correo           VARCHAR(100) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  estado_activo    TINYINT(1)   NOT NULL DEFAULT 1,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES rol(id)
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
  estado_activo   TINYINT(1)  NOT NULL DEFAULT 1
);

-- Jerarquía: contratista → area → disciplina
-- Fuente: Reunion1
CREATE TABLE area (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  contratista_id  INT          NOT NULL,
  proceso_id      INT,
  nombre          VARCHAR(150) NOT NULL,
  estado_activo   TINYINT(1)  NOT NULL DEFAULT 1,
  CONSTRAINT fk_area_contratista FOREIGN KEY (contratista_id) REFERENCES contratista(id)
);

CREATE TABLE disciplina (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  area_id       INT          NOT NULL,
  nombre        VARCHAR(150) NOT NULL,
  estado_activo TINYINT(1)  NOT NULL DEFAULT 1,
  CONSTRAINT fk_disciplina_area FOREIGN KEY (area_id) REFERENCES area(id)
);

CREATE TABLE categoria (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  descripcion   VARCHAR(255),
  estado_activo TINYINT(1)  NOT NULL DEFAULT 1
);

CREATE TABLE subtipo (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id  INT         NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  estado_activo TINYINT(1)  NOT NULL DEFAULT 1,
  CONSTRAINT fk_subtipo_categoria FOREIGN KEY (categoria_id) REFERENCES categoria(id)
);

CREATE TABLE tipo_documento (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  descripcion   VARCHAR(255),
  estado_activo TINYINT(1)  NOT NULL DEFAULT 1
);

CREATE TABLE tipo_colaboracion (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  descripcion   VARCHAR(255),
  estado_activo TINYINT(1)  NOT NULL DEFAULT 1
);

-- ============================================================
-- MÓDULO 3: PROCESOS Y ETAPAS
-- ============================================================

CREATE TABLE proceso (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(150) NOT NULL,
  descripcion   VARCHAR(255),
  estado_activo TINYINT(1)  NOT NULL DEFAULT 1
);

ALTER TABLE area
  ADD CONSTRAINT fk_area_proceso FOREIGN KEY (proceso_id) REFERENCES proceso(id);

CREATE TABLE etapa (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  proceso_id         INT         NOT NULL,
  revisor_id         INT         NOT NULL,
  aprobador_id       INT         NOT NULL,
  titulo             VARCHAR(150) NOT NULL,
  secuencia          INT         NOT NULL,
  dias_revision      INT         NOT NULL DEFAULT 5,
  dias_aprobacion    INT         NOT NULL DEFAULT 5,
  requiere_aprobador TINYINT(1)  NOT NULL DEFAULT 1,
  CONSTRAINT fk_etapa_proceso   FOREIGN KEY (proceso_id)   REFERENCES proceso(id),
  CONSTRAINT fk_etapa_revisor   FOREIGN KEY (revisor_id)   REFERENCES usuario(id),
  CONSTRAINT fk_etapa_aprobador FOREIGN KEY (aprobador_id) REFERENCES usuario(id)
);

-- ============================================================
-- MÓDULO 4: TABLAS PIVOTE N:M
-- ============================================================

CREATE TABLE area_usuario (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  area_id       INT         NOT NULL,
  usuario_id    INT         NOT NULL,
  rol_en_area   ENUM('Colaborador','Lector') NOT NULL,
  CONSTRAINT fk_areusu_area    FOREIGN KEY (area_id)    REFERENCES area(id),
  CONSTRAINT fk_areusu_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  UNIQUE KEY uq_area_usuario (area_id, usuario_id)
);

CREATE TABLE proyecto (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  contratista_id  INT         NOT NULL,
  nombre          VARCHAR(150) NOT NULL,
  descripcion     TEXT,
  fecha_inicio    DATE,
  estado_activo   TINYINT(1)  NOT NULL DEFAULT 1,
  CONSTRAINT fk_proyecto_contratista FOREIGN KEY (contratista_id) REFERENCES contratista(id)
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
  id               INT AUTO_INCREMENT PRIMARY KEY,
  area_id          INT          NOT NULL,
  disciplina_id    INT,
  tipo_doc_id      INT          NOT NULL,
  categoria_id     INT          NOT NULL,
  subtipo_id       INT,
  creado_por       INT          NOT NULL,
  correlativo      VARCHAR(30)  NOT NULL UNIQUE,
  nombre           VARCHAR(255) NOT NULL,
  materia          VARCHAR(255),
  emisor           VARCHAR(150),
  origen           ENUM('Externo','Interno') NOT NULL DEFAULT 'Externo',
  reservado        TINYINT(1)   NOT NULL DEFAULT 0,
  fecha_documento  DATE,
  fecha_ingreso    DATE         NOT NULL,
  estado           ENUM('Borrador','Derivado','En Revisión','En Colaboración','En Aprobación','Terminado')
                   NOT NULL DEFAULT 'Borrador',
  CONSTRAINT fk_exp_area         FOREIGN KEY (area_id)       REFERENCES area(id),
  CONSTRAINT fk_exp_disciplina   FOREIGN KEY (disciplina_id) REFERENCES disciplina(id),
  CONSTRAINT fk_exp_tipo_doc     FOREIGN KEY (tipo_doc_id)   REFERENCES tipo_documento(id),
  CONSTRAINT fk_exp_categoria    FOREIGN KEY (categoria_id)  REFERENCES categoria(id),
  CONSTRAINT fk_exp_subtipo      FOREIGN KEY (subtipo_id)    REFERENCES subtipo(id),
  CONSTRAINT fk_exp_creado_por   FOREIGN KEY (creado_por)    REFERENCES usuario(id)
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
  expediente_id   INT          NOT NULL,
  usuario_id      INT          NOT NULL,
  estado_anterior VARCHAR(50),
  estado_nuevo    VARCHAR(50)  NOT NULL,
  comentario      TEXT,
  fecha           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  estado            ENUM('Pendiente','En Progreso','Completada','Rechazada') NOT NULL DEFAULT 'Pendiente',
  fecha_vencimiento DATE,
  CONSTRAINT fk_tarea_expediente FOREIGN KEY (expediente_id)  REFERENCES expediente(id),
  CONSTRAINT fk_tarea_etapa      FOREIGN KEY (etapa_id)       REFERENCES etapa(id),
  CONSTRAINT fk_tarea_asignado   FOREIGN KEY (asignado_a)     REFERENCES usuario(id),
  CONSTRAINT fk_tarea_padre      FOREIGN KEY (tarea_padre_id) REFERENCES tarea(id),
  CONSTRAINT fk_tarea_tipo_colab FOREIGN KEY (tipo_colab_id)  REFERENCES tipo_colaboracion(id)
);

CREATE TABLE visador (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT         NOT NULL,
  area_id       INT         NOT NULL,
  cargo         VARCHAR(100),
  estado_activo TINYINT(1)  NOT NULL DEFAULT 1,
  CONSTRAINT fk_visador_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  CONSTRAINT fk_visador_area    FOREIGN KEY (area_id)    REFERENCES area(id)
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

INSERT INTO rol (nombre, descripcion) VALUES
  ('Administrador', 'Acceso total al sistema'),
  ('Colaborador',   'Puede crear y gestionar expedientes en su área'),
  ('Lector',        'Solo puede visualizar expedientes');

INSERT INTO tipo_colaboracion (nombre, descripcion) VALUES
  ('Revisión técnica', 'Revisión desde el área técnica'),
  ('Revisión legal',   'Revisión desde el área legal'),
  ('Visto bueno',      'Aprobación informal de un área relacionada');

INSERT INTO usuario (rol_id, nombre_completo, correo, password_hash, estado_activo) VALUES
  (1, 'Gonzalo Matus', 'gmatusz@gmail.com', '$2a$10$zCxlwb5x9UrJRjWuYVA19.USE89aA38wJ6H4KrMOCqAO.6OjImRKy', 1);