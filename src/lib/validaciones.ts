import { z } from 'zod'

const MAXIMO_AULAS_DOCENTE = 11
const MAXIMO_ASIGNACIONES_DOCENTE = 120

const esquemaIdentificador = z
  .string()
  .regex(/^[1-9]\d{0,14}$/, 'El identificador recibido no es válido.')
  .transform(Number)

const esquemaParAsignacion = z
  .string()
  .regex(
    /^[1-9]\d{0,14}:[1-9]\d{0,14}$/,
    'La asignación recibida no es válida.',
  )
  .transform((valor) => {
    const [aulaId, areaId] = valor.split(':').map(Number)
    return { aulaId, areaId }
  })

const camposConfiguracionDocente = {
  aulas: z
    .array(esquemaIdentificador)
    .min(1, 'Selecciona al menos un grado.')
    .max(
      MAXIMO_AULAS_DOCENTE,
      `Puedes seleccionar hasta ${MAXIMO_AULAS_DOCENTE} grados.`,
    ),
  asignaciones: z
    .array(esquemaParAsignacion)
    .min(1, 'Selecciona al menos un curso.')
    .max(
      MAXIMO_ASIGNACIONES_DOCENTE,
      'La cantidad de cursos seleccionados supera el límite permitido.',
    ),
}

function comprobarConfiguracionDocente(
  datos: {
    aulas: number[]
    asignaciones: { aulaId: number; areaId: number }[]
  },
  contexto: z.RefinementCtx,
) {
  const aulasUnicas = new Set(datos.aulas)
  if (aulasUnicas.size !== datos.aulas.length) {
    contexto.addIssue({
      code: 'custom',
      path: ['aulas'],
      message: 'Hay grados repetidos en la selección.',
    })
  }

  const paresUnicos = new Set<string>()
  for (const asignacion of datos.asignaciones) {
    if (!Number.isSafeInteger(asignacion.aulaId) || asignacion.aulaId <= 0) {
      contexto.addIssue({
        code: 'custom',
        path: ['asignaciones'],
        message: 'La asignación contiene un grado no válido.',
      })
      continue
    }
    if (!Number.isSafeInteger(asignacion.areaId) || asignacion.areaId <= 0) {
      contexto.addIssue({
        code: 'custom',
        path: ['asignaciones'],
        message: 'La asignación contiene un curso no válido.',
      })
      continue
    }
    if (!aulasUnicas.has(asignacion.aulaId)) {
      contexto.addIssue({
        code: 'custom',
        path: ['asignaciones'],
        message:
          'Cada curso debe pertenecer a uno de los grados seleccionados.',
      })
    }

    const clave = `${asignacion.aulaId}:${asignacion.areaId}`
    if (paresUnicos.has(clave)) {
      contexto.addIssue({
        code: 'custom',
        path: ['asignaciones'],
        message: 'Hay cursos repetidos para un mismo grado.',
      })
    }
    paresUnicos.add(clave)
  }

  for (const aulaId of aulasUnicas) {
    if (
      !datos.asignaciones.some((asignacion) => asignacion.aulaId === aulaId)
    ) {
      contexto.addIssue({
        code: 'custom',
        path: ['asignaciones'],
        message: 'Selecciona al menos un curso para cada grado.',
      })
      break
    }
  }
}

export const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre completo.').max(120),
  correo: z.email('Escribe un correo válido.').trim().toLowerCase().max(190),
  clave: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(72)
    .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, 'Incluye al menos una letra.')
    .regex(/[0-9]/, 'Incluye al menos un número.'),
})

export const esquemaConfiguracionDocente = z
  .object(camposConfiguracionDocente)
  .superRefine(comprobarConfiguracionDocente)

export const esquemaRegistroDocente = z
  .object({
    ...esquemaRegistro.shape,
    ...camposConfiguracionDocente,
  })
  .superRefine(comprobarConfiguracionDocente)

export const esquemaIngreso = z.object({
  correo: z.email('Escribe un correo válido.').trim().toLowerCase().max(190),
  clave: z.string().min(1, 'Escribe tu contraseña.').max(72),
})

export const esquemaCarga = z.object({
  aulaId: z.coerce.number().int().positive(),
  areaId: z.coerce.number().int().positive(),
  modeloIa: z.enum(['openai', 'deepseek-v4-pro']),
})

function obtenerValoresRepetidos(formulario: FormData, nombre: string) {
  return formulario.getAll(nombre)
}

export function validarFormularioRegistro(formulario: FormData) {
  return esquemaRegistroDocente.safeParse({
    nombre: formulario.get('nombre'),
    correo: formulario.get('correo'),
    clave: formulario.get('clave'),
    aulas: obtenerValoresRepetidos(formulario, 'aulas'),
    asignaciones: obtenerValoresRepetidos(formulario, 'asignaciones'),
  })
}

export function validarFormularioConfiguracionDocente(formulario: FormData) {
  return esquemaConfiguracionDocente.safeParse({
    aulas: obtenerValoresRepetidos(formulario, 'aulas'),
    asignaciones: obtenerValoresRepetidos(formulario, 'asignaciones'),
  })
}
