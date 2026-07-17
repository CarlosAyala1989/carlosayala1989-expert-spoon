'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise'
import {
  type AccesoPreparado,
  cerrarAcceso,
  colocarCookieAcceso,
  crearAcceso,
  insertarAcceso,
  obtenerUsuarioActual,
  prepararAcceso,
} from '@/lib/autenticacion'
import {
  insertarAsignacionesDocente,
  reemplazarAsignacionesDocente,
  validarAsignacionesCurriculares,
} from '@/lib/asignaciones-docentes'
import { consultarFilas, obtenerBaseDatos } from '@/lib/base-datos'
import {
  esquemaIngreso,
  validarFormularioConfiguracionDocente,
  validarFormularioRegistro,
} from '@/lib/validaciones'

export interface EstadoAutenticacion {
  mensaje?: string
  errores?: Record<string, string[]>
  exito?: boolean
}

interface FilaCredencial extends RowDataPacket {
  id: number
  clave_hash: string
  tiene_asignaciones: number | boolean
}

export async function registrarDocente(
  _estado: EstadoAutenticacion,
  formulario: FormData,
): Promise<EstadoAutenticacion> {
  const validacion = validarFormularioRegistro(formulario)

  if (!validacion.success) {
    return { errores: validacion.error.flatten().fieldErrors }
  }

  const { nombre, correo, clave, asignaciones } = validacion.data
  let asignacionesValidadas
  try {
    asignacionesValidadas = await validarAsignacionesCurriculares(asignaciones)
  } catch {
    return {
      errores: {
        asignaciones: [
          'Revisa los grados y cursos seleccionados e inténtalo nuevamente.',
        ],
      },
    }
  }

  let conexion: PoolConnection | undefined
  let transaccionIniciada = false
  let transaccionConfirmada = false
  let acceso: AccesoPreparado
  try {
    acceso = prepararAcceso()
  } catch {
    return { mensaje: 'No pudimos crear tu cuenta. Inténtalo nuevamente.' }
  }
  try {
    const claveHash = await bcrypt.hash(clave, 12)
    conexion = await obtenerBaseDatos().getConnection()
    await conexion.beginTransaction()
    transaccionIniciada = true

    const [resultado] = await conexion.execute<ResultSetHeader>(
      `INSERT INTO usuarios (nombre, correo, clave_hash, rol)
       VALUES (?, ?, ?, 'DOCENTE')`,
      [nombre, correo, claveHash],
    )
    await insertarAsignacionesDocente(
      conexion,
      resultado.insertId,
      asignacionesValidadas,
    )
    await insertarAcceso(conexion, resultado.insertId, acceso)
    await conexion.commit()
    transaccionConfirmada = true
  } catch (error) {
    if (conexion && transaccionIniciada && !transaccionConfirmada) {
      await conexion.rollback()
    }
    const codigo =
      typeof error === 'object' && error && 'code' in error
        ? error.code
        : undefined
    if (codigo === 'ER_DUP_ENTRY') {
      return { mensaje: 'Ya existe una cuenta con ese correo.' }
    }
    return { mensaje: 'No pudimos crear tu cuenta. Inténtalo nuevamente.' }
  } finally {
    conexion?.release()
  }

  try {
    await colocarCookieAcceso(acceso)
  } catch {
    return {
      mensaje:
        'Tu cuenta fue creada, pero no pudimos iniciar la sesión. Ingresa con tu correo y contraseña.',
    }
  }

  redirect('/panel')
}

export async function guardarConfiguracionDocente(
  _estado: EstadoAutenticacion,
  formulario: FormData,
): Promise<EstadoAutenticacion> {
  const usuario = await obtenerUsuarioActual()
  if (!usuario) redirect('/ingresar')

  const validacion = validarFormularioConfiguracionDocente(formulario)
  if (!validacion.success) {
    return { errores: validacion.error.flatten().fieldErrors }
  }

  try {
    const asignaciones = await validarAsignacionesCurriculares(
      validacion.data.asignaciones,
    )
    await reemplazarAsignacionesDocente(usuario.id, asignaciones)
  } catch {
    return {
      mensaje:
        'No pudimos guardar tus grados y cursos. Revisa la selección e inténtalo nuevamente.',
    }
  }

  revalidatePath('/panel')
  revalidatePath('/panel/aulas')
  revalidatePath('/panel/areas-curriculares')
  revalidatePath('/panel/configuracion')

  return {
    exito: true,
    mensaje: 'Tus grados y cursos quedaron guardados.',
  }
}

export async function iniciarSesion(
  _estado: EstadoAutenticacion,
  formulario: FormData,
): Promise<EstadoAutenticacion> {
  const validacion = esquemaIngreso.safeParse({
    correo: formulario.get('correo'),
    clave: formulario.get('clave'),
  })

  if (!validacion.success) {
    return { errores: validacion.error.flatten().fieldErrors }
  }

  let destino = '/panel'
  try {
    const filas = await consultarFilas<FilaCredencial[]>(
      `SELECT u.id, u.clave_hash,
        EXISTS(
          SELECT 1 FROM asignaciones_docentes ad WHERE ad.usuario_id = u.id
        ) AS tiene_asignaciones
       FROM usuarios u WHERE u.correo = ? LIMIT 1`,
      [validacion.data.correo],
    )
    const usuario = filas[0]
    const coincide = usuario
      ? await bcrypt.compare(validacion.data.clave, usuario.clave_hash)
      : false

    if (!usuario || !coincide) {
      return { mensaje: 'El correo o la contraseña no son correctos.' }
    }

    await crearAcceso(usuario.id)
    destino = Boolean(usuario.tiene_asignaciones)
      ? '/panel'
      : '/panel/configuracion'
  } catch {
    return { mensaje: 'No pudimos iniciar sesión. Inténtalo nuevamente.' }
  }

  redirect(destino)
}

export async function salir() {
  await cerrarAcceso()
  redirect('/')
}
