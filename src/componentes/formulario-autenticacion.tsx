'use client'

import Link from 'next/link'
import { useActionState, useId } from 'react'
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react'
import type { EstadoAutenticacion } from '@/app/acciones/autenticacion'
import { SelectorAsignacionesDocente } from '@/componentes/selector-asignaciones-docente'
import type { AreaCurricular, Aula } from '@/tipos/educacion'

interface Propiedades {
  modo: 'ingreso' | 'registro'
  accion: (
    estado: EstadoAutenticacion,
    formulario: FormData,
  ) => Promise<EstadoAutenticacion>
  aulas?: Aula[]
  areas?: AreaCurricular[]
}

const estadoInicial: EstadoAutenticacion = {}

export function FormularioAutenticacion({
  modo,
  accion,
  aulas = [],
  areas = [],
}: Propiedades) {
  const [estado, accionFormulario, pendiente] = useActionState(
    accion,
    estadoInicial,
  )
  const esRegistro = modo === 'registro'

  return (
    <form action={accionFormulario} className="formulario-autenticacion">
      {esRegistro && (
        <Campo
          icono={<UserRound size={18} />}
          etiqueta="Nombre completo"
          nombre="nombre"
          tipo="text"
          autocompletar="name"
          placeholder="María Torres"
          error={estado.errores?.nombre?.[0]}
        />
      )}
      <Campo
        icono={<Mail size={18} />}
        etiqueta="Correo institucional"
        nombre="correo"
        tipo="email"
        autocompletar="email"
        placeholder="docente@colegio.edu.pe"
        error={estado.errores?.correo?.[0]}
      />
      <Campo
        icono={<LockKeyhole size={18} />}
        etiqueta="Contraseña"
        nombre="clave"
        tipo="password"
        autocompletar={esRegistro ? 'new-password' : 'current-password'}
        placeholder={esRegistro ? '8 caracteres y un número' : 'Tu contraseña'}
        error={estado.errores?.clave?.[0]}
      />

      {esRegistro && (
        <SelectorAsignacionesDocente
          aulas={aulas}
          areas={areas}
          errores={{
            aulas: estado.errores?.aulas,
            asignaciones: estado.errores?.asignaciones,
          }}
        />
      )}

      {estado.mensaje && (
        <p className="mensaje-error" role="alert" aria-live="assertive">
          {estado.mensaje}
        </p>
      )}

      <button
        type="submit"
        className="boton boton-primario boton-ancho"
        disabled={pendiente}
      >
        {pendiente
          ? 'Un momento…'
          : esRegistro
            ? 'Crear mi espacio docente'
            : 'Entrar a mi espacio'}
        {!pendiente && <ArrowRight size={18} />}
      </button>

      <p className="cambio-autenticacion">
        {esRegistro ? '¿Ya tienes una cuenta?' : '¿Primera vez por aquí?'}{' '}
        <Link href={esRegistro ? '/ingresar' : '/registro'}>
          {esRegistro ? 'Inicia sesión' : 'Crea tu cuenta'}
        </Link>
      </p>
    </form>
  )
}

function Campo({
  icono,
  etiqueta,
  nombre,
  tipo,
  autocompletar,
  placeholder,
  error,
}: {
  icono: React.ReactNode
  etiqueta: string
  nombre: string
  tipo: string
  autocompletar: React.HTMLInputAutoCompleteAttribute
  placeholder: string
  error?: string
}) {
  const idCampo = useId()
  const idError = `${idCampo}-error`

  return (
    <label className="campo-formulario">
      <span>{etiqueta}</span>
      <span className="control-con-icono">
        {icono}
        <input
          id={idCampo}
          name={nombre}
          type={tipo}
          placeholder={placeholder}
          autoComplete={autocompletar}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? idError : undefined}
          required
        />
      </span>
      {error && (
        <small id={idError} role="alert">
          {error}
        </small>
      )}
    </label>
  )
}
