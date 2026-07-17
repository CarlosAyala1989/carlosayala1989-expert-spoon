import Link from 'next/link'

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <Link
      className="marca"
      href="/"
      aria-label={compacta ? 'Aula Viva — inicio' : undefined}
    >
      <span className="marca-simbolo" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {!compacta && (
        <span>
          Aula <strong>Viva</strong>
        </span>
      )}
    </Link>
  )
}
