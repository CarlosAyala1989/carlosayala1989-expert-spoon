import { beforeEach, describe, expect, it, vi } from 'vitest'

const dependencias = vi.hoisted(() => ({
  consultarFilas: vi.fn(),
  obtenerConexion: vi.fn(),
}))

vi.mock('@/lib/base-datos', () => ({
  consultarFilas: dependencias.consultarFilas,
  obtenerBaseDatos: () => ({ getConnection: dependencias.obtenerConexion }),
}))

import {
  buscarAsignacionDocente,
  docenteTieneAsignacion,
  listarAreasAulaDocente,
  listarAsignacionesDocente,
  reemplazarAsignacionesDocente,
  validarAsignacionesCurriculares,
} from '@/lib/asignaciones-docentes'

const filaAsignacion = {
  aula_id: 1,
  aula_nivel: 'PRIMARIA',
  aula_grado: 1,
  aula_nombre: '1.° de primaria',
  aula_edad_minima: 6,
  aula_edad_maxima: 7,
  aula_descripcion: 'Exploración guiada',
  aula_color: '#F6B73C',
  area_id: 3,
  area_nivel: 'PRIMARIA',
  area_codigo: 'comunicacion',
  area_nombre: 'Comunicación',
  area_descripcion: 'Comprensión y producción oral.',
}

describe('asignaciones docentes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('lista las asignaciones con el aula y el área anidadas', async () => {
    dependencias.consultarFilas.mockResolvedValueOnce([filaAsignacion])

    await expect(listarAsignacionesDocente(9)).resolves.toEqual([
      {
        aula: {
          id: 1,
          nivel: 'PRIMARIA',
          grado: 1,
          nombre: '1.° de primaria',
          edad_minima: 6,
          edad_maxima: 7,
          descripcion: 'Exploración guiada',
          color: '#F6B73C',
        },
        area: {
          id: 3,
          nivel: 'PRIMARIA',
          codigo: 'comunicacion',
          nombre: 'Comunicación',
          descripcion: 'Comprensión y producción oral.',
        },
      },
    ])
    expect(dependencias.consultarFilas).toHaveBeenCalledWith(
      expect.stringContaining('WHERE ad.usuario_id = ?'),
      [9],
    )
  })

  it('lista solo las áreas activas asignadas al aula solicitada', async () => {
    const area = {
      id: 3,
      nivel: 'PRIMARIA',
      codigo: 'comunicacion',
      nombre: 'Comunicación',
      descripcion: 'Comprensión y producción oral.',
    }
    dependencias.consultarFilas.mockResolvedValueOnce([area])

    await expect(listarAreasAulaDocente(9, 1)).resolves.toEqual([area])
    expect(dependencias.consultarFilas).toHaveBeenCalledWith(
      expect.stringContaining('ad.aula_id = ?'),
      [9, 1],
    )
  })

  it('busca y comprueba la pertenencia de una asignación', async () => {
    dependencias.consultarFilas
      .mockResolvedValueOnce([filaAsignacion])
      .mockResolvedValueOnce([{ existe: 1 }])

    await expect(buscarAsignacionDocente(9, 1, 3)).resolves.toMatchObject({
      aula: { id: 1 },
      area: { id: 3 },
    })
    await expect(docenteTieneAsignacion(9, 1, 3)).resolves.toBe(true)
    await expect(docenteTieneAsignacion(0, 1, 3)).resolves.toBe(false)
    expect(dependencias.consultarFilas).toHaveBeenCalledTimes(2)
  })

  it('valida los catálogos, el nivel y elimina pares repetidos', async () => {
    dependencias.consultarFilas
      .mockResolvedValueOnce([{ id: 1, nivel: 'PRIMARIA' }])
      .mockResolvedValueOnce([
        { id: 3, nivel: 'PRIMARIA', activa: 1 },
        { id: 4, nivel: 'PRIMARIA', activa: true },
      ])

    await expect(
      validarAsignacionesCurriculares([
        { aulaId: 1, areaId: 3 },
        { aulaId: 1, areaId: 3 },
        { aulaId: 1, areaId: 4 },
      ]),
    ).resolves.toEqual([
      { aulaId: 1, areaId: 3 },
      { aulaId: 1, areaId: 4 },
    ])
  })

  it('rechaza áreas inactivas o de un nivel educativo diferente', async () => {
    dependencias.consultarFilas
      .mockResolvedValueOnce([{ id: 1, nivel: 'PRIMARIA' }])
      .mockResolvedValueOnce([{ id: 10, nivel: 'PRIMARIA', activa: 0 }])
    await expect(
      validarAsignacionesCurriculares([{ aulaId: 1, areaId: 10 }]),
    ).rejects.toThrow('no está activa')

    dependencias.consultarFilas
      .mockResolvedValueOnce([{ id: 1, nivel: 'PRIMARIA' }])
      .mockResolvedValueOnce([{ id: 11, nivel: 'SECUNDARIA', activa: 1 }])
    await expect(
      validarAsignacionesCurriculares([{ aulaId: 1, areaId: 11 }]),
    ).rejects.toThrow('mismo nivel educativo')
  })

  it('reemplaza todas las asignaciones dentro de una transacción', async () => {
    dependencias.consultarFilas
      .mockResolvedValueOnce([{ id: 1, nivel: 'PRIMARIA' }])
      .mockResolvedValueOnce([{ id: 3, nivel: 'PRIMARIA', activa: 1 }])
    const conexion = {
      beginTransaction: vi.fn(),
      execute: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 9 }], []])
        .mockResolvedValueOnce([{ affectedRows: 2 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
    }
    dependencias.obtenerConexion.mockResolvedValueOnce(conexion)

    await reemplazarAsignacionesDocente(9, [{ aulaId: 1, areaId: 3 }])

    expect(conexion.beginTransaction).toHaveBeenCalledOnce()
    expect(conexion.execute).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM asignaciones_docentes WHERE usuario_id = ?',
      [9],
    )
    expect(conexion.execute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO asignaciones_docentes'),
      [9, 1, 3],
    )
    expect(conexion.commit).toHaveBeenCalledOnce()
    expect(conexion.rollback).not.toHaveBeenCalled()
    expect(conexion.release).toHaveBeenCalledOnce()
  })

  it('revierte la transacción si no puede reemplazar las asignaciones', async () => {
    dependencias.consultarFilas
      .mockResolvedValueOnce([{ id: 1, nivel: 'PRIMARIA' }])
      .mockResolvedValueOnce([{ id: 3, nivel: 'PRIMARIA', activa: 1 }])
    const error = new Error('No se pudo guardar')
    const conexion = {
      beginTransaction: vi.fn(),
      execute: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 9 }], []])
        .mockRejectedValueOnce(error),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
    }
    dependencias.obtenerConexion.mockResolvedValueOnce(conexion)

    await expect(
      reemplazarAsignacionesDocente(9, [{ aulaId: 1, areaId: 3 }]),
    ).rejects.toThrow(error)
    expect(conexion.rollback).toHaveBeenCalledOnce()
    expect(conexion.commit).not.toHaveBeenCalled()
    expect(conexion.release).toHaveBeenCalledOnce()
  })
})
