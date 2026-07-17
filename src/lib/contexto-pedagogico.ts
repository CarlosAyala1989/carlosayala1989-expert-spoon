export interface ContextoPedagogico {
  tituloDeclarado: string | null
  proposito: string | null
  evidencia: string | null
  ideasCentrales: string | null
  textoParaIa: string
}

const ENCABEZADOS_GENERICOS = [
  /^sesi[oó]n de aprendizaje$/i,
  /^t[ií]tulo de la sesi[oó]n$/i,
  /^datos generales$/i,
  /^prop[oó]sitos? de aprendizaje$/i,
  /^secuencia did[aá]ctica$/i,
  /^ficha de aprendizaje$/i,
  /^(nivel|grado|[aá]rea|secci[oó]n|fecha)$/i,
]

function limitar(texto: string, maximo: number) {
  if (texto.length <= maximo) return texto
  return `${texto.slice(0, maximo - 1).trimEnd()}…`
}

function esTituloUtil(texto: string) {
  const candidato = texto.replace(/^[:\-–—\s]+/, '').trim()
  return (
    candidato.length >= 3 &&
    candidato.length <= 90 &&
    !ENCABEZADOS_GENERICOS.some((patron) => patron.test(candidato)) &&
    !/^([ivx]+\.)?\s*(competencias?|capacidades?|desempeños?)$/i.test(candidato)
  )
}

export function detectarTituloSesion(texto: string) {
  const coincidenciaExplicita = texto.match(
    /(?:el\s+)?(?:t[ií]tulo de la sesi[oó]n(?: de hoy)?|tema de hoy)\s*(?:es|:)\s*[“"]([^”"\n]{3,90})[”"]/i,
  )
  if (coincidenciaExplicita && esTituloUtil(coincidenciaExplicita[1])) {
    return coincidenciaExplicita[1].trim()
  }

  const lineas = texto
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)

  for (let indice = 0; indice < lineas.length; indice += 1) {
    const linea = lineas[indice]
    const etiqueta = linea.match(
      /^t[ií]tulo de la sesi[oó]n(?:\s*[:\-–—]\s*|\s+)?(.*)$/i,
    )
    if (!etiqueta) continue

    if (etiqueta[1] && esTituloUtil(etiqueta[1])) {
      return etiqueta[1].trim()
    }

    for (
      let siguiente = indice + 1;
      siguiente < lineas.length;
      siguiente += 1
    ) {
      const candidato = lineas[siguiente]
      if (/^\[p[aá]gina \d+\]$/i.test(candidato)) continue
      if (esTituloUtil(candidato)) return candidato
      break
    }
  }

  const temaDeclarado = texto.match(
    /(?:introducci[oó]n|presentaci[oó]n del t[ií]tulo)[^\n]{0,100}?[“"]([^”"\n]{3,90})[”"]/i,
  )
  return temaDeclarado && esTituloUtil(temaDeclarado[1])
    ? temaDeclarado[1].trim()
    : null
}

function extraerBloque(
  texto: string,
  inicio: RegExp,
  finales: RegExp[],
  maximo: number,
) {
  const coincidencia = inicio.exec(texto)
  if (!coincidencia || coincidencia.index === undefined) return null

  const posicionInicial = coincidencia.index + coincidencia[0].length
  const restante = texto.slice(posicionInicial)
  let posicionFinal = Math.min(restante.length, maximo * 2)

  for (const final of finales) {
    const encontrada = final.exec(restante)
    if (encontrada?.index !== undefined) {
      posicionFinal = Math.min(posicionFinal, encontrada.index)
    }
  }

  const bloque = restante
    .slice(0, posicionFinal)
    .replace(/^\s*[:\-–—]\s*/, '')
    .replace(/\[p[aá]gina \d+\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return bloque.length >= 10 ? limitar(bloque, maximo) : null
}

function retirarDatosPersonales(texto: string) {
  return texto
    .split('\n')
    .filter((linea) => {
      const contenido = linea.trim()
      if (/^(docente|director)\s*:/i.test(contenido)) return false
      if (/^(docente|director)$/i.test(contenido)) return false
      if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(contenido)) return false
      return true
    })
    .join('\n')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[correo omitido]')
    .replace(/\b(?:\+?51\s*)?(?:\d[\s-]?){9}\b/g, '[teléfono omitido]')
}

export function analizarContextoPedagogico(texto: string): ContextoPedagogico {
  const textoParaIa = retirarDatosPersonales(texto).trim()
  const proposito = extraerBloque(
    textoParaIa,
    /prop[oó]sito de la sesi[oó]n\s*/i,
    [
      /evidencia de aprendizaje\s*:/i,
      /parte te[oó]rica(?: del tema)?\s*:/i,
      /\n\s*inicio\s*:/i,
    ],
    900,
  )
  const evidencia = extraerBloque(
    textoParaIa,
    /evidencia de aprendizaje\s*/i,
    [
      /parte te[oó]rica(?: del tema)?\s*:/i,
      /\n\s*inicio\s*:/i,
      /\n\s*desarrollo\b/i,
    ],
    900,
  )
  const ideasCentrales = extraerBloque(
    textoParaIa,
    /parte te[oó]rica(?: del tema)?\s*/i,
    [/\n\s*inicio\s*:/i, /\n\s*motivaci[oó]n\s*:/i, /\n\s*desarrollo\b/i],
    1_600,
  )

  return {
    tituloDeclarado: detectarTituloSesion(textoParaIa),
    proposito,
    evidencia,
    ideasCentrales,
    textoParaIa,
  }
}
