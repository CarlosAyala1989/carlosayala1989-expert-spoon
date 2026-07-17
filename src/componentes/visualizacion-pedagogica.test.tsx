import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { VisualizacionPedagogica } from '@/componentes/visualizacion-pedagogica'
import type {
  TipoVisualizacionPedagogica,
  VisualizacionPedagogica as DatosVisualizacion,
} from '@/tipos/educacion'

const tipos: TipoVisualizacionPedagogica[] = [
  'mapa_conceptual',
  'linea_tiempo',
  'secuencia_animada',
  'comparacion',
  'escena_animada',
]

function crearDatos(tipo: TipoVisualizacionPedagogica): DatosVisualizacion {
  return {
    tipo,
    titulo: 'Cómo participamos en el Estado',
    elementos: [
      {
        etiqueta: 'Ciudadanía',
        descripcion: 'Participa en las decisiones de su comunidad.',
        icono: '👥',
      },
      {
        etiqueta: 'Instituciones',
        descripcion: 'Organizan servicios y protegen derechos.',
        icono: '🏛️',
      },
    ],
  }
}

describe('visualización pedagógica', () => {
  afterEach(cleanup)

  tipos.forEach((tipo) => {
    it(`representa el formato ${tipo} con contenido accesible`, () => {
      render(
        <VisualizacionPedagogica
          visualizacion={crearDatos(tipo)}
          tema="ciudadania"
          nivel="SECUNDARIA"
          identificador={`visual-${tipo}`}
        />,
      )

      const visualizacion = screen.getByTestId('visualizacion-pedagogica')
      expect(visualizacion).toHaveAttribute('data-tipo', tipo)
      expect(visualizacion).toHaveAttribute('data-tema', 'ciudadania')
      expect(
        screen.getByRole('heading', {
          name: 'Cómo participamos en el Estado',
        }),
      ).toBeVisible()
      expect(screen.getByText('Ciudadanía')).toBeVisible()
      expect(
        screen.getByText('Organizan servicios y protegen derechos.'),
      ).toBeVisible()
      expect(visualizacion.querySelector('canvas')).not.toBeInTheDocument()
    })
  })
})
