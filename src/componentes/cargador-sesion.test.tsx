import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { CargadorSesion } from '@/componentes/cargador-sesion'
import type { AreaCurricular, Aula } from '@/tipos/educacion'

const { empujarRuta } = vi.hoisted(() => ({ empujarRuta: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: empujarRuta }),
}))

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

function prepararComponente() {
  return render(
    <CargadorSesion
      aula={aula}
      area={area}
      disponibilidadModelos={{ openai: false, deepseek: true }}
    />,
  )
}

describe('cargador de sesiones', () => {
  beforeEach(() => empujarRuta.mockReset())
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('usa el grado y curso guardados sin volver a pedirlos', () => {
    prepararComponente()

    expect(screen.getByText('1.° de primaria')).toBeInTheDocument()
    expect(screen.getByText('Personal Social')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('cambia de IA y confirma visualmente la selección', () => {
    prepararComponente()

    const deepSeek = screen.getByRole('radio', { name: /DeepSeek V4 Pro/ })
    const openAi = screen.getByRole('radio', { name: /OpenAI/ })

    expect(deepSeek).toBeChecked()
    expect(openAi).not.toBeChecked()

    fireEvent.click(openAi)

    expect(openAi).toBeChecked()
    expect(deepSeek).not.toBeChecked()
    expect(
      screen.getByText(/OpenAI todavía no tiene una API Key/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Crear demostración con OpenAI' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/el archivo no se enviará a OpenAI/, {
        selector: '.nota-privacidad',
      }),
    ).toBeInTheDocument()
  })

  it('acepta un PDF válido y permite quitarlo', () => {
    prepararComponente()
    const entrada = screen.getByLabelText('Elegir sesión en PDF o DOCX')
    const archivo = new File(['contenido de la sesión'], 'sesion.pdf', {
      type: 'application/pdf',
    })

    fireEvent.change(entrada, { target: { files: [archivo] } })

    expect(screen.getByText('sesion.pdf')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Crear con DeepSeek V4 Pro' }),
    ).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Quitar sesion.pdf' }))

    expect(screen.queryByText('sesion.pdf')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Crear con DeepSeek V4 Pro' }),
    ).toBeDisabled()
  })

  it('rechaza formatos no permitidos antes de enviarlos', () => {
    prepararComponente()
    const entrada = screen.getByLabelText('Elegir sesión en PDF o DOCX')
    const archivo = new File(['texto'], 'sesion.txt', { type: 'text/plain' })

    fireEvent.change(entrada, { target: { files: [archivo] } })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Formato no permitido. Selecciona un archivo PDF o DOCX.',
    )
    expect(
      screen.getByRole('button', { name: 'Crear con DeepSeek V4 Pro' }),
    ).toBeDisabled()
  })

  it('acepta archivos móviles identificados por MIME aunque no tengan extensión', () => {
    prepararComponente()
    const entrada = screen.getByLabelText('Elegir sesión en PDF o DOCX')
    const archivo = new File(['contenido'], 'documento', {
      type: 'application/pdf',
    })

    fireEvent.change(entrada, { target: { files: [archivo] } })

    expect(screen.getByText('documento')).toBeInTheDocument()
    expect(entrada.closest('.zona-carga')).toBeInTheDocument()
  })

  it('acepta un DOCX de Android aunque llegue con el MIME de Word antiguo', () => {
    prepararComponente()
    const entrada = screen.getByLabelText('Elegir sesión en PDF o DOCX')
    const archivo = new File(['contenido'], 'sesion.docx', {
      type: 'application/msword',
    })

    fireEvent.change(entrada, { target: { files: [archivo] } })

    expect(screen.getByText('sesion.docx')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('explica cómo convertir un Word antiguo en lugar de fallar en silencio', () => {
    prepararComponente()
    const entrada = screen.getByLabelText('Elegir sesión en PDF o DOCX')
    const archivo = new File(['contenido'], 'sesion.doc', {
      type: 'application/msword',
    })

    fireEvent.change(entrada, { target: { files: [archivo] } })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El formato Word antiguo .doc no es compatible',
    )
  })

  it('envía el archivo y el modelo seleccionado y abre la experiencia', async () => {
    const solicitud = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ experienciaId: 'experiencia-123' }),
    })
    vi.stubGlobal('fetch', solicitud)
    prepararComponente()

    fireEvent.click(screen.getByRole('radio', { name: /OpenAI/ }))
    fireEvent.change(screen.getByLabelText('Elegir sesión en PDF o DOCX'), {
      target: {
        files: [
          new File(['contenido de la sesión'], 'sesion.docx', {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          }),
        ],
      },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Crear demostración con OpenAI' }),
    )

    await waitFor(() => expect(empujarRuta).toHaveBeenCalled())
    const opciones = solicitud.mock.calls[0]?.[1] as RequestInit
    const formulario = opciones.body as FormData
    expect(solicitud).toHaveBeenCalledWith('/api/v1/sesiones', {
      method: 'POST',
      body: formulario,
    })
    expect(formulario.get('modeloIa')).toBe('openai')
    expect(formulario.get('aulaId')).toBe('1')
    expect(formulario.get('areaId')).toBe('1')
    expect(formulario.get('archivo')).toBeInstanceOf(File)
    expect(empujarRuta).toHaveBeenCalledWith('/experiencias/experiencia-123')
  })
})
