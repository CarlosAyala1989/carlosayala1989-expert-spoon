-- Esta reversión elimina por completo el esquema inicial y todos sus datos.
-- Antes de ejecutarla en producción, genere y verifique una copia de seguridad.
DROP TABLE IF EXISTS asignaciones_docentes;
DROP TABLE IF EXISTS experiencias;
DROP TABLE IF EXISTS sesiones_aprendizaje;
DROP TABLE IF EXISTS areas_curriculares;
DROP TABLE IF EXISTS aulas;
DROP TABLE IF EXISTS accesos;
DROP TABLE IF EXISTS usuarios;
