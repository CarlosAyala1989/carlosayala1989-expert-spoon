// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const dependencias = vi.hoisted(() => ({
  ejecutar: vi.fn(),
  crearGrupo: vi.fn(),
}))

vi.mock('mysql2/promise', () => ({
  default: {
    createPool: dependencias.crearGrupo,
  },
}))

import { consultarFilas } from '@/lib/base-datos'

describe('consultas de base de datos', () => {
  beforeEach(() => {
    vi.stubEnv('DB_HOST', 'db.local')
    vi.stubEnv('DB_PORT', '3307')
    vi.stubEnv('DB_USER', 'docente')
    vi.stubEnv('DB_PASSWORD', 'secreto-de-prueba')
    vi.stubEnv('DB_NAME', 'educacion')
    dependencias.ejecutar.mockReset()
    dependencias.crearGrupo.mockReturnValue({
      execute: dependencias.ejecutar,
    })
    global.__grupoConexionesEducacion = undefined
  })

  afterEach(() => vi.unstubAllEnvs())

  it('reintenta una lectura cuando una conexión inactiva fue cerrada', async () => {
    dependencias.ejecutar
      .mockRejectedValueOnce(
        Object.assign(new Error('conexión cerrada'), {
          code: 'ECONNRESET',
        }),
      )
      .mockResolvedValueOnce([[{ id: 1 }], []])

    const filas = await consultarFilas('SELECT id FROM aulas')

    expect(filas).toEqual([{ id: 1 }])
    expect(dependencias.ejecutar).toHaveBeenCalledTimes(2)
  })

  it('no reintenta errores que no sean transitorios', async () => {
    dependencias.ejecutar.mockRejectedValueOnce(
      Object.assign(new Error('consulta inválida'), { code: 'ER_PARSE_ERROR' }),
    )

    await expect(consultarFilas('SELECT')).rejects.toThrow('consulta inválida')
    expect(dependencias.ejecutar).toHaveBeenCalledTimes(1)
  })
})
