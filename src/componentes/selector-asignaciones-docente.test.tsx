import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SelectorAsignacionesDocente } from '@/componentes/selector-asignaciones-docente'
import type { AreaCurricular, Aula } from '@/tipos/educacion'

const aulas: Aula[] = [
  {
    id: 1,
    nivel: 'PRIMARIA',
    grado: 1,
    nombre: '1.° de primaria',
    edad_minima: 6,
    edad_maxima: 7,
    descripcion: 'Primer grado',
    color: '#fff000',
  },
  {
    id: 7,
    nivel: 'SECUNDARIA',
    grado: 1,
    nombre: '1.° de secundaria',
    edad_minima: 12,
    edad_maxima: 13,
    descripcion: 'Primer grado',
    color: '#000fff',
  },
]

const areas: AreaCurricular[] = [
  {
    id: 3,
    nivel: 'PRIMARIA',
    codigo: 'comunicacion',
    nombre: 'Comunicación',
    descripcion: 'Comunicación primaria',
  },
  {
    id: 10,
    nivel: 'SECUNDARIA',
    codigo: 'dpcc',
    nombre: 'Desarrollo Personal, Ciudadanía y Cívica',
    descripcion: 'Ciudadanía secundaria',
  },
]

describe('selector de grados y cursos del docente', () => {
  afterEach(cleanup)

  it('muestra solo los cursos del nivel correspondiente al grado', () => {
    render(<SelectorAsignacionesDocente aulas={aulas} areas={areas} />)

    fireEvent.click(screen.getByLabelText('1.° de primaria'))

    expect(screen.getByLabelText('Comunicación')).toBeInTheDocument()
    expect(
      screen.queryByLabelText('Desarrollo Personal, Ciudadanía y Cívica'),
    ).not.toBeInTheDocument()
  })

  it('envía aulas y pares de asignaciones con nombres repetibles', () => {
    const { container } = render(
      <form>
        <SelectorAsignacionesDocente aulas={aulas} areas={areas} />
      </form>,
    )

    fireEvent.click(screen.getByLabelText('1.° de primaria'))
    fireEvent.click(screen.getByLabelText('Comunicación'))

    const datos = new FormData(container.querySelector('form')!)
    expect(datos.getAll('aulas')).toEqual(['1'])
    expect(datos.getAll('asignaciones')).toEqual(['1:3'])
    expect(screen.getByText('1 grados · 1 cursos')).toBeInTheDocument()
  })

  it('restaura las asignaciones guardadas y las quita al desmarcar el grado', () => {
    const { container } = render(
      <form>
        <SelectorAsignacionesDocente
          aulas={aulas}
          areas={areas}
          asignacionesIniciales={[{ aulaId: 7, areaId: 10 }]}
        />
      </form>,
    )

    expect(screen.getByLabelText('1.° de secundaria')).toBeChecked()
    expect(
      screen.getByLabelText('Desarrollo Personal, Ciudadanía y Cívica'),
    ).toBeChecked()

    fireEvent.click(screen.getByLabelText('1.° de secundaria'))

    const datos = new FormData(container.querySelector('form')!)
    expect(datos.getAll('aulas')).toEqual([])
    expect(datos.getAll('asignaciones')).toEqual([])
  })
})
