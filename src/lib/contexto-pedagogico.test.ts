import { describe, expect, it } from 'vitest'
import {
  analizarContextoPedagogico,
  detectarTituloSesion,
} from '@/lib/contexto-pedagogico'

const sesionEstado = `Sesión de Aprendizaje
Título de la sesión
Somos parte del Estado
Docente: Nombre privado
Secundaria
Primero
Desarrollo personal, ciudadanía y cívica
Capacidad: Vive su sexualidad de manera plena y responsable.
Propósito de la sesión: Los estudiantes comprenderán su papel como ciudadanos y cómo participan en el Estado.
Evidencia de aprendizaje: Escribirán una reflexión y propondrán una acción de participación ciudadana.
Parte teórica del tema:
El Estado organiza instituciones que protegen derechos y permite la participación de la ciudadanía.
Inicio:
Saludo: Hoy conoceremos nuestro papel en la sociedad.
Actividad secundaria: El derecho a la salud forma parte de los derechos ciudadanos.`

describe('contexto pedagógico', () => {
  it('prioriza el título rotulado sobre encabezados y temas aislados', () => {
    expect(detectarTituloSesion(sesionEstado)).toBe('Somos parte del Estado')
  })

  it('separa las anclas pedagógicas y omite datos personales', () => {
    const contexto = analizarContextoPedagogico(sesionEstado)

    expect(contexto.tituloDeclarado).toBe('Somos parte del Estado')
    expect(contexto.proposito).toContain('papel como ciudadanos')
    expect(contexto.evidencia).toContain('reflexión')
    expect(contexto.ideasCentrales).toContain('instituciones')
    expect(contexto.textoParaIa).not.toContain('Nombre privado')
    expect(contexto.textoParaIa).toContain('Saludo')
  })

  it('detecta el título cuando está declarado dentro de una explicación', () => {
    expect(
      detectarTituloSesion(
        'Presentación del Título: El título de la sesión de hoy es “Conocemos nuestra comunidad”.',
      ),
    ).toBe('Conocemos nuestra comunidad')
  })
})
