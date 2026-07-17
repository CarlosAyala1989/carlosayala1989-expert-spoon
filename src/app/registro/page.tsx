import { redirect } from 'next/navigation'
import { BookOpenCheck } from 'lucide-react'
import { registrarDocente } from '@/app/acciones/autenticacion'
import { FormularioAutenticacion } from '@/componentes/formulario-autenticacion'
import { Marca } from '@/componentes/marca'
import { obtenerUsuarioActual } from '@/lib/autenticacion'
import { listarAreas, listarAulas } from '@/lib/curriculo'

export default async function PaginaRegistro() {
  if (await obtenerUsuarioActual()) redirect('/panel')

  const [aulas, areasPrimaria, areasSecundaria] = await Promise.all([
    listarAulas(),
    listarAreas('PRIMARIA'),
    listarAreas('SECUNDARIA'),
  ])

  return (
    <main className="pagina-autenticacion pagina-registro">
      <section className="panel-auth-visual variante-registro">
        <Marca />
        <div className="auth-frase">
          <span className="etiqueta-clara">
            <BookOpenCheck size={15} /> Diseñado junto al trabajo docente
          </span>
          <h1>
            Tu clase ya
            <br />
            tiene una historia.
          </h1>
          <p>
            La IA te ayuda a convertirla en un recorrido visual y participativo.
          </p>
        </div>
        <div className="tarjetas-flotantes-auth" aria-hidden="true">
          <span>🌎</span>
          <span>🧪</span>
          <span>🎨</span>
        </div>
      </section>
      <section className="panel-auth-formulario">
        <div className="tarjeta-auth">
          <span className="sobrelinea">Empieza gratis</span>
          <h2>Crea tu espacio docente</h2>
          <p>Organiza tus aulas y genera tu primera experiencia.</p>
          <FormularioAutenticacion
            modo="registro"
            accion={registrarDocente}
            aulas={aulas}
            areas={[...areasPrimaria, ...areasSecundaria]}
          />
        </div>
      </section>
    </main>
  )
}
