'use client'

import { useActionState } from 'react'
import { Save } from 'lucide-react'
import type { EstadoAutenticacion } from '@/app/acciones/autenticacion'
import { SelectorAsignacionesDocente } from '@/componentes/selector-asignaciones-docente'
import type { AreaCurricular, Aula } from '@/tipos/educacion'

interface AsignacionInicial {
  aulaId: number
  areaId: number
}

interface Propiedades {
  aulas: Aula[]
  areas: AreaCurricular[]
  asignacionesIniciales: AsignacionInicial[]
  accion: (
    estado: EstadoAutenticacion,
    formulario: FormData,
  ) => Promise<EstadoAutenticacion>
}

const estadoInicial: EstadoAutenticacion = {}

export function FormularioConfiguracionDocente({
  aulas,
  areas,
  asignacionesIniciales,
  accion,
}: Propiedades) {
  const [estado, accionFormulario, pendiente] = useActionState(
    accion,
    estadoInicial,
  )

  return (
    <form
      action={accionFormulario}
      className="formulario-configuracion-docente"
    >
      <SelectorAsignacionesDocente
        aulas={aulas}
        areas={areas}
        asignacionesIniciales={asignacionesIniciales}
        errores={{
          aulas: estado.errores?.aulas,
          asignaciones: estado.errores?.asignaciones,
        }}
        titulo="Grados y cursos que enseñas"
        descripcion="Esta selección organiza tus aulas y aparece automáticamente cuando creas una experiencia. Puedes actualizarla cuando cambie tu carga docente."
      />

      {estado.mensaje && (
        <p
          className={estado.exito ? 'mensaje-exito' : 'mensaje-error'}
          role={estado.exito ? 'status' : 'alert'}
          aria-live={estado.exito ? 'polite' : 'assertive'}
        >
          {estado.mensaje}
        </p>
      )}

      <button
        type="submit"
        className="boton boton-primario boton-guardar-configuracion"
        disabled={pendiente}
      >
        <Save size={17} aria-hidden="true" />
        {pendiente ? 'Guardando…' : 'Guardar grados y cursos'}
      </button>
    </form>
  )
}
