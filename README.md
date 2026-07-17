# Aula Viva

Aula Viva convierte una sesión de aprendizaje en una experiencia web breve, visual e interactiva para estudiantes de Educación Básica Regular (EBR) del Perú.

Al crear su cuenta, el docente registra los grados y cursos que enseña. Después abre una de esas combinaciones guardadas y sube un PDF o DOCX sin volver a elegir el grado o el curso. El sistema extrae el texto, lo analiza con IA y conserva una experiencia estructurada que Next.js presenta con narrativa, una visualización temática animada en cada panel y preguntas con retroalimentación.

## Primera versión incluida

- Registro obligatorio del perfil docente con uno o varios grados y al menos un curso por grado.
- Inicio y cierre de sesión para docentes, con posibilidad de actualizar sus asignaciones desde Configuración.
- Sesiones seguras con cookie `HttpOnly` y tokens resumidos en la base.
- 6 aulas de primaria y 5 de secundaria, con edad referencial.
- 9 áreas curriculares de primaria y 11 de secundaria.
- Páginas independientes para `/panel/aulas`, `/panel/areas-curriculares` y `/panel/experiencias`.
- Carga contextual desde un grado y curso guardados, sin repetir esa selección en cada sesión.
- Autorización en `/api/v1/sesiones` del par grado-curso contra las asignaciones del docente autenticado.
- Carga privada de PDF y DOCX de hasta 4 MB.
- Extracción local de texto en memoria: `unpdf` reconstruye las páginas del PDF con su versión preparada para entornos serverless y el DOCX se lee directamente desde su OOXML. El archivo original nunca se envía al proveedor de IA, no se publica y no se conserva.
- Selector de proveedor entre OpenAI y DeepSeek V4 Pro.
- Generación con OpenAI Responses API o DeepSeek Chat Completions, siempre validada con Zod.
- Modo demostración cuando el proveedor elegido no tiene una clave configurada.
- Experiencia adaptada por etapa educativa. La portada, cada paso y el reto final incluyen su propio mapa conceptual, línea de tiempo, secuencia, comparación o escena animada según el contenido; no se usan figuras espaciales como decoración genérica.
- Visualizaciones persistidas como datos JSON validados: la IA nunca entrega ni ejecuta HTML, CSS, JavaScript o archivos GIF.
- Biblioteca paginada de sesiones y experiencias para volver a abrir las animaciones creadas.
- Esquema SQL reversible, datos curriculares iniciales y tabla `asignaciones_docentes`.
- App Router y Route Handlers bajo `/api/v1`, compatibles con Vercel.

## Puesta en marcha

Requisitos: Node.js 20.9 o superior y un servidor compatible con MySQL.

```bash
npm install
copy .env.example .env.local
npm run db:init
npm run dev
```

Abre `http://localhost:3000` y crea una cuenta docente. El registro exige seleccionar al menos un grado y un curso de ese grado; las combinaciones quedan guardadas para que las próximas cargas comiencen directamente desde **Aulas** o **Áreas curriculares**.

La copia local ya tiene configurada la conexión solicitada en `.env.local`; ese archivo está ignorado por Git. No copies sus secretos a archivos versionados.

## Variables de entorno

| Variable            | Uso                                                |
| ------------------- | -------------------------------------------------- |
| `DB_HOST`           | Host de MySQL/MariaDB                              |
| `DB_PORT`           | Puerto de la base                                  |
| `DB_USER`           | Usuario de aplicación                              |
| `DB_PASSWORD`       | Contraseña, solo en el entorno                     |
| `DB_NAME`           | Base de datos; por defecto `educacion_interactiva` |
| `DB_SSL`            | `true` cuando el servidor tenga TLS habilitado     |
| `SESSION_SECRET`    | Valor aleatorio de al menos 24 caracteres          |
| `OPENAI_API_KEY`    | Activa el análisis real con IA                     |
| `OPENAI_MODEL`      | Modelo de análisis; por defecto `gpt-5.4-mini`     |
| `DEEPSEEK_API_KEY`  | Activa DeepSeek como proveedor                     |
| `DEEPSEEK_BASE_URL` | API compatible; `https://api.deepseek.com`         |
| `DEEPSEEK_MODEL`    | Modelo DeepSeek; por defecto `deepseek-v4-pro`     |

## Despliegue en Vercel

1. Sube el repositorio a GitHub, sin `.env.local`.
2. Importa el repositorio en Vercel como proyecto Next.js.
3. Registra todas las variables anteriores en **Settings → Environment Variables**.
4. No ejecutes migraciones durante el build. Ejecuta `npm run db:init` una vez desde un equipo autorizado.
5. Comprueba que la base acepte conexiones desde la red de Vercel.
6. Despliega; Vercel detectará App Router y los Route Handlers automáticamente.

La carga está limitada a 4 MB y el handler declara una duración máxima de 60 segundos. Para documentos más grandes o procesamiento asíncrono será necesario añadir almacenamiento privado y una cola en una versión posterior.

## Comandos de calidad

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run db:verify
npm run ia:verify:deepseek
npm run flujo:verify
```

`flujo:verify` requiere que el servidor de desarrollo esté activo en el puerto 3016. Para levantarlo con ese puerto:

```powershell
npm run dev -- --hostname 0.0.0.0 --port 3016
```

En otra consola, ejecuta el flujo real con DeepSeek (opción predeterminada):

```powershell
npm run flujo:verify
```

Para verificar la selección de OpenAI en modo demostración local, deja
`OPENAI_API_KEY` sin configurar y ejecuta:

```powershell
$env:MODELO_IA_PRUEBA = 'openai'
npm run flujo:verify
Remove-Item Env:MODELO_IA_PRUEBA
```

Si el sitio usa otra dirección, establece también `APP_URL`, por ejemplo
`$env:APP_URL = 'http://192.168.1.27:3016'`. El verificador crea un DOCX
temporal, comprueba las interfaces públicas, la protección y navegación de las
rutas privadas, autenticación, extracción, proveedor elegido, MySQL y
publicación. Los registros de prueba se eliminan al finalizar.

Para probar la extracción con un PDF o DOCX real en lugar del documento
temporal, define opcionalmente `ARCHIVO_PRUEBA` antes de ejecutar el flujo:

```powershell
$env:ARCHIVO_PRUEBA = 'C:\ruta\a\sesion-real.docx'
npm run flujo:verify
Remove-Item Env:ARCHIVO_PRUEBA
```

La ruta debe apuntar a un archivo `.pdf` o `.docx` legible de hasta 4 MB.
Para comprobar una clase concreta también pueden definirse juntos
`AULA_ID_PRUEBA` y `AREA_ID_PRUEBA`.

El verificador también exige una visualización válida en cada panel. Para una
sesión conocida pueden comprobarse raíces temáticas y descartarse motivos
ajenos al contenido:

```powershell
$env:RAICES_VISUALES_ESPERADAS_PRUEBA = 'estado,ciudadan,derech,responsab,instituci,particip'
$env:TERMINOS_VISUALES_PROHIBIDOS_PRUEBA = 'estrella,planeta,galaxia,orbita,cubo,esfera'
npm run flujo:verify
```

## Base remota actual

El host entregado reporta `MariaDB 10.11.14`, no MySQL, aunque usa el mismo protocolo y el esquema actual es compatible. Además, el servidor reporta TLS deshabilitado. Antes de un despliegue público se recomienda habilitar TLS, rotar la contraseña compartida y crear un usuario exclusivo con permisos solo sobre `educacion_interactiva`.

## Documentación

- [Arquitectura y decisiones](docs/arquitectura.md)
- [Áreas curriculares EBR](docs/curriculo-ebr.md)
- [Migración inicial](sql/001_inicial.sql)
- [Reversión completa](sql/001_revertir.sql)
- [Migración de asignaciones docentes](sql/002_asignaciones_docentes.sql)
- [Reversión de asignaciones docentes](sql/002_asignaciones_docentes_revertir.sql)

## Referencias oficiales

- [Currículo Nacional de la Educación Básica — MINEDU](https://www.minedu.gob.pe/curriculo/pdf/curriculo-nacional-de-la-educacion-basica.pdf)
- [Programa curricular de Educación Primaria — MINEDU](https://www.minedu.gob.pe/curriculo/pdf/programa-nivel-primaria-ebr.pdf)
- [Programa curricular de Educación Secundaria — MINEDU](https://www.minedu.gob.pe/curriculo/pdf/programa-nivel-secundaria-ebr.pdf)
- [Responses API — OpenAI](https://developers.openai.com/api/docs/guides/responses-vs-chat-completions)
- [Modelos de OpenAI](https://developers.openai.com/api/docs/models)
- [Modelos y precios de DeepSeek](https://api-docs.deepseek.com/quick_start/pricing/)
