import 'server-only'

import type { RowDataPacket } from 'mysql2/promise'
import { consultarFilas } from '@/lib/base-datos'
import type { AreaCurricular, Aula, NivelEducativo } from '@/tipos/educacion'

interface FilaAula extends RowDataPacket, Aula {}
interface FilaArea extends RowDataPacket, AreaCurricular {}

export async function listarAulas(): Promise<Aula[]> {
  return consultarFilas<FilaAula[]>(
    `SELECT id, nivel, grado, nombre, edad_minima, edad_maxima, descripcion, color
     FROM aulas ORDER BY FIELD(nivel, 'PRIMARIA', 'SECUNDARIA'), grado`,
  )
}

export async function buscarAula(id: number): Promise<Aula | null> {
  const filas = await consultarFilas<FilaAula[]>(
    `SELECT id, nivel, grado, nombre, edad_minima, edad_maxima, descripcion, color
     FROM aulas WHERE id = ? LIMIT 1`,
    [id],
  )
  return filas[0] ?? null
}

export async function listarAreas(
  nivel: NivelEducativo,
): Promise<AreaCurricular[]> {
  return consultarFilas<FilaArea[]>(
    `SELECT id, nivel, codigo, nombre, descripcion
     FROM areas_curriculares WHERE nivel = ? AND activa = TRUE ORDER BY id`,
    [nivel],
  )
}

export async function buscarArea(id: number): Promise<AreaCurricular | null> {
  const filas = await consultarFilas<FilaArea[]>(
    `SELECT id, nivel, codigo, nombre, descripcion
     FROM areas_curriculares WHERE id = ? AND activa = TRUE LIMIT 1`,
    [id],
  )
  return filas[0] ?? null
}
