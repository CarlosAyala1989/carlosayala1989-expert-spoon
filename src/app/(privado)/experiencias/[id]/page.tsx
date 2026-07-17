import { notFound, redirect } from 'next/navigation'
import { ExperienciaInteractiva } from '@/componentes/experiencia-interactiva'
import { obtenerUsuarioActual } from '@/lib/autenticacion'
import { esquemaExperiencia } from '@/lib/inteligencia-artificial'
import { buscarExperiencia } from '@/lib/sesiones-aprendizaje'

export default async function PaginaExperiencia({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const usuario = await obtenerUsuarioActual()
  if (!usuario) redirect('/ingresar')
  const { id } = await params
  const registro = await buscarExperiencia(id, usuario.id)
  if (!registro) notFound()

  const contenido =
    typeof registro.contenido_json === 'string'
      ? JSON.parse(registro.contenido_json)
      : registro.contenido_json
  const validacion = esquemaExperiencia.safeParse(contenido)
  if (!validacion.success) notFound()

  return (
    <ExperienciaInteractiva
      experiencia={validacion.data}
      aula={registro.aula_nombre}
      area={registro.area_nombre}
      nivel={registro.nivel}
      modo={registro.modo_generacion}
      modelo={registro.modelo_ia}
    />
  )
}
