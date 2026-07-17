'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef } from 'react'
import {
  BookOpen,
  GraduationCap,
  House,
  LogOut,
  Menu,
  Settings,
  Sparkles,
} from 'lucide-react'
import { salir } from '@/app/acciones/autenticacion'
import { esEnlacePanelActivo } from '@/componentes/navegacion-panel'

const enlaces = [
  { href: '/panel', etiqueta: 'Inicio', icono: House },
  { href: '/panel/aulas', etiqueta: 'Aulas', icono: GraduationCap },
  { href: '/panel/experiencias', etiqueta: 'Experiencias', icono: Sparkles },
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

export function MenuPanelMovil() {
  const ruta = usePathname()
  const detalles = useRef<HTMLDetailsElement>(null)

  function cerrarMenu() {
    detalles.current?.removeAttribute('open')
  }

  return (
    <details className="menu-panel-movil" ref={detalles}>
      <summary>
        <Menu size={18} /> Menú
      </summary>
      <div>
        {enlaces.map(({ href, etiqueta, icono: Icono }) => (
          <Link
            aria-current={esEnlacePanelActivo(href, ruta) ? 'page' : undefined}
            href={href}
            key={href}
            onClick={cerrarMenu}
          >
            <Icono size={17} /> {etiqueta}
          </Link>
        ))}
        <form action={salir}>
          <button type="submit">
            <LogOut size={17} /> Cerrar sesión
          </button>
        </form>
      </div>
    </details>
  )
}
