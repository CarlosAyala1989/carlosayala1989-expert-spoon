CREATE TABLE IF NOT EXISTS asignaciones_docentes (
  usuario_id BIGINT UNSIGNED NOT NULL,
  aula_id BIGINT UNSIGNED NOT NULL,
  area_curricular_id BIGINT UNSIGNED NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, aula_id, area_curricular_id),
  KEY asignaciones_docentes_aula_area_indice (aula_id, area_curricular_id),
  KEY asignaciones_docentes_area_indice (area_curricular_id),
  CONSTRAINT asignaciones_docentes_usuario_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT asignaciones_docentes_aula_fk FOREIGN KEY (aula_id) REFERENCES aulas(id),
  CONSTRAINT asignaciones_docentes_area_fk FOREIGN KEY (area_curricular_id) REFERENCES areas_curriculares(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @crear_indice_sesiones_usuario_fecha = (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX sesiones_usuario_fecha_indice ON sesiones_aprendizaje (usuario_id, creado_en)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sesiones_aprendizaje'
    AND INDEX_NAME = 'sesiones_usuario_fecha_indice'
);
PREPARE crear_indice_sesiones_usuario_fecha FROM @crear_indice_sesiones_usuario_fecha;
EXECUTE crear_indice_sesiones_usuario_fecha;
DEALLOCATE PREPARE crear_indice_sesiones_usuario_fecha;

INSERT IGNORE INTO asignaciones_docentes (usuario_id, aula_id, area_curricular_id)
SELECT DISTINCT usuario_id, aula_id, area_curricular_id
FROM sesiones_aprendizaje;
