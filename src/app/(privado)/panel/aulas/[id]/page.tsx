import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { listarAreasAulaDocente } from '@/lib/asignaciones-docentes'
import { obtenerUsuarioActual } from '@/lib/autenticacion'
import { buscarAula } from '@/lib/curriculo'

export default async function PaginaAula({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const usuario = await obtenerUsuarioActual()
  if (!usuario) return null
  const { id } = await params
  const aulaId = Number(id)
  if (!Number.isInteger(aulaId) || aulaId <= 0) notFound()

  const [aula, areas] = await Promise.all([
    buscarAula(aulaId),
    listarAreasAulaDocente(usuario.id, aulaId),
  ])
  if (!aula || areas.length === 0) notFound()

  return (
    <main
      className="pagina-aula"
      style={{ '--color-aula': aula.color } as React.CSSProperties}
    >
      <Link className="volver" href="/panel/aulas">
        <ArrowLeft size={17} /> Volver a aulas
      </Link>
      <header className="hero-aula">
        <div>
          <span className="etiqueta-nivel">{aula.nivel.toLowerCase()}</span>
          <h1>{aula.nombre}</h1>
          <p>{aula.descripcion}</p>
        </div>
        <div className="edad-aula">
          <small>Edad referencial</small>
          <strong>
            {aula.edad_minima}–{aula.edad_maxima}
          </strong>
          <span>años</span>
        </div>
      </header>

      <section className="selector-area-aula">
        <div className="titulo-selector-area">
          <span>
            <BookOpen size={21} />
          </span>
          <div>
            <span className="sobrelinea">Tus cursos en este grado</span>
            <h2>Cursos guardados para {aula.nombre}</h2>
            <p>
              Abre el curso de esta sesión; no tendrás que configurar otra vez
              el grado ni el área.
            </p>
          </div>
        </div>
        <div className="grilla-selector-areas">
          {areas.map((area) => (
            <Link
              href={`/panel/aulas/${aula.id}/areas/${area.id}`}
              key={area.id}
            >
              <span className="icono-area-seleccion">
                <Sparkles size={19} />
              </span>
              <span>
                <strong>{area.nombre}</strong>
                <small>{area.descripcion}</small>
              </span>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
