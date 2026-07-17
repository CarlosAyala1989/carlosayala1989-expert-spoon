import { redirect } from 'next/navigation'
import { obtenerUsuarioActual } from '@/lib/autenticacion'

export default async function DisenoPrivado({
  children,
}: {
  children: React.ReactNode
}) {
  const usuario = await obtenerUsuarioActual()
  if (!usuario) redirect('/ingresar')

  return children
}
