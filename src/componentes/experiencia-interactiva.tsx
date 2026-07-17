'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { VisualizacionPedagogica } from '@/componentes/visualizacion-pedagogica'
import { completarVisualizacionesExperiencia } from '@/lib/visualizaciones-pedagogicas'
import type { ExperienciaEducativa } from '@/tipos/educacion'

interface Propiedades {
  experiencia: ExperienciaEducativa
  aula: string
  area: string
  nivel: 'PRIMARIA' | 'SECUNDARIA'
  modo: 'IA' | 'DEMOSTRACION'
  modelo: string
}

export function ExperienciaInteractiva({
  experiencia: experienciaOriginal,
  aula,
  area,
  nivel,
  modo,
  modelo,
}: Propiedades) {
  const experiencia = completarVisualizacionesExperiencia(experienciaOriginal)
  const [paso, establecerPaso] = useState(0)
  const [respuestas, establecerRespuestas] = useState<Record<number, number>>(
    {},
  )
  const [mostrarResultados, establecerMostrarResultados] = useState(false)
  const totalBloques = experiencia.pasos.length + 2
  const progreso = ((paso + 1) / totalBloques) * 100
  const proveedor = modelo.toLowerCase().includes('deepseek')
    ? 'DeepSeek V4 Pro'
    : modelo.toLowerCase().includes('openai') ||
        modelo.toLowerCase().includes('gpt')
      ? 'OpenAI'
      : 'Generador local'

  function avanzar() {
    establecerPaso((actual) => Math.min(actual + 1, totalBloques - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function reiniciar() {
    establecerPaso(0)
    establecerRespuestas({})
    establecerMostrarResultados(false)
  }

  return (
    <main
      className={`experiencia experiencia-${nivel.toLowerCase()}`}
      style={
        {
          '--color-uno': experiencia.colores[0],
          '--color-dos': experiencia.colores[1],
          '--color-tres': experiencia.colores[2],
        } as React.CSSProperties
      }
    >
      <header className="barra-experiencia">
        <Link href="/panel">
          <ArrowLeft size={17} /> Volver al panel
        </Link>
        <div className="progreso-experiencia">
          <i style={{ width: `${progreso}%` }} />
        </div>
        <span>
          {aula} · {area}
        </span>
      </header>

      {paso === 0 && (
        <section className="portada-experiencia animar-entrada">
          <div className="texto-portada-experiencia">
            <span className="insignia-experiencia">
              <Sparkles size={15} />{' '}
              {modo === 'IA'
                ? `Creado con ${proveedor}`
                : `Demostración local · ${proveedor} seleccionado`}
            </span>
            <h1>{experiencia.titulo}</h1>
            <p className="subtitulo-experiencia">{experiencia.subtitulo}</p>
            <p className="introduccion-experiencia">
              {experiencia.introduccion}
            </p>
            <div className="objetivo-experiencia">
              <span>Tu misión</span>
              <p>{experiencia.objetivo}</p>
            </div>
            <button className="boton boton-experiencia" onClick={avanzar}>
              Comenzar el recorrido <ArrowRight size={19} />
            </button>
          </div>
          <VisualizacionPedagogica
            visualizacion={experiencia.visualizacion_portada}
            tema={experiencia.tema_visual}
            nivel={nivel}
            identificador="visual-portada"
          />
        </section>
      )}

      {paso > 0 &&
        paso <= experiencia.pasos.length &&
        (() => {
          const contenido = experiencia.pasos[paso - 1]
          return (
            <section className="paso-experiencia animar-entrada" key={paso}>
              <div className="contenido-paso-experiencia">
                <div className="numero-paso">
                  {String(paso).padStart(2, '0')}
                </div>
                <span className="icono-paso" aria-hidden="true">
                  {contenido.icono}
                </span>
                <span className="sobrelinea">
                  Paso {paso} de {experiencia.pasos.length}
                </span>
                <h2>{contenido.titulo}</h2>
                <p>{contenido.explicacion}</p>
                {paso === 2 && (
                  <aside className="dato-sorprendente">
                    <Lightbulb size={24} />
                    <div>
                      <strong>¿Sabías que…?</strong>
                      <p>{experiencia.dato_sorprendente}</p>
                    </div>
                  </aside>
                )}
                {paso === experiencia.pasos.length && (
                  <blockquote>“{experiencia.pregunta_reflexiva}”</blockquote>
                )}
                <div className="navegacion-pasos">
                  <button
                    className="boton boton-secundario"
                    onClick={() => establecerPaso(paso - 1)}
                  >
                    Anterior
                  </button>
                  <button className="boton boton-experiencia" onClick={avanzar}>
                    {paso === experiencia.pasos.length
                      ? 'Comprobar lo aprendido'
                      : 'Siguiente'}{' '}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
              <VisualizacionPedagogica
                visualizacion={contenido.visualizacion}
                tema={experiencia.tema_visual}
                nivel={nivel}
                identificador={`visual-paso-${paso}`}
              />
            </section>
          )
        })()}

      {paso === totalBloques - 1 && (
        <section className="evaluacion-experiencia animar-entrada">
          <div className="encabezado-evaluacion-experiencia">
            <div>
              <span className="sobrelinea">Reto final</span>
              <h2>¿Qué te llevas de esta aventura?</h2>
              <p>
                Elige una respuesta en cada tarjeta. Puedes intentarlo con
                calma.
              </p>
            </div>
            <VisualizacionPedagogica
              visualizacion={experiencia.visualizacion_cierre}
              tema={experiencia.tema_visual}
              nivel={nivel}
              identificador="visual-cierre"
            />
          </div>
          <div className="preguntas-experiencia">
            {experiencia.evaluacion.map((pregunta, indice) => (
              <article className="pregunta-tarjeta" key={pregunta.pregunta}>
                <span>Pregunta {indice + 1}</span>
                <h3>{pregunta.pregunta}</h3>
                <div>
                  {pregunta.opciones.map((opcion, opcionIndice) => {
                    const seleccionada = respuestas[indice] === opcionIndice
                    const correcta =
                      pregunta.respuesta_correcta === opcionIndice
                    return (
                      <button
                        className={`${seleccionada ? 'seleccionada' : ''} ${mostrarResultados && correcta ? 'correcta' : ''} ${mostrarResultados && seleccionada && !correcta ? 'incorrecta' : ''}`}
                        onClick={() =>
                          !mostrarResultados &&
                          establecerRespuestas({
                            ...respuestas,
                            [indice]: opcionIndice,
                          })
                        }
                        key={opcion}
                      >
                        <i>{String.fromCharCode(65 + opcionIndice)}</i>
                        {opcion}
                        {mostrarResultados && correcta && <Check size={17} />}
                      </button>
                    )
                  })}
                </div>
                {mostrarResultados && (
                  <p className="retroalimentacion">
                    {pregunta.retroalimentacion}
                  </p>
                )}
              </article>
            ))}
          </div>
          {!mostrarResultados ? (
            <button
              className="boton boton-experiencia boton-centro"
              disabled={
                Object.keys(respuestas).length !== experiencia.evaluacion.length
              }
              onClick={() => establecerMostrarResultados(true)}
            >
              Revisar mis respuestas <Sparkles size={18} />
            </button>
          ) : (
            <div className="cierre-experiencia">
              <span>🎉</span>
              <h3>¡Recorrido completado!</h3>
              <p>{experiencia.cierre}</p>
              <button className="boton boton-secundario" onClick={reiniciar}>
                <RotateCcw size={17} /> Recorrer otra vez
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
