import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { FormularioAutenticacion } from '@/componentes/formulario-autenticacion'
import { Marca } from '@/componentes/marca'
import type { EstadoAutenticacion } from '@/app/acciones/autenticacion'

const accion = async (): Promise<EstadoAutenticacion> => ({})

describe('interfaz de autenticación', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('usa autocompletado adecuado al iniciar sesión', () => {
    render(<FormularioAutenticacion modo="ingreso" accion={accion} />)

    expect(screen.getByLabelText('Correo institucional')).toHaveAttribute(
      'autocomplete',
      'email',
    )
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute(
      'autocomplete',
      'current-password',
    )
    expect(
      screen.getByRole('button', { name: 'Entrar a mi espacio' }),
    ).toHaveAttribute('type', 'submit')
  })

  it('usa autocompletado adecuado al registrar una cuenta', () => {
    render(<FormularioAutenticacion modo="registro" accion={accion} />)

    expect(screen.getByLabelText('Nombre completo')).toHaveAttribute(
      'autocomplete',
      'name',
    )
    expect(screen.getByLabelText('Correo institucional')).toHaveAttribute(
      'autocomplete',
      'email',
    )
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute(
      'autocomplete',
      'new-password',
    )
  })

  it('da un nombre accesible a la marca compacta', () => {
    render(<Marca compacta />)

    expect(
      screen.getByRole('link', { name: 'Aula Viva — inicio' }),
    ).toHaveAttribute('href', '/')
  })

  it('anuncia y relaciona los errores devueltos por el servidor', async () => {
    const accionConError = vi.fn(async (): Promise<EstadoAutenticacion> => ({
      mensaje: 'No pudimos iniciar sesión.',
      errores: { correo: ['Revisa el correo ingresado.'] },
    }))
    render(<FormularioAutenticacion modo="ingreso" accion={accionConError} />)

    fireEvent.change(screen.getByLabelText('Correo institucional'), {
      target: { value: 'docente@colegio.edu.pe' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'clave-segura' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar a mi espacio' }))

    await waitFor(() => expect(accionConError).toHaveBeenCalled())
    const alertaGeneral = await screen.findByText('No pudimos iniciar sesión.')
    const alertaCampo = screen.getByText('Revisa el correo ingresado.')
    const entradaCorreo = screen.getByRole('textbox', {
      name: /Correo institucional/,
    })

    expect(alertaGeneral).toHaveAttribute('role', 'alert')
    expect(alertaGeneral).toHaveAttribute('aria-live', 'assertive')
    expect(alertaCampo).toHaveAttribute('role', 'alert')
    expect(entradaCorreo).toHaveAttribute('aria-invalid', 'true')
    expect(entradaCorreo).toHaveAttribute(
      'aria-describedby',
      alertaCampo.getAttribute('id'),
    )
  })
})
