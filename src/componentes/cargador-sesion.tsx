'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpenCheck,
  BrainCircuit,
  Check,
  FileText,
  FileUp,
  GraduationCap,
  LoaderCircle,
  Sparkles,
  X,
} from 'lucide-react'
import type {
  AreaCurricular,
  Aula,
  ModeloIaSeleccionado,
} from '@/tipos/educacion'

const TAMANO_MAXIMO_ARCHIVO = 4 * 1024 * 1024

function validarArchivo(archivo: File) {
  const extension = archivo.name.toLowerCase().split('.').pop()
  const tipo = archivo.type.toLowerCase()
  const esPdf = extension === 'pdf' || tipo === 'application/pdf'
  const esDocx =
    extension === 'docx' ||
    tipo ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (
    extension === 'doc' ||
    (tipo === 'application/msword' && extension !== 'docx')
  ) {
    return 'El formato Word antiguo .doc no es compatible. Ábrelo en Word y guárdalo como .docx.'
  }
  if (!esPdf && !esDocx) {
    return 'Formato no permitido. Selecciona un archivo PDF o DOCX.'
  }
  if (archivo.size === 0) return 'El archivo está vacío.'
  if (archivo.size > TAMANO_MAXIMO_ARCHIVO) {
    return 'El archivo supera el límite de 4 MB.'
  }
  return null
}

export function CargadorSesion({
  aula,
  area,
  disponibilidadModelos,
}: {
  aula: Aula
  area: AreaCurricular
  disponibilidadModelos: { openai: boolean; deepseek: boolean }
}) {
  const [archivo, establecerArchivo] = useState<File | null>(null)
  const [error, establecerError] = useState('')
  const [procesando, establecerProcesando] = useState(false)
  const [arrastrando, establecerArrastrando] = useState(false)
  const [modeloIa, establecerModeloIa] = useState<ModeloIaSeleccionado>(
    disponibilidadModelos.deepseek ? 'deepseek-v4-pro' : 'openai',
  )
  const entrada = useRef<HTMLInputElement>(null)
  const enrutador = useRouter()
  const esDeepSeek = modeloIa === 'deepseek-v4-pro'
  const nombreModelo = esDeepSeek ? 'DeepSeek V4 Pro' : 'OpenAI'
  const modeloDisponible = esDeepSeek
    ? disponibilidadModelos.deepseek
    : disponibilidadModelos.openai
  const textoBoton = modeloDisponible
    ? `Crear con ${nombreModelo}`
    : `Crear demostración con ${nombreModelo}`
  const textoProcesando = modeloDisponible
    ? `${nombreModelo} está leyendo y creando…`
    : `Creando demostración local para ${nombreModelo}…`

  function seleccionarModelo(modelo: ModeloIaSeleccionado) {
    establecerModeloIa(modelo)
    establecerError('')
  }

  function seleccionarArchivo(nuevoArchivo: File | null) {
    if (!nuevoArchivo) return
    const errorArchivo = validarArchivo(nuevoArchivo)
    if (errorArchivo) {
      establecerArchivo(null)
      establecerError(errorArchivo)
      if (entrada.current) entrada.current.value = ''
      return
    }
    establecerArchivo(nuevoArchivo)
    establecerError('')
  }

  function quitarArchivo() {
    establecerArchivo(null)
    establecerError('')
    if (entrada.current) entrada.current.value = ''
  }

  async function enviar() {
    if (!archivo) {
      establecerError('Selecciona un documento.')
      return
    }
    establecerProcesando(true)
    establecerError('')
    const datos = new FormData()
    datos.set('archivo', archivo)
    datos.set('aulaId', String(aula.id))
    datos.set('areaId', String(area.id))
    datos.set('modeloIa', modeloIa)

    try {
      const respuesta = await fetch('/api/v1/sesiones', {
        method: 'POST',
        body: datos,
      })
      const resultado = (await respuesta.json().catch(() => ({}))) as {
        experienciaId?: string
        error?: string
      }
      if (!respuesta.ok || !resultado.experienciaId) {
        throw new Error(resultado.error || 'No se pudo crear la experiencia.')
      }
      enrutador.push(`/experiencias/${resultado.experienciaId}`)
    } catch (causa) {
      establecerError(
        causa instanceof Error ? causa.message : 'Ocurrió un error inesperado.',
      )
      establecerProcesando(false)
    }
  }

  return (
    <div className="cargador-sesion">
      <div className="contexto-carga-guardado" aria-label="Clase configurada">
        <span>
          <GraduationCap size={18} />
          <small>Grado guardado</small>
          <strong>{aula.nombre}</strong>
        </span>
        <span>
          <BookOpenCheck size={18} />
          <small>Curso guardado</small>
          <strong>{area.nombre}</strong>
        </span>
      </div>

      <fieldset className="selector-modelo">
        <legend>IA que creará la experiencia</legend>
        <label className="opcion-modelo">
          <input
            className="control-modelo"
            type="radio"
            name="modelo-ia"
            value="deepseek-v4-pro"
            checked={modeloIa === 'deepseek-v4-pro'}
            disabled={procesando}
            onChange={() => seleccionarModelo('deepseek-v4-pro')}
          />
          <span className="contenido-opcion-modelo">
            <span className="icono-modelo deepseek">
              <BrainCircuit size={20} />
            </span>
            <span className="texto-modelo">
              <strong>DeepSeek V4 Pro</strong>
              <small>
                {disponibilidadModelos.deepseek
                  ? 'API Key configurada · IA activa'
                  : 'Sin API Key · demostración local'}
              </small>
            </span>
            <span className="indicador-modelo" aria-hidden="true">
              <Check size={14} />
            </span>
          </span>
        </label>
        <label className="opcion-modelo">
          <input
            className="control-modelo"
            type="radio"
            name="modelo-ia"
            value="openai"
            checked={modeloIa === 'openai'}
            disabled={procesando}
            onChange={() => seleccionarModelo('openai')}
          />
          <span className="contenido-opcion-modelo">
            <span className="icono-modelo openai">
              <Sparkles size={20} />
            </span>
            <span className="texto-modelo">
              <strong>OpenAI</strong>
              <small>
                {disponibilidadModelos.openai
                  ? 'API Key configurada · IA activa'
                  : 'Sin API Key · demostración local'}
              </small>
            </span>
            <span className="indicador-modelo" aria-hidden="true">
              <Check size={14} />
            </span>
          </span>
        </label>
      </fieldset>

      <div
        className={`resumen-modelo ${esDeepSeek ? 'deepseek' : 'openai'}`}
        aria-live="polite"
        key={modeloIa}
      >
        <span className="icono-resumen-modelo">
          {esDeepSeek ? <BrainCircuit size={19} /> : <Sparkles size={19} />}
        </span>
        <span>
          <strong>{nombreModelo} seleccionado</strong>
          <small>
            {modeloDisponible
              ? `${nombreModelo} analizará el documento y creará la experiencia con IA.`
              : `${nombreModelo} todavía no tiene una API Key. Crearemos una demostración local y el archivo no se enviará a ${nombreModelo}.`}
          </small>
        </span>
        <em>{modeloDisponible ? 'IA activa' : 'Demostración local'}</em>
      </div>

      <div
        className={`zona-carga ${archivo ? 'con-archivo' : ''} ${arrastrando ? 'arrastrando' : ''}`}
        onDragEnter={(evento) => {
          evento.preventDefault()
          if (!procesando) establecerArrastrando(true)
        }}
        onDragOver={(evento) => {
          evento.preventDefault()
          if (!procesando) establecerArrastrando(true)
        }}
        onDragLeave={() => establecerArrastrando(false)}
        onDrop={(evento) => {
          evento.preventDefault()
          establecerArrastrando(false)
          if (procesando) return
          seleccionarArchivo(evento.dataTransfer.files[0] ?? null)
        }}
      >
        <input
          ref={entrada}
          className="entrada-archivo"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          aria-label="Elegir sesión en PDF o DOCX"
          disabled={procesando}
          onClick={(evento) => {
            evento.currentTarget.value = ''
          }}
          onChange={(evento) =>
            seleccionarArchivo(evento.target.files?.[0] ?? null)
          }
        />
        <div className="contenido-zona-carga">
          {archivo ? (
            <>
              <span className="icono-archivo">
                <FileText size={27} />
              </span>
              <span className="datos-archivo">
                <strong>{archivo.name}</strong>
                <small>
                  {(archivo.size / 1024 / 1024).toFixed(2)} MB · Toca para
                  reemplazarlo
                </small>
              </span>
            </>
          ) : (
            <>
              <span className="icono-subir">
                <FileUp size={28} />
              </span>
              <strong>Toca aquí para elegir tu sesión</strong>
              <span className="accion-elegir-archivo">Elegir PDF o DOCX</span>
              <small>
                También puedes arrastrarla desde tu computadora · máximo 4 MB
              </small>
            </>
          )}
        </div>
        {archivo && (
          <button
            type="button"
            className="quitar-archivo"
            aria-label={`Quitar ${archivo.name}`}
            disabled={procesando}
            onClick={quitarArchivo}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="boton boton-primario boton-ancho"
        onClick={enviar}
        disabled={!archivo || procesando}
      >
        {procesando ? (
          <>
            <LoaderCircle className="girando" size={18} /> {textoProcesando}
          </>
        ) : (
          <>
            <Sparkles size={18} /> {textoBoton}
          </>
        )}
      </button>
      <p className="nota-privacidad">
        {modeloDisponible
          ? `El archivo se procesará de forma privada con ${nombreModelo} y no se publicará.`
          : `Sin API Key: el archivo no se enviará a ${nombreModelo}; se usará el generador local.`}
      </p>
    </div>
  )
}
