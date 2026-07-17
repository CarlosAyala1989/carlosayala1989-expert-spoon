import Link from 'next/link'
import { ArrowRight, BookOpen, Settings } from 'lucide-react'
import { listarAsignacionesDocente } from '@/lib/asignaciones-docentes'
import { obtenerUsuarioActual } from '@/lib/autenticacion'

export default async function PaginaAreasCurriculares() {
  const usuario = await obtenerUsuarioActual()
  if (!usuario) return null
  const asignaciones = await listarAsignacionesDocente(usuario.id)
  const grupos = Array.from(
    asignaciones.reduce((mapa, asignacion) => {
      const grupo = mapa.get(asignacion.aula.id) ?? {
        aula: asignacion.aula,
        areas: [],
      }
      grupo.areas.push(asignacion.area)
      mapa.set(asignacion.aula.id, grupo)
      return mapa
    }, new Map<number, { aula: (typeof asignaciones)[number]['aula']; areas: (typeof asignaciones)[number]['area'][] }>()),
  ).map(([, grupo]) => grupo)

  return (
    <main className="pagina-panel">
      <header className="encabezado-seccion-panel">
        <div>
          <span className="sobrelinea">Tu cobertura curricular</span>
          <h1>Áreas curriculares</h1>
          <p>Abre una combinación de grado y curso que ya dejaste guardada.</p>
        </div>
        <span className="contador-seccion">
          {asignaciones.length} asignaciones
        </span>
      </header>

      {grupos.length === 0 ? (
        <section className="estado-vacio estado-vacio-pagina">
          <span>
            <BookOpen size={28} />
          </span>
          <div>
            <h2>Aún no tienes cursos configurados</h2>
            <p>Selecciona los grados y cursos que enseñas para comenzar.</p>
          </div>
          <Link className="boton boton-secundario" href="/panel/configuracion">
            <Settings size={17} /> Configurar docencia
          </Link>
        </section>
      ) : (
        <div className="grupos-areas-docente">
          {grupos.map(({ aula, areas }) => (
            <section
              className="grupo-area-docente"
              key={aula.id}
              style={{ '--color-aula': aula.color } as React.CSSProperties}
            >
              <header>
                <span className="etiqueta-nivel">
                  {aula.nivel.toLowerCase()}
                </span>
                <h2>{aula.nombre}</h2>
                <small>
                  {areas.length} {areas.length === 1 ? 'curso' : 'cursos'}
                </small>
              </header>
              <div>
                {areas.map((area) => (
                  <Link
                    href={`/panel/aulas/${aula.id}/areas/${area.id}`}
                    key={area.id}
                  >
                    <span>
                      <strong>{area.nombre}</strong>
                      <small>{area.descripcion}</small>
                    </span>
                    <span className="accion-area-docente">
                      Crear <ArrowRight size={16} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
