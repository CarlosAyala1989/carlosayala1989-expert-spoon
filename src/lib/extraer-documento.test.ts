import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { extraerTextoDocumento } from '@/lib/extraer-documento'

function escaparTextoPdf(texto: string) {
  return texto.replace(/([\\()])/g, '\\$1')
}

function crearPdfConLineas(lineas: string[]) {
  const instrucciones = lineas
    .map(
      (linea, indice) =>
        `${indice === 0 ? '' : '0 -22 Td '}(${escaparTextoPdf(linea)}) Tj`,
    )
    .join(' ')
  const flujo = `BT /F1 14 Tf 72 720 Td ${instrucciones} ET`
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${flujo.length} >>\nstream\n${flujo}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const posiciones = [0]
  objetos.forEach((objeto, indice) => {
    posiciones.push(pdf.length)
    pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`
  })
  const inicioXref = pdf.length
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
  pdf += posiciones
    .slice(1)
    .map((posicion) => `${String(posicion).padStart(10, '0')} 00000 n \n`)
    .join('')
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`
  return new File([pdf], 'sesion.pdf', { type: 'application/pdf' })
}

async function crearDocxConParrafos(parrafos: string[]) {
  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  )
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
${parrafos.map((parrafo) => `<w:p><w:r><w:t>${parrafo}</w:t></w:r></w:p>`).join('')}
</w:body></w:document>`,
  )
  const datos = await zip.generateAsync({ type: 'arraybuffer' })
  return new File([datos], 'sesion.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

describe('extracción de documentos', () => {
  it('extrae un PDF por páginas y conserva sus líneas semánticas', async () => {
    const archivo = crearPdfConLineas([
      'Titulo de la sesion',
      'Somos parte del Estado',
      'Proposito de la sesion: comprender la participacion ciudadana.',
    ])

    const texto = await extraerTextoDocumento(archivo)

    expect(texto).toContain('[Página 1]')
    expect(texto).toMatch(/Titulo de la sesion\s+Somos parte del Estado/)
    expect(texto).toContain('participacion ciudadana')
  })

  it('extrae directamente el texto OOXML de un DOCX válido', async () => {
    const archivo = await crearDocxConParrafos([
      'Título de la sesión',
      'Somos parte del Estado',
      'Propósito de la sesión: comprender nuestros derechos y responsabilidades.',
    ])

    const texto = await extraerTextoDocumento(archivo)

    expect(texto.split('\n')).toEqual(
      expect.arrayContaining(['Título de la sesión', 'Somos parte del Estado']),
    )
    expect(texto).toContain('derechos y responsabilidades')
  })

  it('produce texto equivalente para una misma sesión en PDF y DOCX', async () => {
    const lineas = [
      'Titulo de la sesion',
      'Somos parte del Estado',
      'Los ciudadanos tienen derechos y responsabilidades en su comunidad.',
    ]
    const [textoPdf, textoDocx] = await Promise.all([
      extraerTextoDocumento(crearPdfConLineas(lineas)),
      crearDocxConParrafos(lineas).then(extraerTextoDocumento),
    ])

    for (const concepto of [
      'Somos parte del Estado',
      'derechos',
      'comunidad',
    ]) {
      expect(textoPdf).toContain(concepto)
      expect(textoDocx).toContain(concepto)
    }
  })

  it('rechaza archivos vacíos o de tipo no permitido', async () => {
    const vacio = new File([], 'sesion.pdf', { type: 'application/pdf' })
    const imagen = new File(['contenido'], 'foto.png', { type: 'image/png' })
    await expect(extraerTextoDocumento(vacio)).rejects.toThrow('vacío')
    await expect(extraerTextoDocumento(imagen)).rejects.toThrow(
      'Formato no permitido',
    )
  })

  it('explica cómo corregir un PDF dañado o protegido', async () => {
    const archivo = new File(['contenido que no es un PDF'], 'sesion.pdf', {
      type: 'application/pdf',
    })

    await expect(extraerTextoDocumento(archivo)).rejects.toThrow(
      'Verifica que tenga texto seleccionable',
    )
  })

  it('explica cómo corregir un DOCX dañado', async () => {
    const archivo = new File(['contenido que no es un DOCX'], 'sesion.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    await expect(extraerTextoDocumento(archivo)).rejects.toThrow(
      'No pudimos abrir el DOCX',
    )
  })

  it('mantiene el mensaje específico cuando el documento no tiene suficiente texto', async () => {
    const archivo = crearPdfConLineas(['Texto breve'])

    await expect(extraerTextoDocumento(archivo)).rejects.toThrow(
      'PDF escaneado',
    )
  })
})
