import mysql from 'mysql2/promise'

const variables = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
const faltantes = variables.filter((nombre) => !process.env[nombre])
if (faltantes.length > 0) {
  console.error(`Faltan variables: ${faltantes.join(', ')}`)
  process.exit(1)
}

const conexion = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? {} : undefined,
  connectTimeout: 15_000,
})

try {
  const [[version]] = await conexion.query('SELECT VERSION() AS version')
  const [[aulas]] = await conexion.query('SELECT COUNT(*) AS total FROM aulas')
  const [[areas]] = await conexion.query(
    'SELECT COUNT(*) AS total FROM areas_curriculares',
  )
  const [[asignaciones]] = await conexion.query(
    'SELECT COUNT(*) AS total FROM asignaciones_docentes',
  )
  const [tablas] = await conexion.query(
    `SELECT TABLE_NAME AS nombre
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
    [process.env.DB_NAME],
  )

  console.log(
    JSON.stringify(
      {
        servidor: version.version,
        aulas: aulas.total,
        areas: areas.total,
        asignaciones: asignaciones.total,
        tablas: tablas.map((tabla) => tabla.nombre),
      },
      null,
      2,
    ),
  )
} finally {
  await conexion.end()
}
