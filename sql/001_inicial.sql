CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(190) NOT NULL,
  clave_hash VARCHAR(255) NOT NULL,
  rol ENUM('DOCENTE', 'ADMINISTRADOR') NOT NULL DEFAULT 'DOCENTE',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY usuarios_correo_unico (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS accesos (
  id CHAR(36) NOT NULL,
  usuario_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expira_en DATETIME NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY accesos_token_unico (token_hash),
  KEY accesos_usuario_indice (usuario_id),
  KEY accesos_expiracion_indice (expira_en),
  CONSTRAINT accesos_usuario_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aulas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nivel ENUM('PRIMARIA', 'SECUNDARIA') NOT NULL,
  grado TINYINT UNSIGNED NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  edad_minima TINYINT UNSIGNED NOT NULL,
  edad_maxima TINYINT UNSIGNED NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  color VARCHAR(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY aulas_nivel_grado_unico (nivel, grado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS areas_curriculares (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nivel ENUM('PRIMARIA', 'SECUNDARIA') NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY areas_nivel_codigo_unico (nivel, codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sesiones_aprendizaje (
  id CHAR(36) NOT NULL,
  usuario_id BIGINT UNSIGNED NOT NULL,
  aula_id BIGINT UNSIGNED NOT NULL,
  area_curricular_id BIGINT UNSIGNED NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  tipo_archivo VARCHAR(100) NOT NULL,
  tamano_bytes INT UNSIGNED NOT NULL,
  texto_extraido LONGTEXT NOT NULL,
  titulo_detectado VARCHAR(255) NULL,
  estado ENUM('ANALIZANDO', 'LISTA', 'ERROR') NOT NULL DEFAULT 'ANALIZANDO',
  detalle_error VARCHAR(1000) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY sesiones_usuario_indice (usuario_id),
  KEY sesiones_aula_indice (aula_id),
  CONSTRAINT sesiones_usuario_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT sesiones_aula_fk FOREIGN KEY (aula_id) REFERENCES aulas(id),
  CONSTRAINT sesiones_area_fk FOREIGN KEY (area_curricular_id) REFERENCES areas_curriculares(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experiencias (
  id CHAR(36) NOT NULL,
  sesion_aprendizaje_id CHAR(36) NOT NULL,
  contenido_json JSON NOT NULL,
  modelo_ia VARCHAR(80) NOT NULL,
  modo_generacion ENUM('IA', 'DEMOSTRACION') NOT NULL,
  publicada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY experiencias_sesion_unica (sesion_aprendizaje_id),
  CONSTRAINT experiencias_sesion_fk FOREIGN KEY (sesion_aprendizaje_id) REFERENCES sesiones_aprendizaje(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO aulas (nivel, grado, nombre, edad_minima, edad_maxima, descripcion, color) VALUES
('PRIMARIA', 1, '1.° de primaria', 6, 7, 'Exploración guiada, juego y consignas muy breves.', '#F6B73C'),
('PRIMARIA', 2, '2.° de primaria', 7, 8, 'Relatos cortos, descubrimiento y participación constante.', '#FF8A5B'),
('PRIMARIA', 3, '3.° de primaria', 8, 9, 'Retos concretos y relaciones con la vida cotidiana.', '#5BBF9A'),
('PRIMARIA', 4, '4.° de primaria', 9, 10, 'Historias, comparación y pequeñas decisiones.', '#4E9FE6'),
('PRIMARIA', 5, '5.° de primaria', 10, 11, 'Investigación guiada y explicaciones con más detalle.', '#8377D1'),
('PRIMARIA', 6, '6.° de primaria', 11, 12, 'Retos colaborativos y reflexión previa a secundaria.', '#E06B9A'),
('SECUNDARIA', 1, '1.° de secundaria', 12, 13, 'Exploración visual, casos cercanos y preguntas críticas.', '#2E86AB'),
('SECUNDARIA', 2, '2.° de secundaria', 13, 14, 'Escenarios, evidencias y decisiones argumentadas.', '#287271'),
('SECUNDARIA', 3, '3.° de secundaria', 14, 15, 'Análisis de causas, consecuencias y perspectivas.', '#7B2CBF'),
('SECUNDARIA', 4, '4.° de secundaria', 15, 16, 'Debate, fuentes y aplicación a problemas reales.', '#C44536'),
('SECUNDARIA', 5, '5.° de secundaria', 16, 17, 'Pensamiento crítico, autonomía y proyección ciudadana.', '#3A506B')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), edad_minima = VALUES(edad_minima), edad_maxima = VALUES(edad_maxima), descripcion = VALUES(descripcion), color = VALUES(color);

INSERT INTO areas_curriculares (nivel, codigo, nombre, descripcion) VALUES
('PRIMARIA', 'personal-social', 'Personal Social', 'Identidad, convivencia, historia, territorio, ambiente y economía.'),
('PRIMARIA', 'educacion-fisica', 'Educación Física', 'Motricidad, vida saludable e interacción sociomotriz.'),
('PRIMARIA', 'comunicacion', 'Comunicación', 'Comprensión y producción oral, lectora y escrita.'),
('PRIMARIA', 'arte-cultura', 'Arte y Cultura', 'Apreciación y creación mediante lenguajes artísticos.'),
('PRIMARIA', 'castellano-segunda-lengua', 'Castellano como segunda lengua', 'Comunicación en castellano para estudiantes cuya lengua materna es otra.'),
('PRIMARIA', 'ingles', 'Inglés como lengua extranjera', 'Comprensión y comunicación básica en inglés.'),
('PRIMARIA', 'matematica', 'Matemática', 'Resolución de problemas de cantidad, forma, datos y regularidad.'),
('PRIMARIA', 'ciencia-tecnologia', 'Ciencia y Tecnología', 'Indagación, explicación del mundo y soluciones tecnológicas.'),
('PRIMARIA', 'educacion-religiosa', 'Educación Religiosa', 'Dimensión espiritual y religiosa, respetando la libertad de conciencia.'),
('SECUNDARIA', 'dpcc', 'Desarrollo Personal, Ciudadanía y Cívica', 'Identidad, convivencia democrática, derechos y participación.'),
('SECUNDARIA', 'ciencias-sociales', 'Ciencias Sociales', 'Historia, territorio, ambiente y recursos económicos.'),
('SECUNDARIA', 'educacion-fisica', 'Educación Física', 'Motricidad, vida saludable e interacción sociomotriz.'),
('SECUNDARIA', 'arte-cultura', 'Arte y Cultura', 'Apreciación crítica y proyectos desde los lenguajes artísticos.'),
('SECUNDARIA', 'comunicacion', 'Comunicación', 'Comunicación oral, lectura y escritura en lengua materna.'),
('SECUNDARIA', 'castellano-segunda-lengua', 'Castellano como segunda lengua', 'Comunicación en castellano para estudiantes cuya lengua materna es otra.'),
('SECUNDARIA', 'ingles', 'Inglés como lengua extranjera', 'Comunicación oral, lectura y escritura en inglés.'),
('SECUNDARIA', 'matematica', 'Matemática', 'Problemas de cantidad, regularidad, forma y gestión de datos.'),
('SECUNDARIA', 'ciencia-tecnologia', 'Ciencia y Tecnología', 'Indagación, explicación y diseño de soluciones tecnológicas.'),
('SECUNDARIA', 'educacion-trabajo', 'Educación para el Trabajo', 'Proyectos de emprendimiento económico o social.'),
('SECUNDARIA', 'educacion-religiosa', 'Educación Religiosa', 'Dimensión espiritual y religiosa, respetando la libertad de conciencia.')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion), activa = TRUE;
