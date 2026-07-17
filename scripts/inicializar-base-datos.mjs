import mysql from 'mysql2/promise'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const variables = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
const faltantes = variables.filter((nombre) => !process.env[nombre])

if (faltantes.length > 0) {
  console.error(`Faltan variables: ${faltantes.join(', ')}`)
  process.exit(1)
}

const nombreBase = process.env.DB_NAME
if (!/^[a-z0-9_]+$/i.test(nombreBase)) {
  console.error('DB_NAME solo puede contener letras, números y guion bajo.')
  process.exit(1)
}

const conexion = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? {} : undefined,
  multipleStatements: true,
  connectTimeout: 15_000,
})

try {
  await conexion.query(
    `CREATE DATABASE IF NOT EXISTS \`${nombreBase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  )
  await conexion.query(`USE \`${nombreBase}\``)
  const directorioMigraciones = path.join(process.cwd(), 'sql')
  const migraciones = (
    await readdir(directorioMigraciones, { withFileTypes: true })
  )
    .filter(
      (entrada) =>
        entrada.isFile() &&
        /^\d+_.+\.sql$/i.test(entrada.name) &&
        !/_revertir\.sql$/i.test(entrada.name),
    )
    .map((entrada) => entrada.name)
    .sort((primera, segunda) =>
      primera.localeCompare(segunda, 'es', { numeric: true }),
    )

  if (migraciones.length === 0) {
    throw new Error('No se encontraron migraciones SQL para ejecutar.')
  }

  for (const archivo of migraciones) {
    const migracion = await readFile(
      path.join(directorioMigraciones, archivo),
      'utf8',
    )
    await conexion.query(migracion)
    console.log(`Migración aplicada: ${archivo}`)
  }

  const [[conteoAulas]] = await conexion.query(
    'SELECT COUNT(*) AS total FROM aulas',
  )
  const [[conteoAreas]] = await conexion.query(
    'SELECT COUNT(*) AS total FROM areas_curriculares',
  )
  const [[conteoAsignaciones]] = await conexion.query(
    'SELECT COUNT(*) AS total FROM asignaciones_docentes',
  )
  console.log(
    `Base lista: ${nombreBase}. Aulas: ${conteoAulas.total}. Áreas: ${conteoAreas.total}. Asignaciones: ${conteoAsignaciones.total}.`,
  )
} finally {
  await conexion.end()
}
