import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  GraduationCap,
} from 'lucide-react'
import { obtenerUsuarioActual } from '@/lib/autenticacion'
import { listarPaginaSesionesDocente } from '@/lib/sesiones-aprendizaje'

function numeroPagina(valor: string | string[] | undefined) {
  const numero = Number(Array.isArray(valor) ? valor[0] : valor)
  return Number.isInteger(numero) && numero > 0 ? numero : 1
}

export default async function PaginaExperiencias({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string | string[] }>
}) {
  const usuario = await obtenerUsuarioActual()
  if (!usuario) return null
  const consulta = await searchParams
  const resultado = await listarPaginaSesionesDocente(
    usuario.id,
    numeroPagina(consulta.pagina),
  )

  return (
    <main className="pagina-panel">
      <header className="encabezado-seccion-panel">
        <div>
          <span className="sobrelinea">Tu biblioteca persistente</span>
          <h1>Experiencias</h1>
          <p>Consulta las sesiones y animaciones que has creado.</p>
        </div>
        <span className="contador-seccion">{resultado.total} registros</span>
      </header>

      {resultado.sesiones.length === 0 ? (
        <section className="estado-vacio estado-vacio-pagina">
          <span>
            <BookOpenText size={28} />
          </span>
          <div>
            <h2>Tu primera experiencia empieza aquí</h2>
            <p>Elige uno de tus grados y un curso para crearla.</p>
          </div>
          <Link className="boton boton-secundario" href="/panel/aulas">
            <GraduationCap size={17} /> Ver aulas
          </Link>
        </section>
      ) : (
        <>
          <section className="lista-experiencias lista-experiencias-pagina">
            {resultado.sesiones.map((sesion) => (
              <article className="fila-experiencia" key={sesion.id}>
                <span className="icono-experiencia">
                  <BookOpenText size={20} />
                </span>
                <div>
                  <strong>{sesion.titulo_detectado}</strong>
                  <small>
                    {sesion.aula_nombre} · {sesion.area_nombre} ·{' '}
                    {new Intl.DateTimeFormat('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(sesion.creado_en))}
                  </small>
                </div>
                <span
                  className={`estado estado-${sesion.estado.toLowerCase()}`}
                >
                  {sesion.estado.toLowerCase()}
                </span>
                {sesion.experiencia_id ? (
                  <Link href={`/experiencias/${sesion.experiencia_id}`}>
                    Abrir <ArrowRight size={16} />
                  </Link>
                ) : (
                  <small className="experiencia-sin-enlace">
                    {sesion.estado === 'ERROR'
                      ? 'No se pudo crear'
                      : 'Procesando'}
                  </small>
                )}
              </article>
            ))}
          </section>
          {resultado.totalPaginas > 1 && (
            <nav
              className="paginacion-panel"
              aria-label="Páginas de experiencias"
            >
              {resultado.pagina > 1 ? (
                <Link
                  href={`/panel/experiencias?pagina=${resultado.pagina - 1}`}
                >
                  <ArrowLeft size={16} /> Anterior
                </Link>
              ) : (
                <span />
              )}
              <strong>
                Página {resultado.pagina} de {resultado.totalPaginas}
              </strong>
              {resultado.pagina < resultado.totalPaginas ? (
                <Link
                  href={`/panel/experiencias?pagina=${resultado.pagina + 1}`}
                >
                  Siguiente <ArrowRight size={16} />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </main>
  )
}
