import Link from 'next/link'
import { ArrowUpRight, UsersRound } from 'lucide-react'
import type { Aula } from '@/tipos/educacion'

export function TarjetaAula({ aula }: { aula: Aula }) {
  const numero = String(aula.grado).padStart(2, '0')
  return (
    <Link
      className="tarjeta-aula"
      href={`/panel/aulas/${aula.id}`}
      style={{ '--color-aula': aula.color } as React.CSSProperties}
    >
      <span className="aula-numero">{numero}</span>
      <span className="aula-icono">
        <UsersRound size={21} />
      </span>
      <span className="aula-nivel">{aula.nivel.toLowerCase()}</span>
      <h3>{aula.nombre}</h3>
      <p>
        {aula.edad_minima} a {aula.edad_maxima} años
      </p>
      <span className="aula-accion">
        Preparar clase <ArrowUpRight size={17} />
      </span>
    </Link>
  )
}
