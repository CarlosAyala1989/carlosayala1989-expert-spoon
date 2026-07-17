'use client'

import { useId, useMemo, useState } from 'react'
import { BookOpen, Check, GraduationCap } from 'lucide-react'
import type { AreaCurricular, Aula } from '@/tipos/educacion'

interface AsignacionInicial {
  aulaId: number
  areaId: number
}

interface Propiedades {
  aulas: Aula[]
  areas: AreaCurricular[]
  asignacionesIniciales?: AsignacionInicial[]
  errores?: {
    aulas?: string[]
    asignaciones?: string[]
  }
  titulo?: string
  descripcion?: string
}

function construirSeleccionInicial(
  asignaciones: AsignacionInicial[],
): Map<number, Set<number>> {
  const seleccion = new Map<number, Set<number>>()
  for (const { aulaId, areaId } of asignaciones) {
    const areasAula = seleccion.get(aulaId) ?? new Set<number>()
    areasAula.add(areaId)
    seleccion.set(aulaId, areasAula)
  }
  return seleccion
}

export function SelectorAsignacionesDocente({
  aulas,
  areas,
  asignacionesIniciales = [],
  errores,
  titulo = '¿Qué grados y cursos enseñas?',
  descripcion = 'Selecciona uno o varios grados y luego marca los cursos que dictas en cada uno.',
}: Propiedades) {
  const idBase = useId().replace(/:/g, '')
  const [seleccion, establecerSeleccion] = useState(() =>
    construirSeleccionInicial(asignacionesIniciales),
  )

  const aulasSeleccionadas = useMemo(
    () => new Set(seleccion.keys()),
    [seleccion],
  )
  const totalCursos = useMemo(
    () =>
      Array.from(seleccion.values()).reduce(
        (total, areasAula) => total + areasAula.size,
        0,
      ),
    [seleccion],
  )

  function cambiarAula(aulaId: number, seleccionada: boolean) {
    establecerSeleccion((actual) => {
      const siguiente = new Map(actual)
      if (seleccionada)
        siguiente.set(aulaId, siguiente.get(aulaId) ?? new Set())
      else siguiente.delete(aulaId)
      return siguiente
    })
  }

  function cambiarArea(aulaId: number, areaId: number, seleccionada: boolean) {
    establecerSeleccion((actual) => {
      const siguiente = new Map(actual)
      const areasAula = new Set(siguiente.get(aulaId) ?? [])
      if (seleccionada) areasAula.add(areaId)
      else areasAula.delete(areaId)
      siguiente.set(aulaId, areasAula)
      return siguiente
    })
  }

  const errorAulas = errores?.aulas?.[0]
  const errorAsignaciones = errores?.asignaciones?.[0]
  const idAyuda = `${idBase}-ayuda`
  const idErrores = `${idBase}-errores`

  return (
    <section
      className="selector-asignaciones-docente"
      aria-labelledby={`${idBase}-titulo`}
      aria-describedby={`${idAyuda}${errorAulas || errorAsignaciones ? ` ${idErrores}` : ''}`}
    >
      <div className="encabezado-selector-docente">
        <span className="icono-selector-docente" aria-hidden="true">
          <GraduationCap size={21} />
        </span>
        <div>
          <h3 id={`${idBase}-titulo`}>{titulo}</h3>
          <p id={idAyuda}>{descripcion}</p>
        </div>
        <span className="resumen-seleccion-docente" aria-live="polite">
          {aulasSeleccionadas.size} grados · {totalCursos} cursos
        </span>
      </div>

      {(errorAulas || errorAsignaciones) && (
        <div className="mensaje-error" id={idErrores} role="alert">
          {errorAulas ?? errorAsignaciones}
        </div>
      )}

      {(['PRIMARIA', 'SECUNDARIA'] as const).map((nivel) => {
        const aulasNivel = aulas.filter((aula) => aula.nivel === nivel)
        if (aulasNivel.length === 0) return null
        return (
          <fieldset className="grupo-grados-docente" key={nivel}>
            <legend>{nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}</legend>
            <div className="lista-grados-docente">
              {aulasNivel.map((aula) => {
                const seleccionada = aulasSeleccionadas.has(aula.id)
                const idAula = `${idBase}-aula-${aula.id}`
                return (
                  <label
                    className={`opcion-grado-docente${seleccionada ? ' opcion-grado-seleccionada' : ''}`}
                    key={aula.id}
                    htmlFor={idAula}
                  >
                    <input
                      id={idAula}
                      type="checkbox"
                      name="aulas"
                      value={aula.id}
                      checked={seleccionada}
                      onChange={(evento) =>
                        cambiarAula(aula.id, evento.currentTarget.checked)
                      }
                    />
                    <span>{aula.nombre}</span>
                    {seleccionada && <Check size={15} aria-hidden="true" />}
                  </label>
                )
              })}
            </div>
          </fieldset>
        )
      })}

      {aulasSeleccionadas.size === 0 ? (
        <div className="estado-selector-docente">
          <GraduationCap size={22} aria-hidden="true" />
          <p>Elige al menos un grado para ver sus cursos.</p>
        </div>
      ) : (
        <div className="cursos-por-grado-docente">
          {aulas
            .filter((aula) => aulasSeleccionadas.has(aula.id))
            .map((aula) => {
              const areasDisponibles = areas.filter(
                (area) => area.nivel === aula.nivel,
              )
              const areasSeleccionadas = seleccion.get(aula.id) ?? new Set()
              return (
                <fieldset className="grupo-cursos-docente" key={aula.id}>
                  <legend>
                    <BookOpen size={17} aria-hidden="true" />
                    Cursos de {aula.nombre}
                    <small>{areasSeleccionadas.size} seleccionados</small>
                  </legend>
                  <div className="lista-cursos-docente">
                    {areasDisponibles.map((area) => {
                      const idArea = `${idBase}-aula-${aula.id}-area-${area.id}`
                      const marcada = areasSeleccionadas.has(area.id)
                      return (
                        <label
                          className={`opcion-curso-docente${marcada ? ' opcion-curso-seleccionada' : ''}`}
                          htmlFor={idArea}
                          key={area.id}
                        >
                          <input
                            id={idArea}
                            type="checkbox"
                            name="asignaciones"
                            value={`${aula.id}:${area.id}`}
                            checked={marcada}
                            onChange={(evento) =>
                              cambiarArea(
                                aula.id,
                                area.id,
                                evento.currentTarget.checked,
                              )
                            }
                          />
                          <span>{area.nombre}</span>
                          {marcada && <Check size={14} aria-hidden="true" />}
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              )
            })}
        </div>
      )}
    </section>
  )
}
