import 'server-only'

import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise'
import { consultarFilas, obtenerBaseDatos } from '@/lib/base-datos'
import type { AreaCurricular, Aula, NivelEducativo } from '@/tipos/educacion'

export interface ParAsignacionDocente {
  aulaId: number
  areaId: number
}

export interface AsignacionDocente {
  aula: Aula
  area: AreaCurricular
}

interface FilaAsignacion extends RowDataPacket {
  aula_id: number
  aula_nivel: NivelEducativo
  aula_grado: number
  aula_nombre: string
  aula_edad_minima: number
  aula_edad_maxima: number
  aula_descripcion: string
  aula_color: string
  area_id: number
  area_nivel: NivelEducativo
  area_codigo: string
  area_nombre: string
  area_descripcion: string
}

interface FilaArea extends RowDataPacket {
  id: number
  nivel: NivelEducativo
  codigo: string
  nombre: string
  descripcion: string
}

interface FilaAulaValidacion extends RowDataPacket {
  id: number
  nivel: NivelEducativo
}

interface FilaAreaValidacion extends RowDataPacket {
  id: number
  nivel: NivelEducativo
  activa: boolean | number
}

interface FilaExiste extends RowDataPacket {
  existe: number
}

type EjecutorSql = Pick<PoolConnection, 'execute'>

const COLUMNAS_ASIGNACION = `
  a.id AS aula_id, a.nivel AS aula_nivel, a.grado AS aula_grado,
  a.nombre AS aula_nombre, a.edad_minima AS aula_edad_minima,
  a.edad_maxima AS aula_edad_maxima, a.descripcion AS aula_descripcion,
  a.color AS aula_color, ar.id AS area_id, ar.nivel AS area_nivel,
  ar.codigo AS area_codigo, ar.nombre AS area_nombre,
  ar.descripcion AS area_descripcion`

function esIdValido(id: number) {
  return Number.isSafeInteger(id) && id > 0
}

function clavePar(par: ParAsignacionDocente) {
  return `${par.aulaId}:${par.areaId}`
}

function deduplicarPares(
  pares: readonly ParAsignacionDocente[],
): ParAsignacionDocente[] {
  const unicos = new Map<string, ParAsignacionDocente>()
  for (const par of pares) {
    if (!esIdValido(par.aulaId) || !esIdValido(par.areaId)) {
      throw new Error('Las aulas y las áreas seleccionadas no son válidas.')
    }
    unicos.set(clavePar(par), { aulaId: par.aulaId, areaId: par.areaId })
  }
  return [...unicos.values()]
}

function convertirAsignacion(fila: FilaAsignacion): AsignacionDocente {
  return {
    aula: {
      id: fila.aula_id,
      nivel: fila.aula_nivel,
      grado: fila.aula_grado,
      nombre: fila.aula_nombre,
      edad_minima: fila.aula_edad_minima,
      edad_maxima: fila.aula_edad_maxima,
      descripcion: fila.aula_descripcion,
      color: fila.aula_color,
    },
    area: {
      id: fila.area_id,
      nivel: fila.area_nivel,
      codigo: fila.area_codigo,
      nombre: fila.area_nombre,
      descripcion: fila.area_descripcion,
    },
  }
}

export async function listarAsignacionesDocente(
  usuarioId: number,
): Promise<AsignacionDocente[]> {
  if (!esIdValido(usuarioId)) return []

  const filas = await consultarFilas<FilaAsignacion[]>(
    `SELECT ${COLUMNAS_ASIGNACION}
     FROM asignaciones_docentes ad
     INNER JOIN aulas a ON a.id = ad.aula_id
     INNER JOIN areas_curriculares ar
       ON ar.id = ad.area_curricular_id AND ar.nivel = a.nivel
     WHERE ad.usuario_id = ? AND ar.activa = TRUE
     ORDER BY FIELD(a.nivel, 'PRIMARIA', 'SECUNDARIA'), a.grado, ar.nombre`,
    [usuarioId],
  )
  return filas.map(convertirAsignacion)
}

export async function listarAreasAulaDocente(
  usuarioId: number,
  aulaId: number,
): Promise<AreaCurricular[]> {
  if (!esIdValido(usuarioId) || !esIdValido(aulaId)) return []

  return consultarFilas<FilaArea[]>(
    `SELECT ar.id, ar.nivel, ar.codigo, ar.nombre, ar.descripcion
     FROM asignaciones_docentes ad
     INNER JOIN aulas a ON a.id = ad.aula_id
     INNER JOIN areas_curriculares ar
       ON ar.id = ad.area_curricular_id AND ar.nivel = a.nivel
     WHERE ad.usuario_id = ? AND ad.aula_id = ? AND ar.activa = TRUE
     ORDER BY ar.nombre`,
    [usuarioId, aulaId],
  )
}

export async function buscarAsignacionDocente(
  usuarioId: number,
  aulaId: number,
  areaId: number,
): Promise<AsignacionDocente | null> {
  if (!esIdValido(usuarioId) || !esIdValido(aulaId) || !esIdValido(areaId)) {
    return null
  }

  const filas = await consultarFilas<FilaAsignacion[]>(
    `SELECT ${COLUMNAS_ASIGNACION}
     FROM asignaciones_docentes ad
     INNER JOIN aulas a ON a.id = ad.aula_id
     INNER JOIN areas_curriculares ar
       ON ar.id = ad.area_curricular_id AND ar.nivel = a.nivel
     WHERE ad.usuario_id = ? AND ad.aula_id = ?
       AND ad.area_curricular_id = ? AND ar.activa = TRUE
     LIMIT 1`,
    [usuarioId, aulaId, areaId],
  )
  return filas[0] ? convertirAsignacion(filas[0]) : null
}

export async function docenteTieneAsignacion(
  usuarioId: number,
  aulaId: number,
  areaId: number,
): Promise<boolean> {
  if (!esIdValido(usuarioId) || !esIdValido(aulaId) || !esIdValido(areaId)) {
    return false
  }

  const filas = await consultarFilas<FilaExiste[]>(
    `SELECT 1 AS existe
     FROM asignaciones_docentes ad
     INNER JOIN aulas a ON a.id = ad.aula_id
     INNER JOIN areas_curriculares ar
       ON ar.id = ad.area_curricular_id AND ar.nivel = a.nivel
     WHERE ad.usuario_id = ? AND ad.aula_id = ?
       AND ad.area_curricular_id = ? AND ar.activa = TRUE
     LIMIT 1`,
    [usuarioId, aulaId, areaId],
  )
  return filas.length > 0
}

export async function validarAsignacionesCurriculares(
  pares: readonly ParAsignacionDocente[],
): Promise<ParAsignacionDocente[]> {
  const unicos = deduplicarPares(pares)
  if (unicos.length === 0) return []

  const aulasIds = [...new Set(unicos.map((par) => par.aulaId))]
  const areasIds = [...new Set(unicos.map((par) => par.areaId))]
  const marcadoresAulas = aulasIds.map(() => '?').join(', ')
  const marcadoresAreas = areasIds.map(() => '?').join(', ')

  const [aulas, areas] = await Promise.all([
    consultarFilas<FilaAulaValidacion[]>(
      `SELECT id, nivel FROM aulas WHERE id IN (${marcadoresAulas})`,
      aulasIds,
    ),
    consultarFilas<FilaAreaValidacion[]>(
      `SELECT id, nivel, activa
       FROM areas_curriculares WHERE id IN (${marcadoresAreas})`,
      areasIds,
    ),
  ])
  const aulasPorId = new Map(aulas.map((aula) => [aula.id, aula]))
  const areasPorId = new Map(areas.map((area) => [area.id, area]))

  for (const par of unicos) {
    const aula = aulasPorId.get(par.aulaId)
    const area = areasPorId.get(par.areaId)
    if (!aula) throw new Error(`El aula ${par.aulaId} no existe.`)
    if (!area) throw new Error(`El área curricular ${par.areaId} no existe.`)
    if (!Boolean(area.activa)) {
      throw new Error(`El área curricular ${par.areaId} no está activa.`)
    }
    if (aula.nivel !== area.nivel) {
      throw new Error(
        'Cada curso debe pertenecer al mismo nivel educativo que su grado.',
      )
    }
  }

  return unicos
}

export async function insertarAsignacionesDocente(
  conexion: EjecutorSql,
  usuarioId: number,
  pares: readonly ParAsignacionDocente[],
): Promise<void> {
  if (!esIdValido(usuarioId)) {
    throw new Error('El docente indicado no es válido.')
  }
  const unicos = deduplicarPares(pares)
  if (unicos.length === 0) return

  const marcadores = unicos.map(() => '(?, ?, ?)').join(', ')
  const valores = unicos.flatMap((par) => [usuarioId, par.aulaId, par.areaId])
  await conexion.execute<ResultSetHeader>(
    `INSERT INTO asignaciones_docentes
      (usuario_id, aula_id, area_curricular_id)
     VALUES ${marcadores}`,
    valores,
  )
}

export async function reemplazarAsignacionesDocente(
  usuarioId: number,
  pares: readonly ParAsignacionDocente[],
): Promise<void> {
  if (!esIdValido(usuarioId)) {
    throw new Error('El docente indicado no es válido.')
  }
  const asignaciones = await validarAsignacionesCurriculares(pares)
  const conexion = await obtenerBaseDatos().getConnection()

  try {
    await conexion.beginTransaction()
    const [usuarios] = await conexion.execute<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE id = ? LIMIT 1 FOR UPDATE',
      [usuarioId],
    )
    if (usuarios.length === 0) throw new Error('El docente indicado no existe.')

    await conexion.execute<ResultSetHeader>(
      'DELETE FROM asignaciones_docentes WHERE usuario_id = ?',
      [usuarioId],
    )
    await insertarAsignacionesDocente(conexion, usuarioId, asignaciones)
    await conexion.commit()
  } catch (error) {
    await conexion.rollback()
    throw error
  } finally {
    conexion.release()
  }
}
