# Arquitectura de Aula Viva

## Decisión central

La IA no escribe ni ejecuta HTML, JavaScript o componentes arbitrarios. Devuelve un objeto estructurado y validado que contiene título, objetivo, narrativa, tema visual, colores, pasos, evaluación y una visualización pedagógica para cada panel. Un conjunto estable de componentes React renderiza ese contenido.

Esta decisión permite:

- evitar ejecución de código generado por terceros;
- mantener una identidad visual consistente;
- adaptar el contenido sin desplegar código nuevo;
- almacenar, revisar y volver a abrir cada experiencia;
- funcionar en el entorno serverless de Vercel.

## Flujo

1. Durante el registro, el docente selecciona uno o varios grados y al menos un curso por grado. La Server Action valida que cada curso pertenezca al nivel del grado y guarda los pares en `asignaciones_docentes` dentro de la misma transacción que crea al usuario.
2. En ingresos posteriores, el docente se autentica mediante una Server Action y conserva sus asignaciones; puede reemplazarlas desde Configuración.
3. Las áreas principales tienen páginas independientes: `/panel/aulas`, `/panel/areas-curriculares` y `/panel/experiencias`.
4. Desde Aulas o Áreas curriculares, el docente abre un par grado-curso ya guardado. La ruta contextual `/panel/aulas/[id]/areas/[areaId]` entrega esos identificadores al cargador, sin volver a preguntarlos en el formulario.
5. El Route Handler `/api/v1/sesiones` recibe un PDF o DOCX de hasta 4 MB y comprueba que el par `aulaId`/`areaId` pertenezca al docente autenticado. Un par ajeno o no configurado se rechaza antes de procesar el documento.
6. El cliente valida formato/tamaño y muestra el documento elegido; `extraerTextoDocumento` repite la validación y extrae texto en memoria. Los PDF se procesan con el paquete serverless `unpdf`, conservando páginas y saltos semánticos. Los DOCX se descomprimen en memoria y se lee exclusivamente el texto visible de `word/document.xml`.
7. Se crea un registro en `sesiones_aprendizaje` con estado `ANALIZANDO`.
8. Antes de llamar al proveedor se detectan localmente título, propósito, evidencia e ideas centrales. El prompt prioriza esas anclas sobre encabezados genéricos, capacidades desalineadas o actividades aisladas. Solo se envía texto normalizado y se omiten datos personales básicos; nunca se envían los bytes del archivo.
9. `analizarSesionConIa` usa el proveedor elegido: Responses API para OpenAI o Chat Completions compatible para DeepSeek V4 Pro.
10. Zod valida la estructura devuelta con un contrato estricto para generaciones nuevas: portada, cada paso y cierre deben incluir una visualización. Si DeepSeek no respeta el contrato, el reintento recibe las rutas exactas que debe corregir. Sin clave o si el proveedor no se recupera, se utiliza un generador local que también respeta el título y propósito detectados para no interrumpir la clase. Un segundo contrato de lectura acepta JSON anteriores sin esos campos y los completa de forma determinista con contenido de sus propios pasos.
11. Una transacción cambia la sesión a `LISTA` y crea `experiencias`. `contenido_json` conserva la narrativa, pasos, evaluación y configuración visual/de animaciones, junto con el modelo y modo de generación.
12. `/panel/experiencias` consulta el historial persistido por docente, ordenado por fecha y paginado, para volver a abrir cada experiencia y sus animaciones.
13. El layout de `(privado)` exige una sesión antes de renderizar el panel o las experiencias; `/experiencias/[id]` también valida la pertenencia al docente.

## Módulos

- `src/app`: páginas App Router, acciones y API v1.
- `src/componentes`: interfaz docente y experiencia estudiantil.
- `src/lib/autenticacion.ts`: cookies, tokens y sesión del usuario.
- `src/lib/base-datos.ts`: pool pequeño para el entorno serverless.
- `src/lib/asignaciones-docentes.ts`: validación, consulta y reemplazo transaccional de los pares grado-curso del docente.
- `src/lib/extraer-documento.ts`: extracción local y normalización de PDF/DOCX en memoria.
- `src/lib/contexto-pedagogico.ts`: detección local de título, propósito, evidencia e ideas centrales antes de invocar la IA.
- `src/lib/inteligencia-artificial.ts`: proveedores OpenAI/DeepSeek, esquema, prompt y modo demostración.
- `src/lib/visualizaciones-pedagogicas.ts`: normalización y visualizaciones contextuales de respaldo para experiencias históricas.
- `src/componentes/visualizacion-pedagogica.tsx`: renderizado accesible de mapas conceptuales, líneas de tiempo, secuencias, comparaciones y escenas animadas.
- `src/lib/sesiones-aprendizaje.ts`: persistencia transaccional, métricas, biblioteca paginada y recuperación de experiencias.
- `sql`: migraciones numeradas y sus reversiones.

## Datos y migraciones

- `001_inicial.sql` crea usuarios, accesos, catálogo curricular, sesiones y experiencias. `experiencias.contenido_json` es la fuente persistente de la experiencia y de su configuración visual/de animaciones; el archivo docente original no se conserva.
- `002_asignaciones_docentes.sql` crea `asignaciones_docentes`, cuya clave primaria compuesta es `(usuario_id, aula_id, area_curricular_id)`. También agrega el índice de historial por docente y fecha y migra, sin duplicar, los pares presentes en sesiones anteriores.
- `002_asignaciones_docentes_revertir.sql` revierte la migración 002: elimina el índice agregado y la tabla de asignaciones. Las sesiones y experiencias de la migración inicial permanecen intactas, aunque se pierde la configuración docente que estuviera en esa tabla.
- `npm run db:init` aplica las migraciones directas en orden numérico. Las reversiones se conservan como scripts explícitos y no se ejecutan automáticamente.

## Seguridad y privacidad

- Las contraseñas se resumen con bcrypt, factor 12.
- Los tokens de acceso son aleatorios; solo se guarda su resumen SHA-256 con secreto.
- La cookie es `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- Un layout de servidor protege todas las rutas agrupadas bajo `(privado)` antes de sus estados de carga.
- Cada consulta de experiencia exige que pertenezca al docente autenticado.
- La API de carga autoriza también el par grado-curso contra `asignaciones_docentes`; no confía únicamente en los identificadores enviados por el cliente.
- Los identificadores SQL se mantienen fijos y los valores usan parámetros.
- El archivo se procesa en memoria, no se guarda en `public` ni en el sistema efímero.
- No se renderiza HTML producido por la IA.
- El origen de cargas se contrasta con el host de la solicitud.

## Límites de esta primera versión

- PDF escaneado sin capa de texto no tiene OCR.
- Word antiguo `.doc` no está soportado; se acepta `.docx`.
- La generación se realiza dentro de la solicitud. Para carga intensiva se necesitará una cola.
- Las animaciones son DOM/CSS controlado por la aplicación y respetan `prefers-reduced-motion`. La IA solo aporta datos temáticos validados; no entrega código, coordenadas ni archivos ejecutables.
- No hay cuentas de estudiantes: el docente presenta la experiencia desde su sesión.

## Próximas extensiones razonables

- Modo presentación a pantalla completa y enlace temporal para el aula.
- OCR para sesiones escaneadas.
- Edición docente previa a publicar.
- Biblioteca de recursos pedagógicos ilustrados por competencias y contexto peruano.
- Almacenamiento privado detrás de un puerto de almacenamiento.
- Métricas agregadas de participación sin perfilar menores.
