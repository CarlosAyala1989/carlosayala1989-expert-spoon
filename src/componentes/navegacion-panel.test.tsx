import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MenuPanelMovil } from '@/componentes/menu-panel-movil'
import {
  esEnlacePanelActivo,
  NavegacionPanel,
} from '@/componentes/navegacion-panel'

const { obtenerRuta } = vi.hoisted(() => ({
  obtenerRuta: vi.fn(() => '/panel'),
}))

vi.mock('next/navigation', () => ({
  usePathname: obtenerRuta,
}))
vi.mock('@/app/acciones/autenticacion', () => ({
  salir: vi.fn(),
}))

describe('NavegacionPanel', () => {
  beforeEach(() => {
    obtenerRuta.mockReturnValue('/panel')
  })

  it('mantiene activa la sección en sus páginas anidadas', () => {
    expect(esEnlacePanelActivo('/panel', '/panel')).toBe(true)
    expect(esEnlacePanelActivo('/panel', '/panel/aulas')).toBe(false)
    expect(esEnlacePanelActivo('/panel/aulas', '/panel/aulas/1')).toBe(true)
    expect(
      esEnlacePanelActivo(
        '/panel/areas-curriculares',
        '/panel/areas-curriculares',
      ),
    ).toBe(true)
  })

  it('presenta rutas independientes y marca la ruta actual', () => {
    obtenerRuta.mockReturnValue('/panel/experiencias')
    render(<NavegacionPanel />)

    expect(screen.getByRole('link', { name: 'Aulas' })).toHaveAttribute(
      'href',
      '/panel/aulas',
    )
    expect(screen.getByRole('link', { name: 'Experiencias' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      screen.getByRole('link', { name: 'Áreas curriculares' }),
    ).toHaveAttribute('href', '/panel/areas-curriculares')
  })

  it('cierra el menú móvil después de elegir una página', () => {
    obtenerRuta.mockReturnValue('/panel/aulas')
    const { container } = render(<MenuPanelMovil />)
    const detalles = container.querySelector('details')
    expect(detalles).not.toBeNull()
    detalles!.open = true

    const aulas = within(detalles!).getByRole('link', { name: 'Aulas' })
    expect(aulas).toHaveAttribute('aria-current', 'page')
    aulas.addEventListener('click', (evento) => evento.preventDefault())
    fireEvent.click(aulas)

    expect(detalles).not.toHaveAttribute('open')
  })
})
