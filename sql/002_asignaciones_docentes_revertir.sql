SET @eliminar_indice_sesiones_usuario_fecha = (
  SELECT IF(
    COUNT(*) = 0,
    'SELECT 1',
    'DROP INDEX sesiones_usuario_fecha_indice ON sesiones_aprendizaje'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sesiones_aprendizaje'
    AND INDEX_NAME = 'sesiones_usuario_fecha_indice'
);
PREPARE eliminar_indice_sesiones_usuario_fecha FROM @eliminar_indice_sesiones_usuario_fecha;
EXECUTE eliminar_indice_sesiones_usuario_fecha;
DEALLOCATE PREPARE eliminar_indice_sesiones_usuario_fecha;

DROP TABLE IF EXISTS asignaciones_docentes;
