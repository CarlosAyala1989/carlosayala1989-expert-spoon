import { redirect } from 'next/navigation'
import { LogOut, WandSparkles } from 'lucide-react'
import { salir } from '@/app/acciones/autenticacion'
import { Marca } from '@/componentes/marca'
import { MenuPanelMovil } from '@/componentes/menu-panel-movil'
import { NavegacionPanel } from '@/componentes/navegacion-panel'
import { obtenerUsuarioActual } from '@/lib/autenticacion'

export default async function DisenoPanel({
  children,
}: {
  children: React.ReactNode
}) {
  const usuario = await obtenerUsuarioActual()
  if (!usuario) redirect('/ingresar')

  return (
    <div className="estructura-panel">
      <aside className="barra-lateral">
        <Marca />
        <NavegacionPanel />
        <div className="aviso-ia">
          <span>
            <WandSparkles size={18} />
          </span>
          <strong>Tu copiloto creativo</strong>
          <p>Lee, adapta y transforma cada sesión.</p>
        </div>
        <div className="perfil-lateral">
          <span className="avatar-docente">
            {usuario.nombre.charAt(0).toUpperCase()}
          </span>
          <span>
            <strong>{usuario.nombre}</strong>
            <small>Docente</small>
          </span>
          <form action={salir}>
            <button aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut size={17} />
            </button>
          </form>
        </div>
      </aside>
      <div className="contenido-panel">
        <header className="cabecera-movil">
          <Marca compacta />
          <MenuPanelMovil />
        </header>
        {children}
      </div>
    </div>
  )
}
