import type {
  ElementoVisualizacion,
  ExperienciaEducativa,
  PasoExperiencia,
  TemaVisual,
  TipoVisualizacionPedagogica,
  VisualizacionPedagogica,
} from '@/tipos/educacion'

export type ExperienciaConVisualizaciones = Omit<
  ExperienciaEducativa,
  'pasos' | 'visualizacion_portada' | 'visualizacion_cierre'
> & {
  visualizacion_portada: VisualizacionPedagogica
  pasos: Array<PasoExperiencia & { visualizacion: VisualizacionPedagogica }>
  visualizacion_cierre: VisualizacionPedagogica
}

const ICONOS_POR_TEMA: Record<TemaVisual, string[]> = {
  ciudadania: ['🏛️', '👥', '⚖️', '🤝'],
  historia: ['📜', '🕰️', '🏺', '🧭'],
  geografia: ['🗺️', '⛰️', '🌎', '📍'],
  higiene: ['🧼', '💧', '🫧', '🙌'],
  naturaleza: ['🌱', '🌳', '🐝', '🌎'],
  matematica: ['🔢', '➗', '📐', '🧩'],
  comunicacion: ['📖', '💬', '✍️', '🔤'],
  arte: ['🎨', '🎭', '🎵', '🖌️'],
  movimiento: ['🏃', '🤸', '⚽', '💪'],
  tecnologia: ['💻', '⚙️', '💡', '🛠️'],
}

function recortar(texto: string, maximo = 150) {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  return limpio.length <= maximo
    ? limpio
    : `${limpio.slice(0, maximo - 1).trimEnd()}…`
}

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function inferirTipoVisualizacion(
  experiencia: ExperienciaEducativa,
  paso: PasoExperiencia,
): TipoVisualizacionPedagogica {
  const texto = normalizar(`${paso.titulo} ${paso.explicacion}`)

  if (
    experiencia.tema_visual === 'historia' ||
    /\b(ano|siglo|epoca|cronologia|antes|despues|primero|finalmente)\b/.test(
      texto,
    )
  ) {
    return 'linea_tiempo'
  }
  if (
    /\b(compara|contrasta|diferencia|semejanza|alternativa|por un lado)\b/.test(
      texto,
    )
  ) {
    return 'comparacion'
  }
  if (
    experiencia.tema_visual === 'higiene' ||
    experiencia.tema_visual === 'movimiento' ||
    /\b(paso|proceso|ordena|secuencia|recorrido|procedimiento)\b/.test(texto)
  ) {
    return 'secuencia_animada'
  }
  if (
    /\b(observa|escena|situacion|actua|participa|decide|comunidad|persona)\b/.test(
      texto,
    )
  ) {
    return 'escena_animada'
  }
  return 'mapa_conceptual'
}

function crearElementosDesdePasos(
  experiencia: ExperienciaEducativa,
  indices: number[],
): ElementoVisualizacion[] {
  const iconos = ICONOS_POR_TEMA[experiencia.tema_visual]
  const indicesUnicos = [...new Set(indices)].filter(
    (indice) => indice >= 0 && indice < experiencia.pasos.length,
  )

  return indicesUnicos.slice(0, 4).map((indice, posicion) => {
    const paso = experiencia.pasos[indice]
    return {
      etiqueta: recortar(paso.titulo, 55),
      descripcion: recortar(paso.explicacion),
      icono: paso.icono || iconos[posicion % iconos.length],
    }
  })
}

function crearVisualizacionPortada(
  experiencia: ExperienciaEducativa,
): VisualizacionPedagogica {
  if (experiencia.visualizacion_portada) {
    return experiencia.visualizacion_portada
  }

  return {
    tipo: 'mapa_conceptual',
    titulo: recortar(experiencia.titulo, 90),
    elementos: crearElementosDesdePasos(
      experiencia,
      experiencia.pasos.map((_, indice) => indice),
    ),
  }
}

function crearVisualizacionPaso(
  experiencia: ExperienciaEducativa,
  indice: number,
): VisualizacionPedagogica {
  const paso = experiencia.pasos[indice]
  if (paso.visualizacion) return paso.visualizacion

  const indicesRelacionados = [indice]
  if (indice > 0) indicesRelacionados.unshift(indice - 1)
  if (indice < experiencia.pasos.length - 1) {
    indicesRelacionados.push(indice + 1)
  }
  if (indicesRelacionados.length < 2) {
    indicesRelacionados.push(indice === 0 ? 1 : 0)
  }

  return {
    tipo: inferirTipoVisualizacion(experiencia, paso),
    titulo: recortar(paso.titulo, 90),
    elementos: crearElementosDesdePasos(experiencia, indicesRelacionados),
  }
}

function crearVisualizacionCierre(
  experiencia: ExperienciaEducativa,
): VisualizacionPedagogica {
  if (experiencia.visualizacion_cierre) {
    return experiencia.visualizacion_cierre
  }

  return {
    tipo: 'mapa_conceptual',
    titulo: recortar(`Lo que aprendiste sobre ${experiencia.titulo}`, 90),
    elementos: crearElementosDesdePasos(
      experiencia,
      experiencia.pasos.map((_, indice) => indice),
    ),
  }
}

/**
 * Completa de forma determinista los JSON antiguos. Nunca inventa figuras
 * decorativas: reutiliza el título, los pasos y los iconos reales del tema.
 */
export function completarVisualizacionesExperiencia(
  experiencia: ExperienciaEducativa,
): ExperienciaConVisualizaciones {
  return {
    ...experiencia,
    visualizacion_portada: crearVisualizacionPortada(experiencia),
    pasos: experiencia.pasos.map((paso, indice) => ({
      ...paso,
      visualizacion: crearVisualizacionPaso(experiencia, indice),
    })),
    visualizacion_cierre: crearVisualizacionCierre(experiencia),
  }
}
