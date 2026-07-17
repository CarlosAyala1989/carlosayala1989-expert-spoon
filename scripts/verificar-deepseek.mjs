const clave = process.env.DEEPSEEK_API_KEY?.trim()
const baseUrl =
  process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com'
const modelo = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-pro'

if (!clave) {
  console.error('Falta DEEPSEEK_API_KEY en .env.local.')
  process.exit(1)
}

const respuesta = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${clave}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: modelo,
    messages: [
      {
        role: 'system',
        content: 'Devuelve únicamente JSON válido.',
      },
      {
        role: 'user',
        content: 'Responde con {"estado":"ok"}.',
      },
    ],
    response_format: { type: 'json_object' },
    thinking: { type: 'disabled' },
    max_tokens: 40,
  }),
})

const cuerpo = await respuesta.json()
if (!respuesta.ok) {
  console.error(`DeepSeek respondió HTTP ${respuesta.status}.`)
  process.exit(1)
}

const contenido = cuerpo.choices?.[0]?.message?.content
let valido = false
try {
  valido = JSON.parse(contenido).estado === 'ok'
} catch {
  valido = false
}

if (!valido) {
  console.error('DeepSeek respondió, pero la salida JSON no fue la esperada.')
  process.exit(1)
}

console.log(
  JSON.stringify({ proveedor: 'DeepSeek', modelo, conexion: 'correcta' }),
)
