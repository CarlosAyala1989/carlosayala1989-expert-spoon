export type NivelEducativo = 'PRIMARIA' | 'SECUNDARIA'

export type ModeloIaSeleccionado = 'openai' | 'deepseek-v4-pro'

export type TemaVisual =
  | 'ciudadania'
  | 'historia'
  | 'geografia'
  | 'higiene'
  | 'naturaleza'
  | 'matematica'
  | 'comunicacion'
  | 'arte'
  | 'movimiento'
  | 'tecnologia'

export type TipoVisualizacionPedagogica =
  | 'mapa_conceptual'
  | 'linea_tiempo'
  | 'secuencia_animada'
  | 'comparacion'
  | 'escena_animada'

export interface ElementoVisualizacion {
  etiqueta: string
  descripcion: string
  icono: string
}

export interface VisualizacionPedagogica {
  tipo: TipoVisualizacionPedagogica
  titulo: string
  elementos: ElementoVisualizacion[]
}

export interface Aula {
  id: number
  nivel: NivelEducativo
  grado: number
  nombre: string
  edad_minima: number
  edad_maxima: number
  descripcion: string
  color: string
}

export interface AreaCurricular {
  id: number
  nivel: NivelEducativo
  codigo: string
  nombre: string
  descripcion: string
}

export interface PasoExperiencia {
  titulo: string
  explicacion: string
  icono: string
  /** Opcional para poder abrir experiencias creadas antes del sistema visual. */
  visualizacion?: VisualizacionPedagogica
}

export interface PreguntaExperiencia {
  pregunta: string
  opciones: string[]
  respuesta_correcta: number
  retroalimentacion: string
}

export interface ExperienciaEducativa {
  titulo: string
  subtitulo: string
  objetivo: string
  introduccion: string
  tema_visual: TemaVisual
  colores: string[]
  personaje: string
  /** Opcional únicamente por compatibilidad con experiencias ya guardadas. */
  visualizacion_portada?: VisualizacionPedagogica
  pasos: PasoExperiencia[]
  dato_sorprendente: string
  pregunta_reflexiva: string
  evaluacion: PreguntaExperiencia[]
  /** Opcional únicamente por compatibilidad con experiencias ya guardadas. */
  visualizacion_cierre?: VisualizacionPedagogica
  cierre: string
}

export interface UsuarioActual {
  id: number
  nombre: string
  correo: string
  rol: 'DOCENTE' | 'ADMINISTRADOR'
}
