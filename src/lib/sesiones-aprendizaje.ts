import 'server-only'

import { randomUUID } from 'node:crypto'
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { consultarFilas, obtenerBaseDatos } from '@/lib/base-datos'
import type { ExperienciaEducativa } from '@/tipos/educacion'

export interface ResumenSesion extends RowDataPacket {
  id: string
  titulo_detectado: string
  estado: 'ANALIZANDO' | 'LISTA' | 'ERROR'
  creado_en: Date
  aula_nombre: string
  area_nombre: string
  experiencia_id: string | null
  modo_generacion: 'IA' | 'DEMOSTRACION' | null
}

export interface DetalleExperiencia extends RowDataPacket {
  id: string
  contenido_json: string | ExperienciaEducativa
  modelo_ia: string
  modo_generacion: 'IA' | 'DEMOSTRACION'
  publicada_en: Date
  docente_id: number
  aula_nombre: string
  nivel: 'PRIMARIA' | 'SECUNDARIA'
  grado: number
  edad_minima: number
  edad_maxima: number
  area_nombre: string
}

interface FilaTotalSesiones extends RowDataPacket {
  total: number
  listas: number
}

export interface PaginaSesionesDocente {
  sesiones: ResumenSesion[]
  pagina: number
  porPagina: number
  total: number
  totalPaginas: number
}

export interface MetricasSesionesDocente {
  total: number
  listas: number
}

export async function crearSesionEnAnalisis(datos: {
  usuarioId: number
  aulaId: number
  areaId: number
  nombreArchivo: string
  tipoArchivo: string
  tamanoBytes: number
  textoExtraido: string
}) {
  const id = randomUUID()
  const [resultado] = await obtenerBaseDatos().execute<ResultSetHeader>(
    `INSERT INTO sesiones_aprendizaje
      (id, usuario_id, aula_id, area_curricular_id, nombre_archivo, tipo_archivo, tamano_bytes, texto_extraido)
     SELECT ?, ad.usuario_id, ad.aula_id, ad.area_curricular_id, ?, ?, ?, ?
     FROM asignaciones_docentes ad
     WHERE ad.usuario_id = ? AND ad.aula_id = ? AND ad.area_curricular_id = ?
     LIMIT 1`,
    [
      id,
      datos.nombreArchivo.slice(0, 255),
      datos.tipoArchivo.slice(0, 100),
      datos.tamanoBytes,
      datos.textoExtraido,
      datos.usuarioId,
      datos.aulaId,
      datos.areaId,
    ],
  )
  if (resultado.affectedRows !== 1) {
    throw new Error(
      'Ese grado y curso ya no forman parte de tu configuración docente.',
    )
  }
  return id
}

export async function publicarExperiencia(datos: {
  sesionId: string
  titulo: string
  experiencia: ExperienciaEducativa
  modelo: string
  modo: 'IA' | 'DEMOSTRACION'
}) {
  const conexion = await obtenerBaseDatos().getConnection()
  const experienciaId = randomUUID()
  try {
    await conexion.beginTransaction()
    await conexion.execute(
      `UPDATE sesiones_aprendizaje
       SET titulo_detectado = ?, estado = 'LISTA', detalle_error = NULL
       WHERE id = ?`,
      [datos.titulo.slice(0, 255), datos.sesionId],
    )
    await conexion.execute(
      `INSERT INTO experiencias
        (id, sesion_aprendizaje_id, contenido_json, modelo_ia, modo_generacion)
       VALUES (?, ?, ?, ?, ?)`,
      [
        experienciaId,
        datos.sesionId,
        JSON.stringify(datos.experiencia),
        datos.modelo.slice(0, 80),
        datos.modo,
      ],
    )
    await conexion.commit()
    return experienciaId
  } catch (error) {
    await conexion.rollback()
    throw error
  } finally {
    conexion.release()
  }
}

export async function marcarSesionConError(sesionId: string, error: unknown) {
  const detalle =
    error instanceof Error ? error.message : 'Error no identificado'
  await obtenerBaseDatos().execute(
    `UPDATE sesiones_aprendizaje SET estado = 'ERROR', detalle_error = ? WHERE id = ?`,
    [detalle.slice(0, 1000), sesionId],
  )
}

export async function listarSesionesDelDocente(usuarioId: number, limite = 12) {
  const limiteSeguro = Math.min(Math.max(Math.trunc(limite), 1), 100)
  return consultarFilas<ResumenSesion[]>(
    `SELECT s.id, COALESCE(s.titulo_detectado, s.nombre_archivo) AS titulo_detectado,
            s.estado, s.creado_en, a.nombre AS aula_nombre, ar.nombre AS area_nombre,
            e.id AS experiencia_id, e.modo_generacion
     FROM sesiones_aprendizaje s
     INNER JOIN aulas a ON a.id = s.aula_id
     INNER JOIN areas_curriculares ar ON ar.id = s.area_curricular_id
     LEFT JOIN experiencias e ON e.sesion_aprendizaje_id = s.id
     WHERE s.usuario_id = ?
     ORDER BY s.creado_en DESC LIMIT ?`,
    [usuarioId, limiteSeguro],
  )
}

export async function obtenerMetricasSesionesDocente(
  usuarioId: number,
): Promise<MetricasSesionesDocente> {
  const filas = await consultarFilas<FilaTotalSesiones[]>(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(estado = 'LISTA'), 0) AS listas
     FROM sesiones_aprendizaje
     WHERE usuario_id = ?`,
    [usuarioId],
  )

  return {
    total: Number(filas[0]?.total ?? 0),
    listas: Number(filas[0]?.listas ?? 0),
  }
}

export async function listarPaginaSesionesDocente(
  usuarioId: number,
  paginaSolicitada = 1,
  porPaginaSolicitado = 10,
): Promise<PaginaSesionesDocente> {
  const porPagina = Math.min(
    Math.max(Math.trunc(porPaginaSolicitado) || 10, 1),
    50,
  )
  const paginaInicial = Math.max(Math.trunc(paginaSolicitada) || 1, 1)
  const metricas = await obtenerMetricasSesionesDocente(usuarioId)
  const totalPaginas = Math.max(Math.ceil(metricas.total / porPagina), 1)
  const pagina = Math.min(paginaInicial, totalPaginas)
  const desplazamiento = (pagina - 1) * porPagina

  const sesiones = await consultarFilas<ResumenSesion[]>(
    `SELECT s.id, COALESCE(s.titulo_detectado, s.nombre_archivo) AS titulo_detectado,
            s.estado, s.creado_en, a.nombre AS aula_nombre, ar.nombre AS area_nombre,
            e.id AS experiencia_id, e.modo_generacion
     FROM sesiones_aprendizaje s
     INNER JOIN aulas a ON a.id = s.aula_id
     INNER JOIN areas_curriculares ar ON ar.id = s.area_curricular_id
     LEFT JOIN experiencias e ON e.sesion_aprendizaje_id = s.id
     WHERE s.usuario_id = ?
     ORDER BY s.creado_en DESC LIMIT ? OFFSET ?`,
    [usuarioId, porPagina, desplazamiento],
  )

  return {
    sesiones,
    pagina,
    porPagina,
    total: metricas.total,
    totalPaginas,
  }
}

export async function buscarExperiencia(
  experienciaId: string,
  usuarioId: number,
): Promise<DetalleExperiencia | null> {
  const filas = await consultarFilas<DetalleExperiencia[]>(
    `SELECT e.id, e.contenido_json, e.modelo_ia, e.modo_generacion, e.publicada_en,
            s.usuario_id AS docente_id, a.nombre AS aula_nombre, a.nivel, a.grado,
            a.edad_minima, a.edad_maxima, ar.nombre AS area_nombre
     FROM experiencias e
     INNER JOIN sesiones_aprendizaje s ON s.id = e.sesion_aprendizaje_id
     INNER JOIN aulas a ON a.id = s.aula_id
     INNER JOIN areas_curriculares ar ON ar.id = s.area_curricular_id
     WHERE e.id = ? AND s.usuario_id = ? LIMIT 1`,
    [experienciaId, usuarioId],
  )
  return filas[0] ?? null
}
