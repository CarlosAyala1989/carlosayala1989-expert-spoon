import { redirect } from 'next/navigation'
import {
  BrainCircuit,
  CheckCircle2,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { guardarConfiguracionDocente } from '@/app/acciones/autenticacion'
import { FormularioConfiguracionDocente } from '@/componentes/formulario-configuracion-docente'
import { listarAsignacionesDocente } from '@/lib/asignaciones-docentes'
import { obtenerUsuarioActual } from '@/lib/autenticacion'
import { listarAreas, listarAulas } from '@/lib/curriculo'

export default async function PaginaConfiguracion() {
  const usuario = await obtenerUsuarioActual()
  if (!usuario) redirect('/ingresar')

  const [aulas, areasPrimaria, areasSecundaria, asignaciones] =
    await Promise.all([
      listarAulas(),
      listarAreas('PRIMARIA'),
      listarAreas('SECUNDARIA'),
      listarAsignacionesDocente(usuario.id),
    ])

  const openAiConfigurado = Boolean(process.env.OPENAI_API_KEY?.trim())
  const deepSeekConfigurado = Boolean(process.env.DEEPSEEK_API_KEY?.trim())
  const proveedores = [
    {
      nombre: 'DeepSeek',
      modelo: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-pro',
      configurado: deepSeekConfigurado,
      Icono: BrainCircuit,
    },
    {
      nombre: 'OpenAI',
      modelo: process.env.OPENAI_MODEL?.trim() || 'gpt-5.4-mini',
      configurado: openAiConfigurado,
      Icono: Sparkles,
    },
  ]

  return (
    <main className="pagina-panel">
      <header className="encabezado-panel">
        <div>
          <span className="sobrelinea">Preferencias del espacio docente</span>
          <h1>Configuración</h1>
          <p>Consulta tu cuenta y el estado de los modelos de IA.</p>
        </div>
        <div className="fecha-panel">
          <Settings size={22} />
          <strong>Cuenta</strong>
        </div>
      </header>

      <section className="seccion-panel" aria-labelledby="titulo-cuenta">
        <div className="titulo-seccion">
          <div>
            <span className="sobrelinea">Tu perfil</span>
            <h2 id="titulo-cuenta">Cuenta docente</h2>
          </div>
        </div>
        <div className="lista-experiencias">
          <article className="fila-experiencia">
            <span className="icono-experiencia">
              <UserRound size={20} />
            </span>
            <div>
              <strong>{usuario.nombre}</strong>
              <small>{usuario.correo}</small>
            </div>
            <span className="estado estado-lista">Docente</span>
          </article>
        </div>
      </section>

      <section className="seccion-panel" aria-labelledby="titulo-carga-docente">
        <div className="titulo-seccion">
          <div>
            <span className="sobrelinea">Tu carga docente</span>
            <h2 id="titulo-carga-docente">Grados y cursos</h2>
          </div>
          <span className="contador-seccion">
            {new Set(asignaciones.map(({ aula }) => aula.id)).size} grados ·{' '}
            {asignaciones.length} cursos
          </span>
        </div>
        <FormularioConfiguracionDocente
          aulas={aulas}
          areas={[...areasPrimaria, ...areasSecundaria]}
          asignacionesIniciales={asignaciones.map(({ aula, area }) => ({
            aulaId: aula.id,
            areaId: area.id,
          }))}
          accion={guardarConfiguracionDocente}
        />
      </section>

      <section className="seccion-panel" aria-labelledby="titulo-modelos">
        <div className="titulo-seccion">
          <div>
            <span className="sobrelinea">Proveedores disponibles</span>
            <h2 id="titulo-modelos">Estado de la IA</h2>
          </div>
          <span className="contador-seccion">
            {proveedores.filter((proveedor) => proveedor.configurado).length} de{' '}
            {proveedores.length} configurados
          </span>
        </div>
        <div className="lista-experiencias">
          {proveedores.map(({ nombre, modelo, configurado, Icono }) => (
            <article className="fila-experiencia" key={nombre}>
              <span className="icono-experiencia">
                <Icono size={20} />
              </span>
              <div>
                <strong>{nombre}</strong>
                <small>
                  {configurado
                    ? `Modelo activo: ${modelo}`
                    : 'Sin clave configurada; se usará el modo demostración.'}
                </small>
              </div>
              <span
                className={`estado ${configurado ? 'estado-lista' : 'estado-analizando'}`}
              >
                {configurado ? 'Configurado' : 'Demostración'}
              </span>
            </article>
          ))}
        </div>
        <div className="estado-vacio">
          <span>
            <CheckCircle2 size={25} />
          </span>
          <div>
            <h3>Las claves permanecen protegidas</h3>
            <p>
              Esta pantalla solo indica si cada proveedor está disponible. No
              muestra ni envía las claves secretas al navegador.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
