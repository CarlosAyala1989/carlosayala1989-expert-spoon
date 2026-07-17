// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const dependencias = vi.hoisted(() => ({
  obtenerUsuarioActual: vi.fn(),
  buscarAsignacionDocente: vi.fn(),
  extraerTextoDocumento: vi.fn(),
  analizarSesionConIa: vi.fn(),
  crearSesionEnAnalisis: vi.fn(),
  marcarSesionConError: vi.fn(),
  publicarExperiencia: vi.fn(),
}))

vi.mock('@/lib/autenticacion', () => ({
  obtenerUsuarioActual: dependencias.obtenerUsuarioActual,
}))
vi.mock('@/lib/asignaciones-docentes', () => ({
  buscarAsignacionDocente: dependencias.buscarAsignacionDocente,
}))
vi.mock('@/lib/extraer-documento', () => ({
  extraerTextoDocumento: dependencias.extraerTextoDocumento,
}))
vi.mock('@/lib/inteligencia-artificial', () => ({
  analizarSesionConIa: dependencias.analizarSesionConIa,
}))
vi.mock('@/lib/sesiones-aprendizaje', () => ({
  crearSesionEnAnalisis: dependencias.crearSesionEnAnalisis,
  marcarSesionConError: dependencias.marcarSesionConError,
  publicarExperiencia: dependencias.publicarExperiencia,
}))

import { POST } from '@/app/api/v1/sesiones/route'

const aula = {
  id: 1,
  nivel: 'PRIMARIA' as const,
  grado: 1,
  nombre: '1.° de primaria',
  edad_minima: 6,
  edad_maxima: 7,
  descripcion: 'Exploración guiada',
  color: '#F6B73C',
}

const area = {
  id: 2,
  nivel: 'PRIMARIA' as const,
  codigo: 'personal-social',
  nombre: 'Personal Social',
  descripcion: 'Identidad y convivencia',
}

const visualizacion = {
  tipo: 'secuencia_animada',
  titulo: 'Hábitos que protegen el cuerpo',
  elementos: [
    {
      etiqueta: 'Agua',
      descripcion: 'Retira la suciedad durante el aseo.',
      icono: '💧',
    },
    {
      etiqueta: 'Jabón',
      descripcion: 'Ayuda a limpiar correctamente la piel.',
      icono: '🧼',
    },
  ],
}

const experienciaGenerada = {
  titulo: 'Cuidamos nuestro cuerpo',
  visualizacion_portada: visualizacion,
  pasos: [{ titulo: 'Nos aseamos', visualizacion }],
  visualizacion_cierre: visualizacion,
}

function crearSolicitud(
  modeloIa = 'deepseek-v4-pro',
  origen = 'http://localhost:3000',
  host = 'localhost:3000',
) {
  const formulario = new FormData()
  formulario.set('aulaId', '1')
  formulario.set('areaId', '2')
  formulario.set('modeloIa', modeloIa)
  formulario.set(
    'archivo',
    new File(['contenido suficiente'], 'sesion.pdf', {
      type: 'application/pdf',
    }),
  )
  return new Request('http://localhost:3000/api/v1/sesiones', {
    method: 'POST',
    headers: { origin: origen, host },
    body: formulario,
  })
}

describe('POST /api/v1/sesiones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dependencias.obtenerUsuarioActual.mockResolvedValue({
      id: 9,
      nombre: 'Docente de prueba',
      correo: 'docente@example.com',
      rol: 'DOCENTE',
    })
    dependencias.buscarAsignacionDocente.mockResolvedValue({ aula, area })
    dependencias.extraerTextoDocumento.mockResolvedValue(
      'Texto extraído de una sesión sobre el cuidado del cuerpo.',
    )
    dependencias.crearSesionEnAnalisis.mockResolvedValue('sesion-1')
    dependencias.analizarSesionConIa.mockResolvedValue({
      experiencia: experienciaGenerada,
      modelo: 'deepseek-v4-pro',
      modo: 'IA',
    })
    dependencias.publicarExperiencia.mockResolvedValue('experiencia-1')
    dependencias.marcarSesionConError.mockResolvedValue(undefined)
  })

  it('envía a la IA el modelo elegido y publica la experiencia', async () => {
    const respuesta = await POST(crearSolicitud('deepseek-v4-pro'))
    const cuerpo = await respuesta.json()

    expect(respuesta.status).toBe(201)
    expect(dependencias.analizarSesionConIa).toHaveBeenCalledWith(
      expect.stringContaining('cuidado del cuerpo'),
      aula,
      area,
      'deepseek-v4-pro',
    )
    expect(dependencias.publicarExperiencia).toHaveBeenCalledWith(
      expect.objectContaining({
        sesionId: 'sesion-1',
        experiencia: experienciaGenerada,
      }),
    )
    expect(cuerpo).toMatchObject({
      experienciaId: 'experiencia-1',
      modelo: 'deepseek-v4-pro',
    })
  })

  it('acepta el origen de la IP local usada por el teléfono', async () => {
    const respuesta = await POST(
      crearSolicitud(
        'deepseek-v4-pro',
        'http://192.168.1.27:3016',
        '192.168.1.27:3016',
      ),
    )

    expect(respuesta.status).toBe(201)
  })

  it('rechaza la carga cuando no existe una sesión autenticada', async () => {
    dependencias.obtenerUsuarioActual.mockResolvedValue(null)

    const respuesta = await POST(crearSolicitud())

    expect(respuesta.status).toBe(401)
    expect(dependencias.extraerTextoDocumento).not.toHaveBeenCalled()
  })

  it('rechaza un grado y curso que no pertenecen al docente', async () => {
    dependencias.buscarAsignacionDocente.mockResolvedValue(null)

    const respuesta = await POST(crearSolicitud())
    const cuerpo = await respuesta.json()

    expect(respuesta.status).toBe(403)
    expect(cuerpo.error).toContain('configuración docente')
    expect(dependencias.extraerTextoDocumento).not.toHaveBeenCalled()
  })

  it('mantiene una respuesta útil aunque falle el registro del error', async () => {
    dependencias.analizarSesionConIa.mockRejectedValue(
      new Error('Proveedor no disponible.'),
    )
    dependencias.marcarSesionConError.mockRejectedValue(
      new Error('Base de datos no disponible.'),
    )

    const respuesta = await POST(crearSolicitud())
    const cuerpo = await respuesta.json()

    expect(respuesta.status).toBe(422)
    expect(cuerpo.error).toBe('Proveedor no disponible.')
  })
})
