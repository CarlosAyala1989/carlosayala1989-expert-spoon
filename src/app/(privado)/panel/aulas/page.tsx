import Link from 'next/link'
import { Settings, UsersRound } from 'lucide-react'
import { TarjetaAula } from '@/componentes/tarjeta-aula'
import { listarAsignacionesDocente } from '@/lib/asignaciones-docentes'
import { obtenerUsuarioActual } from '@/lib/autenticacion'
import type { Aula, NivelEducativo } from '@/tipos/educacion'

function aulasUnicas(
  asignaciones: Awaited<ReturnType<typeof listarAsignacionesDocente>>,
) {
  return Array.from(
    new Map(asignaciones.map(({ aula }) => [aula.id, aula])).values(),
  )
}

function BloqueAulas({
  nivel,
  aulas,
}: {
  nivel: NivelEducativo
  aulas: Aula[]
}) {
  if (aulas.length === 0) return null

  return (
    <section className="bloque-nivel">
      <div className="cabecera-nivel">
        <span className={`punto-nivel ${nivel.toLowerCase()}`} />
        <strong>{nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}</strong>
        <small>
          {aulas.length}{' '}
          {aulas.length === 1 ? 'grado configurado' : 'grados configurados'}
        </small>
      </div>
      <div className="grilla-aulas">
        {aulas.map((aula) => (
          <TarjetaAula aula={aula} key={aula.id} />
        ))}
      </div>
    </section>
  )
}

export default async function PaginaAulas() {
  const usuario = await obtenerUsuarioActual()
  if (!usuario) return null
  const aulas = aulasUnicas(await listarAsignacionesDocente(usuario.id))
  const primaria = aulas.filter((aula) => aula.nivel === 'PRIMARIA')
  const secundaria = aulas.filter((aula) => aula.nivel === 'SECUNDARIA')

  return (
    <main className="pagina-panel">
      <header className="encabezado-seccion-panel">
        <div>
          <span className="sobrelinea">Tu organización docente</span>
          <h1>Aulas</h1>
          <p>Solo aparecen los grados que elegiste para enseñar.</p>
        </div>
        <span className="contador-seccion">{aulas.length} grados</span>
      </header>

      {aulas.length === 0 ? (
        <section className="estado-vacio estado-vacio-pagina">
          <span>
            <UsersRound size={28} />
          </span>
          <div>
            <h2>Aún no tienes grados configurados</h2>
            <p>Selecciona los grados y cursos que enseñas para comenzar.</p>
          </div>
          <Link className="boton boton-secundario" href="/panel/configuracion">
            <Settings size={17} /> Configurar docencia
          </Link>
        </section>
      ) : (
        <div className="contenido-seccion-panel">
          <BloqueAulas nivel="PRIMARIA" aulas={primaria} />
          <BloqueAulas nivel="SECUNDARIA" aulas={secundaria} />
        </div>
      )}
    </main>
  )
}
