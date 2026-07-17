import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { iniciarSesion } from '@/app/acciones/autenticacion'
import { FormularioAutenticacion } from '@/componentes/formulario-autenticacion'
import { Marca } from '@/componentes/marca'
import { obtenerUsuarioActual } from '@/lib/autenticacion'

export default async function PaginaIngreso() {
  if (await obtenerUsuarioActual()) redirect('/panel')

  return (
    <main className="pagina-autenticacion">
      <section className="panel-auth-visual">
        <Marca />
        <div className="auth-frase">
          <span className="etiqueta-clara">
            <Sparkles size={15} /> Aprender también puede sentirse así
          </span>
          <h1>
            Una sesión.
            <br />
            Todo un mundo.
          </h1>
          <p>
            Convierte tu planificación de hoy en una experiencia que tu aula
            quiera explorar.
          </p>
        </div>
        <div className="mini-escena-auth" aria-hidden="true">
          <span className="planeta" />
          <span className="orbita orbita-uno" />
          <span className="orbita orbita-dos" />
          <span className="estrella estrella-uno">✦</span>
          <span className="estrella estrella-dos">✦</span>
        </div>
      </section>
      <section className="panel-auth-formulario">
        <div className="tarjeta-auth">
          <span className="sobrelinea">Bienvenido de vuelta</span>
          <h2>Ingresa a tu aula creativa</h2>
          <p>Continúa transformando sesiones en momentos memorables.</p>
          <FormularioAutenticacion modo="ingreso" accion={iniciarSesion} />
        </div>
      </section>
    </main>
  )
}
