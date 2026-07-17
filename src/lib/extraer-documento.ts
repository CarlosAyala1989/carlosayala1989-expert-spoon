import JSZip from 'jszip'
import { extractText } from 'unpdf'

const TAMANO_MAXIMO = 4 * 1024 * 1024
const TAMANO_MAXIMO_XML = 8 * 1024 * 1024
const TAMANO_MAXIMO_TEXTO = 60_000
const TIPOS_PERMITIDOS = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function decodificarEntidadesXml(texto: string) {
  const entidades: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"',
  }

  return texto.replace(
    /&(#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/gi,
    (coincidencia, entidad: string) => {
      if (entidad.startsWith('#x')) {
        return String.fromCodePoint(Number.parseInt(entidad.slice(2), 16))
      }
      if (entidad.startsWith('#')) {
        return String.fromCodePoint(Number.parseInt(entidad.slice(1), 10))
      }
      return entidades[entidad.toLowerCase()] ?? coincidencia
    },
  )
}

export function normalizarTextoExtraido(texto: string) {
  return texto
    .normalize('NFC')
    .replace(/\u00a0/g, ' ')
    .replace(/\u00ad/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((linea) => linea.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function extraerTextoPdf(datos: Uint8Array) {
  const resultado = await extractText(datos, { mergePages: false })
  if (!Array.isArray(resultado.text) || resultado.totalPages === 0) {
    return ''
  }

  return resultado.text
    .map((pagina, indice) => `[Página ${indice + 1}]\n${pagina}`)
    .join('\n\n')
}

function extraerTextoXmlWord(xml: string) {
  const partes: string[] = []
  const patron =
    /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>|<\/w:p>|<\/w:tc>|<\/w:tr>/gi

  for (const coincidencia of xml.matchAll(patron)) {
    if (coincidencia[1] !== undefined) {
      partes.push(decodificarEntidadesXml(coincidencia[1]))
      continue
    }

    if (/^<w:tab/i.test(coincidencia[0])) partes.push('\t')
    else partes.push('\n')
  }

  return partes.join('')
}

async function extraerTextoDocx(datos: Uint8Array) {
  const archivoComprimido = await JSZip.loadAsync(datos)
  const documento = archivoComprimido.file('word/document.xml')
  if (!documento) throw new Error('El DOCX no contiene un documento de Word.')

  const xml = await documento.async('string')
  if (xml.length > TAMANO_MAXIMO_XML) {
    throw new Error('El contenido interno del DOCX es demasiado grande.')
  }

  return extraerTextoXmlWord(xml)
}

export async function extraerTextoDocumento(archivo: File) {
  if (archivo.size === 0) throw new Error('El archivo está vacío.')
  if (archivo.size > TAMANO_MAXIMO) {
    throw new Error('El archivo supera el límite de 4 MB.')
  }

  const extension = archivo.name.toLowerCase().split('.').pop()
  const esPdf = archivo.type === 'application/pdf' || extension === 'pdf'
  const esDocx =
    archivo.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === 'docx'

  if (!TIPOS_PERMITIDOS.has(archivo.type) && !esPdf && !esDocx) {
    throw new Error('Formato no permitido. Sube un archivo PDF o DOCX.')
  }

  const datos = new Uint8Array(await archivo.arrayBuffer())
  let texto = ''

  if (esPdf) {
    try {
      texto = await extraerTextoPdf(datos)
    } catch {
      throw new Error(
        'No pudimos leer el PDF. Verifica que tenga texto seleccionable y que no esté protegido o dañado.',
      )
    }
  } else {
    try {
      texto = await extraerTextoDocx(datos)
    } catch {
      throw new Error(
        'No pudimos abrir el DOCX. Verifica que no esté dañado y vuelve a guardarlo desde Word.',
      )
    }
  }

  const textoLimpio = normalizarTextoExtraido(texto)
  if (textoLimpio.length < 40) {
    throw new Error(
      'No se pudo extraer suficiente texto. Si es un PDF escaneado, conviértelo primero a un PDF con texto seleccionable.',
    )
  }

  return textoLimpio.slice(0, TAMANO_MAXIMO_TEXTO)
}
