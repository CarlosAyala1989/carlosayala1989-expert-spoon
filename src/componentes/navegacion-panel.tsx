'use client'

import Link from 'next/link'
import { Fragment } from 'react'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  GraduationCap,
  House,
  Settings,
  Sparkles,
} from 'lucide-react'
import clsx from 'clsx'

const enlaces = [
  { href: '/panel', etiqueta: 'Inicio', icono: House },
  { href: '/panel/aulas', etiqueta: 'Aulas', icono: GraduationCap },
  {
    href: '/panel/experiencias',
    etiqueta: 'Experiencias',
    icono: Sparkles,
  },
  {
    href: '/panel/areas-curriculares',
    etiqueta: 'Áreas curriculares',
    icono: BookOpen,
  },
  {
    href: '/panel/configuracion',
    etiqueta: 'Configuración',
    icono: Settings,
  },
]

export function esEnlacePanelActivo(href: string, ruta: string) {
  if (href === '/panel') return ruta === href
  return ruta === href || ruta.startsWith(`${href}/`)
}

export function NavegacionPanel() {
  const ruta = usePathname()

  return (
    <nav className="navegacion-panel" aria-label="Navegación principal">
      {enlaces.map(({ href, etiqueta, icono: Icono }, indice) => {
        const activo = esEnlacePanelActivo(href, ruta)
        return (
          <Fragment key={etiqueta}>
            {indice === enlaces.length - 1 && (
              <span className="separador-navegacion" />
            )}
            <Link
              aria-current={activo ? 'page' : undefined}
              className={clsx('enlace-panel', activo && 'activo')}
              href={href}
            >
              <Icono size={19} />
              <span>{etiqueta}</span>
            </Link>
          </Fragment>
        )
      })}
    </nav>
  )
}
