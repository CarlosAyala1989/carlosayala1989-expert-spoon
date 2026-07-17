import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { EstadoAutenticacion } from '@/app/acciones/autenticacion'
import { FormularioConfiguracionDocente } from '@/componentes/formulario-configuracion-docente'
import type { AreaCurricular, Aula } from '@/tipos/educacion'

const aula: Aula = {
  id: 1,
  nivel: 'PRIMARIA',
  grado: 1,
  nombre: '1.° de primaria',
  edad_minima: 6,
  edad_maxima: 7,
  descripcion: 'Primer grado',
  color: '#7157f5',
}

const area: AreaCurricular = {
  id: 3,
  nivel: 'PRIMARIA',
  codigo: 'comunicacion',
  nombre: 'Comunicación',
  descripcion: 'Comunicación primaria',
}

describe('formulario de configuración docente', () => {
  afterEach(cleanup)

  it('restaura y envía la configuración guardada', async () => {
    const accion = vi.fn(
      async (_estado: EstadoAutenticacion, formulario: FormData) => ({
        exito: true,
        mensaje: `${formulario.get('aulas')}:${formulario.get('asignaciones')}`,
      }),
    )
    render(
      <FormularioConfiguracionDocente
        aulas={[aula]}
        areas={[area]}
        asignacionesIniciales={[{ aulaId: 1, areaId: 3 }]}
        accion={accion}
      />,
    )

    expect(screen.getByLabelText('1.° de primaria')).toBeChecked()
    expect(screen.getByLabelText('Comunicación')).toBeChecked()
    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar grados y cursos' }),
    )

    await waitFor(() => expect(accion).toHaveBeenCalledOnce())
    expect(await screen.findByRole('status')).toHaveTextContent('1:1:3')
  })

  it('anuncia un error devuelto al guardar', async () => {
    const accion = vi.fn(async () => ({
      mensaje: 'No pudimos guardar la configuración.',
    }))
    render(
      <FormularioConfiguracionDocente
        aulas={[aula]}
        areas={[area]}
        asignacionesIniciales={[{ aulaId: 1, areaId: 3 }]}
        accion={accion}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar grados y cursos' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos guardar la configuración.',
    )
  })
})
