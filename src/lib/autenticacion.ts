import 'server-only'

import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import type { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { consultarFilas, obtenerBaseDatos } from '@/lib/base-datos'
import type { UsuarioActual } from '@/tipos/educacion'

const NOMBRE_COOKIE = 'educa_sesion'
const DURACION_SESION_MS = 7 * 24 * 60 * 60 * 1000

interface FilaUsuario extends RowDataPacket, UsuarioActual {}

type EjecutorAcceso = Pick<PoolConnection, 'execute'>

export interface AccesoPreparado {
  id: string
  token: string
  tokenHash: string
  expiraEn: Date
}

function resumirToken(token: string) {
  const secreto = process.env.SESSION_SECRET ?? ''
  if (secreto.length < 24) {
    throw new Error('SESSION_SECRET debe tener al menos 24 caracteres.')
  }
  return createHash('sha256').update(`${token}:${secreto}`).digest('hex')
}

export function prepararAcceso(): AccesoPreparado {
  const token = randomBytes(32).toString('base64url')
  const expiraEn = new Date(Date.now() + DURACION_SESION_MS)

  return {
    id: randomUUID(),
    token,
    tokenHash: resumirToken(token),
    expiraEn,
  }
}

export async function insertarAcceso(
  conexion: EjecutorAcceso,
  usuarioId: number,
  acceso: AccesoPreparado,
) {
  await conexion.execute(
    'INSERT INTO accesos (id, usuario_id, token_hash, expira_en) VALUES (?, ?, ?, ?)',
    [acceso.id, usuarioId, acceso.tokenHash, acceso.expiraEn],
  )
}

export async function colocarCookieAcceso(acceso: AccesoPreparado) {
  const almacenCookies = await cookies()
  almacenCookies.set(NOMBRE_COOKIE, acceso.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: acceso.expiraEn,
    path: '/',
  })
}

export async function crearAcceso(usuarioId: number) {
  const acceso = prepararAcceso()

  await insertarAcceso(obtenerBaseDatos(), usuarioId, acceso)
  await colocarCookieAcceso(acceso)
}

export async function cerrarAcceso() {
  const almacenCookies = await cookies()
  const token = almacenCookies.get(NOMBRE_COOKIE)?.value
  if (token) {
    await obtenerBaseDatos().execute(
      'DELETE FROM accesos WHERE token_hash = ?',
      [resumirToken(token)],
    )
  }
  almacenCookies.delete(NOMBRE_COOKIE)
}

export async function obtenerUsuarioActual(): Promise<UsuarioActual | null> {
  const token = (await cookies()).get(NOMBRE_COOKIE)?.value
  if (!token) return null

  const filas = await consultarFilas<FilaUsuario[]>(
    `SELECT u.id, u.nombre, u.correo, u.rol
     FROM accesos a
     INNER JOIN usuarios u ON u.id = a.usuario_id
     WHERE a.token_hash = ? AND a.expira_en > NOW()
     LIMIT 1`,
    [resumirToken(token)],
  )

  return filas[0] ?? null
}
