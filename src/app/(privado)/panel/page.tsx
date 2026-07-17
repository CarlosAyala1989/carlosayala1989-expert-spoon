import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from 'lucide-react'
import { obtenerUsuarioActual } from '@/lib/autenticacion'
import { listarAsignacionesDocente } from '@/lib/asignaciones-docentes'
import { obtenerMetricasSesionesDocente } from '@/lib/sesiones-aprendizaje'

export default async function PaginaPanel() {
  const usuario = await obtenerUsuarioActual()
  if (!usuario) return null

  const [asignaciones, metricas] = await Promise.all([
    listarAsignacionesDocente(usuario.id),
    obtenerMetricasSesionesDocente(usuario.id),
  ])
  const totalAulas = new Set(
    asignaciones.map(({ aula }) => `${aula.nivel}-${aula.grado}`),
  ).size
  const totalAreas = new Set(asignaciones.map(({ area }) => area.id)).size

  return (
    <main className="pagina-panel">
      <header className="encabezado-panel">
        <div>
          <span className="sobrelinea">Mi espacio docente</span>
          <h1>
            Hola, {usuario.nombre.split(' ')[0]} <span>👋</span>
          </h1>
          <p>Todo lo que necesitas para preparar una experiencia memorable.</p>
        </div>
        <div className="fecha-panel">
          <span>Periodo escolar</span>
          <strong>2026</strong>
        </div>
      </header>

      <section className="resumen-docente" aria-label="Resumen de actividad">
        <article>
          <span className="icono-resumen icono-resumen-aulas">
            <GraduationCap size={22} />
          </span>
          <div>
            <strong>{totalAulas}</strong>
            <span>
              {totalAulas === 1 ? 'grado asignado' : 'grados asignados'}
            </span>
          </div>
        </article>
        <article>
          <span className="icono-resumen icono-resumen-areas">
            <BookOpen size={22} />
          </span>
          <div>
            <strong>{totalAreas}</strong>
            <span>
              {totalAreas === 1 ? 'área curricular' : 'áreas curriculares'}
            </span>
          </div>
        </article>
        <article>
          <span className="icono-resumen icono-resumen-experiencias">
            <Sparkles size={22} />
          </span>
          <div>
            <strong>{metricas.listas}</strong>
            <span>
              {metricas.listas === 1
                ? 'experiencia creada'
                : 'experiencias creadas'}
            </span>
          </div>
        </article>
      </section>

      <section className="llamada-principal llamada-dashboard">
        <div className="llamada-texto">
          <span className="insignia-ia">
            <Sparkles size={15} /> Generación con IA
          </span>
          <h2>
            De tu sesión a una
            <br />
            experiencia viva.
          </h2>
          <p>
            Abre uno de tus grados y elige entre los cursos que ya guardaste. La
            experiencia quedará vinculada a esa combinación.
          </p>
          <Link className="boton boton-claro" href="/panel/aulas">
            Abrir mis grados <ArrowRight size={18} />
          </Link>
        </div>
        <div className="atajos-dashboard">
          <Link href="/panel/aulas">
            <GraduationCap size={24} />
            <span>
              <strong>Mis aulas</strong>
              <small>Ver grados configurados</small>
            </span>
            <ArrowRight size={18} />
          </Link>
          <Link href="/panel/areas-curriculares">
            <BookOpen size={24} />
            <span>
              <strong>Áreas curriculares</strong>
              <small>Elegir un curso para crear</small>
            </span>
            <ArrowRight size={18} />
          </Link>
          <Link href="/panel/experiencias">
            <Sparkles size={24} />
            <span>
              <strong>Mis experiencias</strong>
              <small>Consultar todo el historial</small>
            </span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  )
}
