import { NextResponse } from 'next/server'
import { buscarAsignacionDocente } from '@/lib/asignaciones-docentes'
import { obtenerUsuarioActual } from '@/lib/autenticacion'
import { extraerTextoDocumento } from '@/lib/extraer-documento'
import { analizarSesionConIa } from '@/lib/inteligencia-artificial'
import {
  crearSesionEnAnalisis,
  marcarSesionConError,
  publicarExperiencia,
} from '@/lib/sesiones-aprendizaje'
import { esquemaCarga } from '@/lib/validaciones'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(solicitud: Request) {
  const usuario = await obtenerUsuarioActual()
  if (!usuario)
    return NextResponse.json(
      { error: 'Inicia sesión para continuar.' },
      { status: 401 },
    )

  const origen = solicitud.headers.get('origin')
  if (origen) {
    const hostSolicitud =
      solicitud.headers.get('host') ||
      solicitud.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
      new URL(solicitud.url).host
    try {
      if (new URL(origen).host !== hostSolicitud) {
        return NextResponse.json(
          { error: 'Solicitud no permitida.' },
          { status: 403 },
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Solicitud no permitida.' },
        { status: 403 },
      )
    }
  }

  let sesionId: string | null = null
  try {
    const formulario = await solicitud.formData()
    const archivo = formulario.get('archivo')
    const validacion = esquemaCarga.safeParse({
      aulaId: formulario.get('aulaId'),
      areaId: formulario.get('areaId'),
      modeloIa: formulario.get('modeloIa'),
    })
    if (!(archivo instanceof File) || !validacion.success) {
      return NextResponse.json(
        { error: 'Revisa el aula, el área y el documento.' },
        { status: 400 },
      )
    }

    const asignacion = await buscarAsignacionDocente(
      usuario.id,
      validacion.data.aulaId,
      validacion.data.areaId,
    )
    if (!asignacion) {
      return NextResponse.json(
        {
          error:
            'Ese grado y curso no están guardados en tu configuración docente.',
        },
        { status: 403 },
      )
    }
    const { aula, area } = asignacion

    const texto = await extraerTextoDocumento(archivo)
    sesionId = await crearSesionEnAnalisis({
      usuarioId: usuario.id,
      aulaId: aula.id,
      areaId: area.id,
      nombreArchivo: archivo.name,
      tipoArchivo: archivo.type || 'application/octet-stream',
      tamanoBytes: archivo.size,
      textoExtraido: texto,
    })
    const resultado = await analizarSesionConIa(
      texto,
      aula,
      area,
      validacion.data.modeloIa,
    )
    const experienciaId = await publicarExperiencia({
      sesionId,
      titulo: resultado.experiencia.titulo,
      experiencia: resultado.experiencia,
      modelo: resultado.modelo,
      modo: resultado.modo,
    })

    return NextResponse.json(
      { experienciaId, modo: resultado.modo, modelo: resultado.modelo },
      { status: 201 },
    )
  } catch (error) {
    if (sesionId) {
      try {
        await marcarSesionConError(sesionId, error)
      } catch {
        // La respuesta útil al docente no debe perderse si falla el registro del error.
      }
    }
    const mensaje =
      error instanceof Error ? error.message : 'No se pudo procesar la sesión.'
    return NextResponse.json({ error: mensaje }, { status: 422 })
  }
}
