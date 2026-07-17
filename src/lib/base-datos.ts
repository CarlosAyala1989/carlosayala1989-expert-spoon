import 'server-only'

import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise'

type ValorConsulta = string | number | bigint | boolean | Date | null | Buffer

declare global {
  var __grupoConexionesEducacion: Pool | undefined
}

const CODIGOS_REINTENTO_LECTURA = new Set([
  'ECONNRESET',
  'EPIPE',
  'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST',
])

function esFalloTransitorioConexion(causa: unknown) {
  return (
    typeof causa === 'object' &&
    causa !== null &&
    'code' in causa &&
    typeof causa.code === 'string' &&
    CODIGOS_REINTENTO_LECTURA.has(causa.code)
  )
}

function crearGrupoConexiones() {
  const variables = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
  const faltantes = variables.filter((nombre) => !process.env[nombre])

  if (faltantes.length > 0) {
    throw new Error(
      `Configuración de base de datos incompleta: ${faltantes.join(', ')}`,
    )
  }

  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? {} : undefined,
    waitForConnections: true,
    connectionLimit: 3,
    maxIdle: 3,
    idleTimeout: 60_000,
    queueLimit: 0,
    enableKeepAlive: true,
  })
}

export function obtenerBaseDatos() {
  if (!global.__grupoConexionesEducacion) {
    global.__grupoConexionesEducacion = crearGrupoConexiones()
  }
  return global.__grupoConexionesEducacion
}

export async function consultarFilas<T extends RowDataPacket[]>(
  consulta: string,
  valores: ValorConsulta[] = [],
) {
  for (let intento = 0; intento < 3; intento += 1) {
    try {
      const [filas] = await obtenerBaseDatos().execute<T>(consulta, valores)
      return filas
    } catch (causa) {
      if (intento === 2 || !esFalloTransitorioConexion(causa)) throw causa
      await new Promise((resolver) => setTimeout(resolver, 50 * (intento + 1)))
    }
  }

  throw new Error('No se pudo completar la consulta de lectura.')
}
