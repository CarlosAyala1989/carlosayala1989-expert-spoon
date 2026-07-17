import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Aula Viva · Tus sesiones cobran vida',
    template: '%s · Aula Viva',
  },
  description:
    'Convierte sesiones de aprendizaje en experiencias web interactivas adaptadas a cada grado de primaria y secundaria.',
}

export default function DisenoRaiz({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
