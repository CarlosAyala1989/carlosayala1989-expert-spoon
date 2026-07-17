import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { ExperienciaInteractiva } from '@/componentes/experiencia-interactiva'
import { crearExperienciaDemostracion } from '@/lib/inteligencia-artificial'
import type { AreaCurricular, Aula } from '@/tipos/educacion'

const aula: Aula = {
  id: 1,
  nivel: 'PRIMARIA',
  grado: 1,
  nombre: '1.° de primaria',
  edad_minima: 6,
  edad_maxima: 7,
  descripcion: 'Exploración guiada',
  color: '#F6B73C',
}

const area: AreaCurricular = {
  id: 1,
  nivel: 'PRIMARIA',
  codigo: 'personal-social',
  nombre: 'Personal Social',
  descripcion: 'Identidad y cuidado personal',
}

describe('experiencia interactiva', () => {
  beforeEach(() => vi.stubGlobal('scrollTo', vi.fn()))
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('permite recorrer los pasos, responder y reiniciar', () => {
    const experiencia = crearExperienciaDemostracion(
      'Cuidado del cuerpo con agua y jabón todos los días.',
      aula,
      area,
    )
    render(
      <ExperienciaInteractiva
        experiencia={experiencia}
        aula={aula.nombre}
        area={area.nombre}
        nivel="PRIMARIA"
        modo="IA"
        modelo="deepseek-v4-pro"
      />,
    )

    expect(screen.getAllByTestId('visualizacion-pedagogica')).toHaveLength(1)
    expect(
      within(screen.getByTestId('visualizacion-pedagogica')).getByRole(
        'heading',
        { name: experiencia.visualizacion_portada?.titulo },
      ),
    ).toBeVisible()
    expect(document.querySelector('canvas')).not.toBeInTheDocument()
    expect(screen.queryByText('Arrastra para explorar')).not.toBeInTheDocument()
    expect(screen.getByText('Creado con DeepSeek V4 Pro')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Comenzar/ }))

    experiencia.pasos.forEach((paso, indice) => {
      expect(
        screen.getByRole('heading', { name: paso.titulo, level: 2 }),
      ).toBeVisible()
      expect(screen.getAllByTestId('visualizacion-pedagogica')).toHaveLength(1)
      expect(
        within(screen.getByTestId('visualizacion-pedagogica')).getByRole(
          'heading',
          { name: paso.visualizacion?.titulo },
        ),
      ).toBeVisible()
      fireEvent.click(
        screen.getByRole('button', {
          name:
            indice === experiencia.pasos.length - 1
              ? /Comprobar lo aprendido/
              : /Siguiente/,
        }),
      )
    })

    expect(screen.getAllByTestId('visualizacion-pedagogica')).toHaveLength(1)
    expect(
      within(screen.getByTestId('visualizacion-pedagogica')).getByRole(
        'heading',
        { name: experiencia.visualizacion_cierre?.titulo },
      ),
    ).toBeVisible()

    experiencia.evaluacion.forEach((pregunta) => {
      fireEvent.click(
        screen.getByRole('button', {
          name: new RegExp(pregunta.opciones[0]),
        }),
      )
    })
    const revisar = screen.getByRole('button', {
      name: /Revisar mis respuestas/,
    })
    expect(revisar).toBeEnabled()
    fireEvent.click(revisar)

    expect(screen.getByText('¡Recorrido completado!')).toBeVisible()
    expect(screen.getAllByTestId('visualizacion-pedagogica')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: /Recorrer otra vez/ }))
    expect(screen.getByRole('button', { name: /Comenzar/ })).toBeVisible()
  })

  it('completa una visualización temática en cada panel antiguo', () => {
    const experiencia = crearExperienciaDemostracion(
      'Somos parte del Estado. Los ciudadanos participan, ejercen derechos y cumplen responsabilidades.',
      aula,
      area,
    )
    delete experiencia.visualizacion_portada
    delete experiencia.visualizacion_cierre
    experiencia.pasos.forEach((paso) => delete paso.visualizacion)

    render(
      <ExperienciaInteractiva
        experiencia={experiencia}
        aula={aula.nombre}
        area={area.nombre}
        nivel="PRIMARIA"
        modo="DEMOSTRACION"
        modelo="openai-respaldo-local"
      />,
    )

    expect(screen.getAllByTestId('visualizacion-pedagogica')).toHaveLength(1)
    expect(screen.getByTestId('visualizacion-pedagogica')).toHaveAttribute(
      'data-tipo',
      'mapa_conceptual',
    )

    fireEvent.click(screen.getByRole('button', { name: /Comenzar/ }))
    experiencia.pasos.forEach((_, indice) => {
      expect(screen.getAllByTestId('visualizacion-pedagogica')).toHaveLength(1)
      fireEvent.click(
        screen.getByRole('button', {
          name:
            indice === experiencia.pasos.length - 1
              ? /Comprobar lo aprendido/
              : /Siguiente/,
        }),
      )
    })

    expect(screen.getAllByTestId('visualizacion-pedagogica')).toHaveLength(1)
    expect(document.querySelector('canvas')).not.toBeInTheDocument()
  })

  it('identifica claramente una demostración elegida desde OpenAI', () => {
    const experiencia = crearExperienciaDemostracion(
      'Cuidado del cuerpo con agua y jabón todos los días.',
      aula,
      area,
    )

    render(
      <ExperienciaInteractiva
        experiencia={experiencia}
        aula={aula.nombre}
        area={area.nombre}
        nivel="PRIMARIA"
        modo="DEMOSTRACION"
        modelo="openai-respaldo-local"
      />,
    )

    expect(
      screen.getByText('Demostración local · OpenAI seleccionado'),
    ).toBeVisible()
  })
})
