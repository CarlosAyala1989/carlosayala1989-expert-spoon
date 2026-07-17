import { describe, expect, it } from 'vitest'
import {
  esquemaCarga,
  esquemaRegistro,
  validarFormularioConfiguracionDocente,
  validarFormularioRegistro,
} from '@/lib/validaciones'

describe('validaciones de entrada', () => {
  it('acepta un registro docente válido', () => {
    const resultado = esquemaRegistro.safeParse({
      nombre: 'Ana Docente',
      correo: 'ANA@COLEGIO.EDU.PE',
      clave: 'AulaViva2026',
    })
    expect(resultado.success).toBe(true)
    if (resultado.success)
      expect(resultado.data.correo).toBe('ana@colegio.edu.pe')
  })

  it('rechaza contraseñas débiles e identificadores inválidos', () => {
    expect(
      esquemaRegistro.safeParse({
        nombre: 'A',
        correo: 'incorrecto',
        clave: 'corta',
      }).success,
    ).toBe(false)
    expect(
      esquemaCarga.safeParse({
        aulaId: '-1',
        areaId: '0',
        modeloIa: 'desconocido',
      }).success,
    ).toBe(false)
  })

  it('acepta los proveedores de IA disponibles', () => {
    expect(
      esquemaCarga.safeParse({
        aulaId: '1',
        areaId: '1',
        modeloIa: 'deepseek-v4-pro',
      }).success,
    ).toBe(true)
    expect(
      esquemaCarga.safeParse({
        aulaId: '1',
        areaId: '1',
        modeloIa: 'openai',
      }).success,
    ).toBe(true)
  })

  it('lee varios grados y cursos del formulario de registro', () => {
    const formulario = new FormData()
    formulario.set('nombre', 'Ana Docente')
    formulario.set('correo', 'ana@colegio.edu.pe')
    formulario.set('clave', 'AulaViva2026')
    formulario.append('aulas', '1')
    formulario.append('aulas', '7')
    formulario.append('asignaciones', '1:3')
    formulario.append('asignaciones', '1:8')
    formulario.append('asignaciones', '7:10')

    const resultado = validarFormularioRegistro(formulario)

    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data.aulas).toEqual([1, 7])
      expect(resultado.data.asignaciones).toEqual([
        { aulaId: 1, areaId: 3 },
        { aulaId: 1, areaId: 8 },
        { aulaId: 7, areaId: 10 },
      ])
    }
  })

  it('exige al menos un curso para cada grado seleccionado', () => {
    const formulario = new FormData()
    formulario.append('aulas', '1')
    formulario.append('aulas', '2')
    formulario.append('asignaciones', '1:3')

    const resultado = validarFormularioConfiguracionDocente(formulario)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors.asignaciones).toContain(
        'Selecciona al menos un curso para cada grado.',
      )
    }
  })

  const casosManipulados: Array<{
    nombre: string
    aulas: string[]
    asignaciones: string[]
    campo: 'aulas' | 'asignaciones'
  }> = [
    {
      nombre: 'un grado repetido',
      aulas: ['1', '1'],
      asignaciones: ['1:3'],
      campo: 'aulas',
    },
    {
      nombre: 'un curso repetido',
      aulas: ['1'],
      asignaciones: ['1:3', '1:3'],
      campo: 'asignaciones',
    },
    {
      nombre: 'un curso de un grado no seleccionado',
      aulas: ['1'],
      asignaciones: ['1:3', '2:3'],
      campo: 'asignaciones',
    },
    {
      nombre: 'un par manipulado',
      aulas: ['1'],
      asignaciones: ['1:not-a-number'],
      campo: 'asignaciones',
    },
    {
      nombre: 'un identificador en notación exponencial',
      aulas: ['1e0'],
      asignaciones: ['1:3'],
      campo: 'aulas',
    },
  ]

  it.each(casosManipulados)(
    'rechaza $nombre',
    ({ aulas, asignaciones, campo }) => {
      const formulario = new FormData()
      aulas.forEach((aula) => formulario.append('aulas', aula))
      asignaciones.forEach((asignacion) =>
        formulario.append('asignaciones', asignacion),
      )

      const resultado = validarFormularioConfiguracionDocente(formulario)

      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.flatten().fieldErrors[campo]).toBeDefined()
      }
    },
  )

  it('rechaza una cantidad abusiva de asignaciones', () => {
    const formulario = new FormData()
    formulario.append('aulas', '1')
    for (let areaId = 1; areaId <= 121; areaId += 1) {
      formulario.append('asignaciones', `1:${areaId}`)
    }

    expect(validarFormularioConfiguracionDocente(formulario).success).toBe(
      false,
    )
  })
})
