// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const dependencias = vi.hoisted(() => ({
  ejecutar: vi.fn(),
}))

vi.mock('@/lib/base-datos', () => ({
  obtenerBaseDatos: () => ({ execute: dependencias.ejecutar }),
  consultarFilas: vi.fn(),
}))

import { crearSesionEnAnalisis } from '@/lib/sesiones-aprendizaje'

const datos = {
  usuarioId: 9,
  aulaId: 2,
  areaId: 4,
  nombreArchivo: 'sesion.docx',
  tipoArchivo:
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  tamanoBytes: 1200,
  textoExtraido: 'Contenido suficiente de la sesión de aprendizaje.',
}

describe('persistencia de sesiones', () => {
  beforeEach(() => vi.clearAllMocks())

  it('crea la sesión desde una asignación vigente del docente', async () => {
    dependencias.ejecutar.mockResolvedValueOnce([{ affectedRows: 1 }, []])

    const id = await crearSesionEnAnalisis(datos)

    expect(id).toEqual(expect.any(String))
    expect(dependencias.ejecutar).toHaveBeenCalledWith(
      expect.stringContaining('FROM asignaciones_docentes'),
      expect.arrayContaining([datos.usuarioId, datos.aulaId, datos.areaId]),
    )
  })

  it('rechaza la creación si la asignación dejó de pertenecer al docente', async () => {
    dependencias.ejecutar.mockResolvedValueOnce([{ affectedRows: 0 }, []])

    await expect(crearSesionEnAnalisis(datos)).rejects.toThrow(
      'ya no forman parte de tu configuración docente',
    )
  })
})
