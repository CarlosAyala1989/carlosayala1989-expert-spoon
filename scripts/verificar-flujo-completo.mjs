import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import JSZip from 'jszip'
import mysql from 'mysql2/promise'

const modelosPermitidos = ['deepseek-v4-pro', 'openai']
const modeloPrueba = process.env.MODELO_IA_PRUEBA?.trim() || 'deepseek-v4-pro'
if (!modelosPermitidos.includes(modeloPrueba)) {
  throw new Error(`MODELO_IA_PRUEBA debe ser ${modelosPermitidos.join(' u ')}.`)
}

const aulaIdSolicitada = Number(process.env.AULA_ID_PRUEBA || 0)
const areaIdSolicitada = Number(process.env.AREA_ID_PRUEBA || 0)
const tituloEsperado = process.env.TITULO_ESPERADO_PRUEBA?.trim()
const temaVisualEsperado = process.env.TEMA_VISUAL_ESPERADO_PRUEBA?.trim()
const raicesVisualesEsperadas = (
  process.env.RAICES_VISUALES_ESPERADAS_PRUEBA || ''
)
  .split(',')
  .map((raiz) => raiz.trim())
  .filter(Boolean)
const terminosVisualesProhibidos = (
  process.env.TERMINOS_VISUALES_PROHIBIDOS_PRUEBA || ''
)
  .split(',')
  .map((termino) => termino.trim())
  .filter(Boolean)
if (Boolean(aulaIdSolicitada) !== Boolean(areaIdSolicitada)) {
  throw new Error(
    'AULA_ID_PRUEBA y AREA_ID_PRUEBA deben definirse juntas para probar una clase específica.',
  )
}

const variablesRequeridas = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'SESSION_SECRET',
]
if (modeloPrueba === 'deepseek-v4-pro') {
  variablesRequeridas.push('DEEPSEEK_API_KEY')
}
const faltantes = variablesRequeridas.filter(
  (nombre) => !process.env[nombre]?.trim(),
)
if (faltantes.length > 0) {
  throw new Error(`Faltan variables: ${faltantes.join(', ')}`)
}

const urlAplicacion = (process.env.APP_URL || 'http://127.0.0.1:3016').replace(
  /\/+$/,
  '',
)
const origenAplicacion = new URL(urlAplicacion).origin
const conexion = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? {} : undefined,
})

const idAcceso = randomUUID()
const token = randomBytes(32).toString('base64url')
const tokenHash = createHash('sha256')
  .update(`${token}:${process.env.SESSION_SECRET}`)
  .digest('hex')
const rutaArchivoReal = process.env.ARCHIVO_PRUEBA?.trim()
const extensionArchivoReal = rutaArchivoReal
  ? path.extname(rutaArchivoReal).toLowerCase()
  : '.docx'
const tipoArchivoPrueba =
  extensionArchivoReal === '.pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const nombreArchivo = rutaArchivoReal
  ? `verificacion-${randomUUID()}-${path.basename(rutaArchivoReal)}`
  : `verificacion-${randomUUID()}.docx`
let usuarioId
let asignacionTemporalCreada = false
let aulaIdTemporal
let areaIdTemporal

async function verificarInterfaz(ruta, opciones = {}) {
  const respuesta = await fetch(`${urlAplicacion}${ruta}`, opciones)
  const contenido = await respuesta.text()
  const tipoContenido = respuesta.headers.get('content-type') || ''
  if (!respuesta.ok) {
    throw new Error(
      `La interfaz ${ruta} respondió ${respuesta.status}: ${contenido.slice(0, 160)}`,
    )
  }
  if (!tipoContenido.includes('text/html') || !contenido.includes('<html')) {
    throw new Error(`La interfaz ${ruta} no devolvió una página HTML válida.`)
  }
  return contenido
}

async function crearDocx() {
  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  )
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Sesión: Cuidamos nuestro cuerpo con hábitos de higiene.</w:t></w:r></w:p>
    <w:p><w:r><w:t>El propósito es que los estudiantes reconozcan cuándo deben lavarse las manos, cómo usar agua y jabón y por qué el aseo protege su salud y la de su comunidad.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Los estudiantes observarán situaciones cotidianas, ordenarán los pasos del lavado de manos y explicarán una acción de cuidado personal.</w:t></w:r></w:p>
  </w:body>
</w:document>`,
  )
  return zip.generateAsync({ type: 'nodebuffer' })
}

function normalizarTexto(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function validarVisualizacion(visualizacion, ruta) {
  const tiposPermitidos = new Set([
    'mapa_conceptual',
    'linea_tiempo',
    'secuencia_animada',
    'comparacion',
    'escena_animada',
  ])
  if (!visualizacion || !tiposPermitidos.has(visualizacion.tipo)) {
    throw new Error(`${ruta} no contiene un tipo de visualización válido.`)
  }
  if (
    typeof visualizacion.titulo !== 'string' ||
    !visualizacion.titulo.trim()
  ) {
    throw new Error(`${ruta}.titulo está vacío.`)
  }
  if (
    !Array.isArray(visualizacion.elementos) ||
    visualizacion.elementos.length < 2 ||
    visualizacion.elementos.length > 4
  ) {
    throw new Error(`${ruta}.elementos debe contener entre 2 y 4 elementos.`)
  }
  visualizacion.elementos.forEach((elemento, indice) => {
    for (const campo of ['etiqueta', 'descripcion', 'icono']) {
      if (typeof elemento?.[campo] !== 'string' || !elemento[campo].trim()) {
        throw new Error(`${ruta}.elementos.${indice}.${campo} está vacío.`)
      }
    }
  })

  const textoVisual = normalizarTexto(JSON.stringify(visualizacion))
  if (
    raicesVisualesEsperadas.length > 0 &&
    !raicesVisualesEsperadas.some((raiz) =>
      textoVisual.includes(normalizarTexto(raiz)),
    )
  ) {
    throw new Error(
      `${ruta} no se relaciona con ninguna raíz temática esperada (${raicesVisualesEsperadas.join(', ')}).`,
    )
  }
  const prohibidoEncontrado = terminosVisualesProhibidos.find((termino) =>
    textoVisual.includes(normalizarTexto(termino)),
  )
  if (prohibidoEncontrado) {
    throw new Error(
      `${ruta} contiene el motivo visual prohibido “${prohibidoEncontrado}”.`,
    )
  }

  return visualizacion.tipo
}

async function obtenerDocumentoPrueba() {
  if (rutaArchivoReal) return readFile(rutaArchivoReal)
  return crearDocx()
}

try {
  for (const ruta of ['/', '/ingresar', '/registro']) {
    await verificarInterfaz(ruta)
  }

  for (const ruta of [
    '/panel',
    '/panel/aulas',
    '/panel/experiencias',
    '/panel/areas-curriculares',
    '/panel/configuracion',
  ]) {
    const respuestaSinAcceso = await fetch(`${urlAplicacion}${ruta}`, {
      redirect: 'manual',
    })
    const ubicacion = respuestaSinAcceso.headers.get('location') || ''
    if (
      ![303, 307, 308].includes(respuestaSinAcceso.status) ||
      !ubicacion.includes('/ingresar')
    ) {
      throw new Error(
        `La ruta privada ${ruta} no protegió el acceso sin sesión (${respuestaSinAcceso.status}).`,
      )
    }
  }

  const [usuarios] = await conexion.execute(
    'SELECT id FROM usuarios ORDER BY id LIMIT 1',
  )
  if (usuarios.length === 0) {
    throw new Error(
      'Crea al menos una cuenta docente antes de verificar el flujo.',
    )
  }
  usuarioId = usuarios[0].id

  await conexion.execute(
    `INSERT INTO accesos (id, usuario_id, token_hash, expira_en)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
    [idAcceso, usuarioId, tokenHash],
  )

  const [aulas] = aulaIdSolicitada
    ? await conexion.execute(
        `SELECT a.id AS aula_id, ar.id AS area_id
         FROM aulas a
         INNER JOIN areas_curriculares ar ON ar.nivel = a.nivel
         WHERE a.id = ? AND ar.id = ? LIMIT 1`,
        [aulaIdSolicitada, areaIdSolicitada],
      )
    : await conexion.execute(
        `SELECT a.id AS aula_id, ar.id AS area_id
         FROM aulas a
         INNER JOIN areas_curriculares ar ON ar.nivel = a.nivel
         WHERE a.nivel = 'PRIMARIA'
         ORDER BY a.grado, ar.id LIMIT 1`,
      )
  if (aulas.length === 0) throw new Error('No hay aulas o áreas configuradas.')
  aulaIdTemporal = aulas[0].aula_id
  areaIdTemporal = aulas[0].area_id

  const [asignacionesExistentes] = await conexion.execute(
    `SELECT 1 FROM asignaciones_docentes
     WHERE usuario_id = ? AND aula_id = ? AND area_curricular_id = ? LIMIT 1`,
    [usuarioId, aulaIdTemporal, areaIdTemporal],
  )
  if (asignacionesExistentes.length === 0) {
    await conexion.execute(
      `INSERT INTO asignaciones_docentes
        (usuario_id, aula_id, area_curricular_id) VALUES (?, ?, ?)`,
      [usuarioId, aulaIdTemporal, areaIdTemporal],
    )
    asignacionTemporalCreada = true
  }

  const rutasPrivadas = [
    '/panel',
    '/panel/aulas',
    '/panel/experiencias',
    '/panel/areas-curriculares',
    `/panel/aulas/${aulaIdTemporal}`,
    `/panel/aulas/${aulaIdTemporal}/areas/${areaIdTemporal}`,
    '/panel/configuracion',
  ]
  for (const ruta of rutasPrivadas) {
    await verificarInterfaz(ruta, {
      headers: { cookie: `educa_sesion=${token}` },
      redirect: 'manual',
    })
  }

  const documento = await obtenerDocumentoPrueba()
  const formulario = new FormData()
  formulario.set('aulaId', String(aulaIdTemporal))
  formulario.set('areaId', String(areaIdTemporal))
  formulario.set('modeloIa', modeloPrueba)
  formulario.set(
    'archivo',
    new Blob([documento], {
      type: tipoArchivoPrueba,
    }),
    nombreArchivo,
  )

  const respuesta = await fetch(`${urlAplicacion}/api/v1/sesiones`, {
    method: 'POST',
    headers: {
      cookie: `educa_sesion=${token}`,
      origin: origenAplicacion,
    },
    body: formulario,
  })
  const textoRespuesta = await respuesta.text()
  let cuerpo = {}
  try {
    cuerpo = JSON.parse(textoRespuesta)
  } catch {
    cuerpo = {}
  }
  if (!respuesta.ok || !cuerpo.experienciaId) {
    throw new Error(
      cuerpo.error ||
        `El endpoint respondió ${respuesta.status}: ${textoRespuesta.slice(0, 220)}`,
    )
  }

  const [experiencias] = await conexion.execute(
    `SELECT e.modelo_ia, e.modo_generacion, e.contenido_json, s.estado
     FROM experiencias e
     INNER JOIN sesiones_aprendizaje s ON s.id = e.sesion_aprendizaje_id
     WHERE e.id = ? AND s.usuario_id = ? LIMIT 1`,
    [cuerpo.experienciaId, usuarioId],
  )
  if (experiencias.length !== 1 || experiencias[0].estado !== 'LISTA') {
    throw new Error('La experiencia no quedó publicada correctamente.')
  }
  const contenidoExperiencia =
    typeof experiencias[0].contenido_json === 'string'
      ? JSON.parse(experiencias[0].contenido_json)
      : experiencias[0].contenido_json
  if (!Array.isArray(contenidoExperiencia?.pasos)) {
    throw new Error('La experiencia no contiene pasos válidos.')
  }
  const tiposVisualizacion = [
    validarVisualizacion(
      contenidoExperiencia.visualizacion_portada,
      'visualizacion_portada',
    ),
    ...contenidoExperiencia.pasos.map((paso, indice) =>
      validarVisualizacion(paso.visualizacion, `pasos.${indice}.visualizacion`),
    ),
    validarVisualizacion(
      contenidoExperiencia.visualizacion_cierre,
      'visualizacion_cierre',
    ),
  ]
  if (tiposVisualizacion.length !== contenidoExperiencia.pasos.length + 2) {
    throw new Error('No existe exactamente una visualización por panel.')
  }
  if (
    tituloEsperado &&
    contenidoExperiencia?.titulo?.toLocaleLowerCase('es') !==
      tituloEsperado.toLocaleLowerCase('es')
  ) {
    throw new Error(
      `La experiencia generó el título “${contenidoExperiencia?.titulo}” en vez de “${tituloEsperado}”.`,
    )
  }
  if (
    temaVisualEsperado &&
    contenidoExperiencia?.tema_visual !== temaVisualEsperado
  ) {
    throw new Error(
      `La experiencia generó el tema visual “${contenidoExperiencia?.tema_visual}” en vez de “${temaVisualEsperado}”.`,
    )
  }
  const proveedorConfigurado =
    modeloPrueba === 'deepseek-v4-pro'
      ? Boolean(process.env.DEEPSEEK_API_KEY?.trim())
      : Boolean(process.env.OPENAI_API_KEY?.trim())
  const modoEsperado = proveedorConfigurado ? 'IA' : 'DEMOSTRACION'
  const modeloEsperado = proveedorConfigurado
    ? modeloPrueba === 'deepseek-v4-pro'
      ? process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-pro'
      : process.env.OPENAI_MODEL?.trim() || 'gpt-5.4-mini'
    : `${modeloPrueba}-respaldo-local`
  if (
    experiencias[0].modo_generacion !== modoEsperado ||
    experiencias[0].modelo_ia !== modeloEsperado
  ) {
    throw new Error(
      `${modeloPrueba} no produjo el modo y modelo esperados (${modoEsperado}, ${modeloEsperado}).`,
    )
  }

  const rutaExperiencia = `/experiencias/${cuerpo.experienciaId}`
  const experienciaSinAcceso = await fetch(
    `${urlAplicacion}${rutaExperiencia}`,
    { redirect: 'manual' },
  )
  if (
    ![303, 307, 308].includes(experienciaSinAcceso.status) ||
    !(experienciaSinAcceso.headers.get('location') || '').includes('/ingresar')
  ) {
    throw new Error(
      'La experiencia publicada no protegió el acceso sin sesión.',
    )
  }

  const htmlExperiencia = await verificarInterfaz(rutaExperiencia, {
    headers: { cookie: `educa_sesion=${token}` },
    redirect: 'manual',
  })
  const nombreProveedor =
    modeloPrueba === 'deepseek-v4-pro' ? 'DeepSeek V4 Pro' : 'OpenAI'
  if (!htmlExperiencia.includes(nombreProveedor)) {
    throw new Error(
      'La interfaz de la experiencia no identificó el proveedor elegido.',
    )
  }
  if (!htmlExperiencia.includes('visualizacion-pedagogica')) {
    throw new Error(
      'La interfaz publicada no renderizó la visualización pedagógica.',
    )
  }
  if (
    htmlExperiencia.includes('lienzo-tres') ||
    htmlExperiencia.includes('Arrastra para explorar')
  ) {
    throw new Error(
      'La interfaz publicada volvió a mostrar la escena espacial genérica.',
    )
  }

  console.log(
    JSON.stringify({
      cargaDocumento: 'correcta',
      documento: rutaArchivoReal
        ? extensionArchivoReal === '.pdf'
          ? 'pdf-real'
          : 'word-real'
        : 'docx-generado',
      autenticacion: 'correcta',
      baseDatos: 'correcta',
      proveedorElegido: modeloPrueba,
      modelo: experiencias[0].modelo_ia,
      modo: experiencias[0].modo_generacion,
      titulo: contenidoExperiencia?.titulo,
      temaVisual: contenidoExperiencia?.tema_visual,
      cantidadVisualizaciones: tiposVisualizacion.length,
      tiposVisualizacion,
      experiencia: 'publicada',
      interfaces: 'públicas-privadas-y-protegidas-correctas',
    }),
  )
} finally {
  if (usuarioId) {
    await conexion.execute(
      'DELETE FROM sesiones_aprendizaje WHERE usuario_id = ? AND nombre_archivo = ?',
      [usuarioId, nombreArchivo],
    )
  }
  if (
    asignacionTemporalCreada &&
    usuarioId &&
    aulaIdTemporal &&
    areaIdTemporal
  ) {
    await conexion.execute(
      `DELETE FROM asignaciones_docentes
       WHERE usuario_id = ? AND aula_id = ? AND area_curricular_id = ?`,
      [usuarioId, aulaIdTemporal, areaIdTemporal],
    )
  }
  await conexion.execute('DELETE FROM accesos WHERE id = ?', [idAcceso])
  await conexion.end()
}
