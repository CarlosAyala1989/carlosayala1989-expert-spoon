import type { CSSProperties } from 'react'
import type {
  NivelEducativo,
  TemaVisual,
  TipoVisualizacionPedagogica,
  VisualizacionPedagogica as DatosVisualizacion,
} from '@/tipos/educacion'

interface Propiedades {
  visualizacion: DatosVisualizacion
  tema: TemaVisual
  nivel: NivelEducativo
  identificador: string
}

const NOMBRES_TIPO: Record<TipoVisualizacionPedagogica, string> = {
  mapa_conceptual: 'Mapa conceptual',
  linea_tiempo: 'Línea de tiempo',
  secuencia_animada: 'Secuencia animada',
  comparacion: 'Comparación visual',
  escena_animada: 'Escena animada',
}

const ICONOS_TIPO: Record<TipoVisualizacionPedagogica, string> = {
  mapa_conceptual: '🧠',
  linea_tiempo: '🕰️',
  secuencia_animada: '▶️',
  comparacion: '⚖️',
  escena_animada: '🎬',
}

function estiloElemento(indice: number) {
  return { '--indice-visual': indice } as CSSProperties
}

function MapaConceptual({
  visualizacion,
}: {
  visualizacion: DatosVisualizacion
}) {
  return (
    <div className="mapa-conceptual-visual">
      <div className="nodo-central-visual" aria-hidden="true">
        <span>Idea central</span>
        <strong>{visualizacion.titulo}</strong>
      </div>
      <ul className="ramas-mapa-visual">
        {visualizacion.elementos.map((elemento, indice) => (
          <li
            className="rama-mapa-visual"
            style={estiloElemento(indice)}
            key={`${elemento.etiqueta}-${indice}`}
          >
            <span className="icono-elemento-visual" aria-hidden="true">
              {elemento.icono}
            </span>
            <div>
              <strong>{elemento.etiqueta}</strong>
              <p>{elemento.descripcion}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LineaTiempo({ visualizacion }: { visualizacion: DatosVisualizacion }) {
  return (
    <ol className="linea-tiempo-visual">
      {visualizacion.elementos.map((elemento, indice) => (
        <li
          className="hito-tiempo-visual"
          style={estiloElemento(indice)}
          key={`${elemento.etiqueta}-${indice}`}
        >
          <div className="marca-tiempo-visual">
            <span aria-hidden="true">{elemento.icono}</span>
            <i>{indice + 1}</i>
          </div>
          <strong>{elemento.etiqueta}</strong>
          <p>{elemento.descripcion}</p>
        </li>
      ))}
    </ol>
  )
}

function SecuenciaAnimada({
  visualizacion,
}: {
  visualizacion: DatosVisualizacion
}) {
  return (
    <ol className="secuencia-visual">
      {visualizacion.elementos.map((elemento, indice) => (
        <li
          className="accion-secuencia-visual"
          style={estiloElemento(indice)}
          key={`${elemento.etiqueta}-${indice}`}
        >
          <span className="numero-secuencia-visual">{indice + 1}</span>
          <span className="icono-secuencia-visual" aria-hidden="true">
            {elemento.icono}
          </span>
          <div>
            <strong>{elemento.etiqueta}</strong>
            <p>{elemento.descripcion}</p>
          </div>
          {indice < visualizacion.elementos.length - 1 && (
            <span className="flecha-secuencia-visual" aria-hidden="true">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

function ComparacionVisual({
  visualizacion,
}: {
  visualizacion: DatosVisualizacion
}) {
  return (
    <dl className="comparacion-visual">
      {visualizacion.elementos.map((elemento, indice) => (
        <div
          className="lado-comparacion-visual"
          style={estiloElemento(indice)}
          key={`${elemento.etiqueta}-${indice}`}
        >
          <span aria-hidden="true">{elemento.icono}</span>
          <dt>{elemento.etiqueta}</dt>
          <dd>{elemento.descripcion}</dd>
        </div>
      ))}
    </dl>
  )
}

function EscenaAnimada({
  visualizacion,
}: {
  visualizacion: DatosVisualizacion
}) {
  return (
    <div className="escena-contextual-visual">
      <div className="marco-escena-visual">
        {visualizacion.elementos.map((elemento, indice) => (
          <article
            className="actor-escena-visual"
            style={estiloElemento(indice)}
            key={`${elemento.etiqueta}-${indice}`}
          >
            <span aria-hidden="true">{elemento.icono}</span>
            <div>
              <strong>{elemento.etiqueta}</strong>
              <p>{elemento.descripcion}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="suelo-escena-visual" aria-hidden="true" />
    </div>
  )
}

function CuerpoVisualizacion({
  visualizacion,
}: {
  visualizacion: DatosVisualizacion
}) {
  if (visualizacion.tipo === 'mapa_conceptual') {
    return <MapaConceptual visualizacion={visualizacion} />
  }
  if (visualizacion.tipo === 'linea_tiempo') {
    return <LineaTiempo visualizacion={visualizacion} />
  }
  if (visualizacion.tipo === 'secuencia_animada') {
    return <SecuenciaAnimada visualizacion={visualizacion} />
  }
  if (visualizacion.tipo === 'comparacion') {
    return <ComparacionVisual visualizacion={visualizacion} />
  }
  return <EscenaAnimada visualizacion={visualizacion} />
}

export function VisualizacionPedagogica({
  visualizacion,
  tema,
  nivel,
  identificador,
}: Propiedades) {
  const idTitulo = `${identificador}-titulo`

  return (
    <figure
      className={`visualizacion-pedagogica visualizacion-${visualizacion.tipo}`}
      data-testid="visualizacion-pedagogica"
      data-tipo={visualizacion.tipo}
      data-tema={tema}
      data-nivel={nivel.toLowerCase()}
      aria-labelledby={idTitulo}
    >
      <figcaption className="encabezado-visualizacion">
        <span aria-hidden="true">{ICONOS_TIPO[visualizacion.tipo]}</span>
        {NOMBRES_TIPO[visualizacion.tipo]}
      </figcaption>
      <h3 id={idTitulo}>{visualizacion.titulo}</h3>
      <CuerpoVisualizacion visualizacion={visualizacion} />
    </figure>
  )
}
