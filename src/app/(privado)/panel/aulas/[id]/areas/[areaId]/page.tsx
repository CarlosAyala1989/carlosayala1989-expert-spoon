import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, BrainCircuit, Gauge, Shapes } from 'lucide-react'
import { CargadorSesion } from '@/componentes/cargador-sesion'
import { buscarAsignacionDocente } from '@/lib/asignaciones-docentes'
import { obtenerUsuarioActual } from '@/lib/autenticacion'

export default async function PaginaCrearExperiencia({
  params,
}: {
  params: Promise<{ id: string; areaId: string }>
}) {
  const usuario = await obtenerUsuarioActual()
  if (!usuario) redirect('/ingresar')

  const { id, areaId } = await params
  const aulaId = Number(id)
  const areaCurricularId = Number(areaId)
  if (!Number.isInteger(aulaId) || !Number.isInteger(areaCurricularId)) {
    notFound()
  }

  const asignacion = await buscarAsignacionDocente(
    usuario.id,
    aulaId,
    areaCurricularId,
  )
  if (!asignacion) notFound()

  const { aula, area } = asignacion

  return (
    <main
      className="pagina-aula"
      style={{ '--color-aula': aula.color } as React.CSSProperties}
    >
      <Link className="volver" href={`/panel/aulas/${aula.id}`}>
        <ArrowLeft size={17} /> Volver a los cursos de {aula.nombre}
      </Link>
      <header className="hero-aula">
        <div>
          <span className="etiqueta-nivel">{aula.nivel.toLowerCase()}</span>
          <h1>{area.nombre}</h1>
          <p>
            {aula.nombre} · {area.descripcion}
          </p>
        </div>
        <div className="edad-aula">
          <small>Edad referencial</small>
          <strong>
            {aula.edad_minima}–{aula.edad_maxima}
          </strong>
          <span>años</span>
        </div>
      </header>

      <div className="columnas-aula">
        <section className="tarjeta-carga-principal">
          <span className="sobrelinea">Nueva experiencia</span>
          <h2>¿Qué aprenderán hoy?</h2>
          <p>
            Tu grado y curso ya están guardados. Solo sube la sesión y elige la
            IA que creará la experiencia.
          </p>
          <CargadorSesion
            aula={aula}
            area={area}
            disponibilidadModelos={{
              openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
              deepseek: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
            }}
          />
        </section>

        <aside className="como-funciona">
          <span className="sobrelinea">Detrás de escena</span>
          <h2>Así cobra vida</h2>
          <ol>
            <li>
              <span>
                <BrainCircuit size={20} />
              </span>
              <div>
                <strong>Comprende</strong>
                <p>Lee el propósito y las ideas clave de tu sesión.</p>
              </div>
            </li>
            <li>
              <span>
                <Gauge size={20} />
              </span>
              <div>
                <strong>Adapta</strong>
                <p>
                  Ajusta lenguaje, ritmo y reto a {aula.edad_minima}–
                  {aula.edad_maxima} años.
                </p>
              </div>
            </li>
            <li>
              <span>
                <Shapes size={20} />
              </span>
              <div>
                <strong>Da forma</strong>
                <p>Crea narrativa, animaciones, escena 3D y preguntas.</p>
              </div>
            </li>
          </ol>
        </aside>
      </div>
    </main>
  )
}
