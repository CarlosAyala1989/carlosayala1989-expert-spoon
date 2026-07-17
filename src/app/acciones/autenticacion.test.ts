import { beforeEach, describe, expect, it, vi } from 'vitest'

const dependencias = vi.hoisted(() => ({
  ejecutar: vi.fn(),
  consultar: vi.fn(),
  obtenerConexion: vi.fn(),
  crearAcceso: vi.fn(),
  cerrarAcceso: vi.fn(),
  colocarCookieAcceso: vi.fn(),
  insertarAcceso: vi.fn(),
  prepararAcceso: vi.fn(() => ({
    id: 'acceso-1',
    token: 'token-seguro',
    tokenHash: 'hash-token',
    expiraEn: new Date('2030-01-01T00:00:00Z'),
  })),
  obtenerUsuarioActual: vi.fn(),
  validarAsignaciones: vi.fn(),
  insertarAsignaciones: vi.fn(),
  reemplazarAsignaciones: vi.fn(),
  revalidar: vi.fn(),
  redirigir: vi.fn(),
  comparar: vi.fn(),
  generarHash: vi.fn(),
}))

vi.mock('@/lib/base-datos', () => ({
  consultarFilas: dependencias.consultar,
  obtenerBaseDatos: () => ({
    execute: dependencias.ejecutar,
    getConnection: dependencias.obtenerConexion,
  }),
}))

vi.mock('@/lib/autenticacion', () => ({
  crearAcceso: dependencias.crearAcceso,
  cerrarAcceso: dependencias.cerrarAcceso,
  colocarCookieAcceso: dependencias.colocarCookieAcceso,
  insertarAcceso: dependencias.insertarAcceso,
  prepararAcceso: dependencias.prepararAcceso,
  obtenerUsuarioActual: dependencias.obtenerUsuarioActual,
}))

vi.mock('@/lib/asignaciones-docentes', () => ({
  validarAsignacionesCurriculares: dependencias.validarAsignaciones,
  insertarAsignacionesDocente: dependencias.insertarAsignaciones,
  reemplazarAsignacionesDocente: dependencias.reemplazarAsignaciones,
}))

vi.mock('next/cache', () => ({
  revalidatePath: dependencias.revalidar,
}))

vi.mock('next/navigation', () => ({
  redirect: dependencias.redirigir,
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: dependencias.comparar,
    hash: dependencias.generarHash,
  },
}))

import {
  guardarConfiguracionDocente,
  iniciarSesion,
  registrarDocente,
} from '@/app/acciones/autenticacion'

describe('acciones de autenticación', () => {
  beforeEach(() => vi.clearAllMocks())

  it('convierte un error de base de datos en un mensaje seguro', async () => {
    dependencias.consultar.mockRejectedValueOnce(
      new Error('ECONNREFUSED servidor-interno:3307'),
    )
    const formulario = new FormData()
    formulario.set('correo', 'docente@colegio.edu.pe')
    formulario.set('clave', 'clave-segura')

    const resultado = await iniciarSesion({}, formulario)

    expect(resultado).toEqual({
      mensaje: 'No pudimos iniciar sesión. Inténtalo nuevamente.',
    })
    expect(resultado.mensaje).not.toContain('ECONNREFUSED')
    expect(dependencias.crearAcceso).not.toHaveBeenCalled()
    expect(dependencias.redirigir).not.toHaveBeenCalled()
  })

  it.each([
    { tieneAsignaciones: 1, destino: '/panel' },
    { tieneAsignaciones: 0, destino: '/panel/configuracion' },
  ])(
    'redirige al espacio correcto cuando tiene_asignaciones=$tieneAsignaciones',
    async ({ tieneAsignaciones, destino }) => {
      dependencias.consultar.mockResolvedValueOnce([
        {
          id: 8,
          clave_hash: 'hash-guardado',
          tiene_asignaciones: tieneAsignaciones,
        },
      ])
      dependencias.comparar.mockResolvedValueOnce(true)
      const formulario = new FormData()
      formulario.set('correo', 'docente@colegio.edu.pe')
      formulario.set('clave', 'clave-segura')

      await iniciarSesion({}, formulario)

      expect(dependencias.crearAcceso).toHaveBeenCalledWith(8)
      expect(dependencias.redirigir).toHaveBeenCalledWith(destino)
    },
  )

  it('crea usuario, asignaciones y acceso en una sola transacción', async () => {
    const conexion = {
      beginTransaction: vi.fn(),
      execute: vi.fn().mockResolvedValueOnce([{ insertId: 42 }]),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
    }
    dependencias.obtenerConexion.mockResolvedValueOnce(conexion)
    dependencias.validarAsignaciones.mockResolvedValueOnce([
      { aulaId: 1, areaId: 3 },
    ])
    dependencias.generarHash.mockResolvedValueOnce('hash-clave')
    const formulario = new FormData()
    formulario.set('nombre', 'Ana Docente')
    formulario.set('correo', 'ana@colegio.edu.pe')
    formulario.set('clave', 'AulaViva2026')
    formulario.append('aulas', '1')
    formulario.append('asignaciones', '1:3')

    await registrarDocente({}, formulario)

    expect(conexion.beginTransaction).toHaveBeenCalledOnce()
    expect(dependencias.insertarAsignaciones).toHaveBeenCalledWith(
      conexion,
      42,
      [{ aulaId: 1, areaId: 3 }],
    )
    expect(dependencias.insertarAcceso).toHaveBeenCalledWith(
      conexion,
      42,
      expect.objectContaining({ id: 'acceso-1' }),
    )
    expect(conexion.commit).toHaveBeenCalledOnce()
    expect(dependencias.colocarCookieAcceso).toHaveBeenCalledAfter(
      conexion.commit,
    )
    expect(conexion.release).toHaveBeenCalledOnce()
    expect(dependencias.redirigir).toHaveBeenCalledWith('/panel')
  })

  it('guarda la configuración del docente autenticado y revalida el panel', async () => {
    dependencias.obtenerUsuarioActual.mockResolvedValueOnce({ id: 8 })
    dependencias.validarAsignaciones.mockResolvedValueOnce([
      { aulaId: 7, areaId: 10 },
    ])
    const formulario = new FormData()
    formulario.append('aulas', '7')
    formulario.append('asignaciones', '7:10')

    const resultado = await guardarConfiguracionDocente({}, formulario)

    expect(dependencias.reemplazarAsignaciones).toHaveBeenCalledWith(8, [
      { aulaId: 7, areaId: 10 },
    ])
    expect(dependencias.revalidar).toHaveBeenCalledWith('/panel/aulas')
    expect(resultado).toEqual({
      exito: true,
      mensaje: 'Tus grados y cursos quedaron guardados.',
    })
  })
})
