import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  analizarSesionConIa,
  conservarTituloDeclarado,
  crearMensajeSesion,
  crearExperienciaDemostracion,
  esquemaExperiencia,
  esquemaExperienciaGenerada,
  interpretarJsonDeepSeek,
} from '@/lib/inteligencia-artificial'
import type { AreaCurricular, Aula } from '@/tipos/educacion'

const area: AreaCurricular = {
  id: 1,
  nivel: 'PRIMARIA',
  codigo: 'personal-social',
  nombre: 'Personal Social',
  descripcion: 'Identidad y cuidado personal',
}

const primaria: Aula = {
  id: 1,
  nivel: 'PRIMARIA',
  grado: 1,
  nombre: '1.° de primaria',
  edad_minima: 6,
  edad_maxima: 7,
  descripcion: 'Exploración guiada',
  color: '#F6B73C',
}

describe('generador de experiencias', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('detecta una escena de higiene a partir de la sesión', () => {
    const experiencia = crearExperienciaDemostracion(
      'Cuidado del cuerpo. Aprendemos a bañarnos y usar jabón todos los días.',
      primaria,
      area,
    )

    expect(experiencia.tema_visual).toBe('higiene')
    expect(esquemaExperiencia.safeParse(experiencia).success).toBe(true)
    expect(esquemaExperienciaGenerada.safeParse(experiencia).success).toBe(true)
    const visualizaciones = [
      experiencia.visualizacion_portada,
      ...experiencia.pasos.map((paso) => paso.visualizacion),
      experiencia.visualizacion_cierre,
    ]
    expect(visualizaciones).toHaveLength(experiencia.pasos.length + 2)
    visualizaciones.forEach((visualizacion) => {
      expect(visualizacion).toBeDefined()
      expect(visualizacion?.elementos.length).toBeGreaterThanOrEqual(2)
      expect(visualizacion?.elementos.length).toBeLessThanOrEqual(4)
    })
  })

  it('prioriza el tema declarado y no confunde saludo o salud con higiene', () => {
    const secundaria: Aula = {
      ...primaria,
      id: 7,
      nivel: 'SECUNDARIA',
      nombre: '1.° de secundaria',
      edad_minima: 12,
      edad_maxima: 13,
    }
    const areaSecundaria: AreaCurricular = {
      ...area,
      id: 10,
      nivel: 'SECUNDARIA',
      nombre: 'Desarrollo Personal, Ciudadanía y Cívica',
    }
    const experiencia = crearExperienciaDemostracion(
      `Sesión de Aprendizaje
Título de la sesión
Somos parte del Estado
Capacidad: Vive su sexualidad de manera plena y responsable.
Propósito de la sesión: Comprender el papel de los ciudadanos y su participación en el Estado.
Evidencia de aprendizaje: Elaborar una reflexión sobre derechos y responsabilidades.
Saludo: Bienvenidos. El derecho a la salud es un ejemplo secundario.`,
      secundaria,
      areaSecundaria,
    )

    expect(experiencia.titulo).toBe('Somos parte del Estado')
    expect(experiencia.tema_visual).toBe('ciudadania')
    expect(experiencia.objetivo).toContain('papel de los ciudadanos')
    expect(experiencia.introduccion).toContain('decisión fundamentada')
    const contenidoVisual = JSON.stringify([
      experiencia.visualizacion_portada,
      experiencia.pasos.map((paso) => paso.visualizacion),
      experiencia.visualizacion_cierre,
    ])
    expect(contenidoVisual).toMatch(
      /estado|ciudadan|derech|responsab|instituci|particip/i,
    )
    expect(contenidoVisual).not.toMatch(
      /estrella|planeta|galaxia|[oó]rbita|cubo|esfera/i,
    )
  })

  it('envía solo texto organizado y anclas pedagógicas al proveedor', () => {
    const mensaje = crearMensajeSesion(
      `Título de la sesión
Somos parte del Estado
Docente: Nombre privado
Propósito de la sesión: Comprender la participación ciudadana.
Evidencia de aprendizaje: Proponer una acción para la comunidad.
Parte teórica del tema: El Estado organiza instituciones.
Inicio: Saludo al grupo.`,
      primaria,
      area,
    )

    expect(mensaje).toContain('TÍTULO DECLARADO: Somos parte del Estado')
    expect(mensaje).toContain('INICIO DEL DOCUMENTO EXTRAÍDO COMO TEXTO')
    expect(mensaje).toContain('FIN DEL DOCUMENTO EXTRAÍDO COMO TEXTO')
    expect(mensaje).not.toContain('Nombre privado')
    expect(mensaje).not.toContain('base64')
  })

  it('conserva literalmente el título declarado aunque la IA lo parafrasee', () => {
    const experiencia = crearExperienciaDemostracion(
      'Participación ciudadana en el Estado.',
      primaria,
      area,
    )
    experiencia.titulo = 'Nuestra identidad y participación en el Estado'

    const corregida = conservarTituloDeclarado(
      experiencia,
      `Título de la sesión
Somos parte del Estado
Propósito de la sesión: Comprender la participación de la ciudadanía.`,
    )

    expect(corregida.titulo).toBe('Somos parte del Estado')
  })

  it('adapta la narrativa entre primaria y secundaria', () => {
    const secundaria: Aula = {
      ...primaria,
      id: 7,
      nivel: 'SECUNDARIA',
      nombre: '1.° de secundaria',
      edad_minima: 12,
      edad_maxima: 13,
    }
    const areaSecundaria = {
      ...area,
      nivel: 'SECUNDARIA' as const,
      nombre: 'Desarrollo Personal, Ciudadanía y Cívica',
    }

    const experienciaPrimaria = crearExperienciaDemostracion(
      'Participación y cuidado de la comunidad escolar.',
      primaria,
      area,
    )
    const experienciaSecundaria = crearExperienciaDemostracion(
      'Participación y cuidado de la comunidad escolar.',
      secundaria,
      areaSecundaria,
    )

    expect(experienciaPrimaria.introduccion).toContain('misión')
    expect(experienciaSecundaria.introduccion).toContain(
      'decisión fundamentada',
    )
    expect(experienciaPrimaria.personaje).not.toBe(
      experienciaSecundaria.personaje,
    )
  })

  it('valida la salida JSON compatible con DeepSeek', () => {
    const experiencia = crearExperienciaDemostracion(
      'Cuidado del cuerpo con agua y jabón todos los días.',
      primaria,
      area,
    )
    const interpretada = interpretarJsonDeepSeek(
      `Respuesta JSON:\n${JSON.stringify(experiencia)}`,
    )

    expect(interpretada.titulo).toBe(experiencia.titulo)
    expect(() => interpretarJsonDeepSeek('respuesta sin JSON')).toThrow(
      'objeto JSON válido',
    )
  })

  it('acepta emojis compuestos sin relajar el resto del esquema', () => {
    const experiencia = crearExperienciaDemostracion(
      'Cuidado del cuerpo con agua y jabón todos los días.',
      primaria,
      area,
    )
    experiencia.pasos[0].icono = '👩‍⚖️'

    expect(() =>
      interpretarJsonDeepSeek(JSON.stringify(experiencia)),
    ).not.toThrow()
  })

  it('mantiene compatibilidad de lectura sin debilitar las generaciones nuevas', () => {
    const experienciaAntigua = crearExperienciaDemostracion(
      'Cuidado del cuerpo con agua y jabón todos los días.',
      primaria,
      area,
    )
    delete experienciaAntigua.visualizacion_portada
    delete experienciaAntigua.visualizacion_cierre
    experienciaAntigua.pasos.forEach((paso) => delete paso.visualizacion)

    expect(esquemaExperiencia.safeParse(experienciaAntigua).success).toBe(true)
    expect(
      esquemaExperienciaGenerada.safeParse(experienciaAntigua).success,
    ).toBe(false)
  })

  it('indica la ruta exacta si DeepSeek omite la visualización de un panel', () => {
    const experiencia = crearExperienciaDemostracion(
      'Cuidado del cuerpo con agua y jabón todos los días.',
      primaria,
      area,
    )
    delete experiencia.pasos[1].visualizacion

    expect(() => interpretarJsonDeepSeek(JSON.stringify(experiencia))).toThrow(
      'pasos.1.visualizacion',
    )
  })

  it('conserva OpenAI como proveedor elegido en la demostración local', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')

    const resultado = await analizarSesionConIa(
      'Cuidado del cuerpo con agua y jabón todos los días.',
      primaria,
      area,
      'openai',
    )

    expect(resultado.modo).toBe('DEMOSTRACION')
    expect(resultado.modelo).toBe('openai-respaldo-local')
  })
})
