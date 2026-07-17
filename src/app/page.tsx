import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  FileText,
  GraduationCap,
  Play,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { Marca } from '@/componentes/marca'

const areas = [
  'Personal Social',
  'Ciencias Sociales',
  'Matemática',
  'Comunicación',
  'Ciencia y Tecnología',
  'Arte y Cultura',
  'Educación Física',
  'Ciudadanía y Cívica',
  'Inglés',
]

export default function Inicio() {
  return (
    <main className="pagina-inicio">
      <nav className="navegacion-inicio">
        <Marca />
        <div className="enlaces-inicio">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#niveles">Para cada aula</a>
          <a href="#areas">Áreas</a>
        </div>
        <div className="acciones-inicio">
          <Link className="enlace-ingreso" href="/ingresar">
            Iniciar sesión
          </Link>
          <Link className="boton boton-primario boton-pequeno" href="/registro">
            Crear cuenta <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      <section className="hero-inicio">
        <div className="mancha mancha-uno" />
        <div className="mancha mancha-dos" />
        <div className="contenido-hero-inicio">
          <span className="insignia-hero">
            <Sparkles size={15} /> IA pensada para el aula peruana
          </span>
          <h1>
            Tu sesión de hoy,
            <br />
            <em>viva frente a sus ojos.</em>
          </h1>
          <p>
            Sube tu planificación. Aula Viva la comprende y crea una experiencia
            web animada, interactiva y adaptada a la edad de tus estudiantes.
          </p>
          <div className="botones-hero">
            <Link
              className="boton boton-primario boton-grande"
              href="/registro"
            >
              Transformar mi primera sesión <WandSparkles size={19} />
            </Link>
            <a
              className="boton boton-transparente boton-grande"
              href="#como-funciona"
            >
              <Play size={17} fill="currentColor" /> Ver cómo funciona
            </a>
          </div>
          <div className="confianza-hero">
            <span>
              <ShieldCheck size={17} /> Tus documentos son privados
            </span>
            <span>
              <GraduationCap size={17} /> Primaria y secundaria
            </span>
          </div>
        </div>

        <div className="universo-hero" aria-hidden="true">
          <div className="tarjeta-documento-hero">
            <span className="icono-pdf">
              <FileText size={24} />
            </span>
            <span>
              <strong>Sesión de aprendizaje</strong>
              <small>cuidado_del_cuerpo.pdf</small>
              <i>
                <b />
              </i>
            </span>
          </div>
          <div className="nucleo-ia">
            <BrainCircuit size={33} />
            <span />
            <span />
          </div>
          <div className="ventana-clase-hero">
            <div className="barra-ventana">
              <i />
              <i />
              <i />
              <span>aulaviva.pe/experiencia</span>
            </div>
            <div className="escena-higiene">
              <span className="burbuja b1" />
              <span className="burbuja b2" />
              <span className="burbuja b3" />
              <div className="ducha">
                <i />
                <b>•••</b>
              </div>
              <div className="nino">
                <i />
                <b />
                <span />
              </div>
              <div className="jabon">JABÓN</div>
              <p>
                <small>MI CUERPO, MI HOGAR</small>
                <strong>
                  Cuidarme
                  <br />
                  también es quererme.
                </strong>
              </p>
            </div>
          </div>
          <div className="pildora-flotante pildora-edad">
            <span>6–7</span> años
          </div>
          <div className="pildora-flotante pildora-area">Personal Social</div>
          <span className="estrella-hero e1">✦</span>
          <span className="estrella-hero e2">✦</span>
          <span className="estrella-hero e3">✦</span>
        </div>
      </section>

      <section id="como-funciona" className="seccion-como">
        <div className="encabezado-centrado">
          <span className="sobrelinea">Simple para ti, mágico para ellos</span>
          <h2>
            De un documento a una aventura
            <br />
            en tres movimientos.
          </h2>
        </div>
        <div className="pasos-inicio">
          <article>
            <span className="numero-inicio">01</span>
            <i>
              <FileText size={26} />
            </i>
            <h3>Sube tu sesión</h3>
            <p>
              PDF o Word (.docx). Selecciona el grado y el área curricular del
              día.
            </p>
          </article>
          <span className="flecha-pasos">→</span>
          <article>
            <span className="numero-inicio">02</span>
            <i>
              <BrainCircuit size={26} />
            </i>
            <h3>La IA la comprende</h3>
            <p>
              Identifica propósito, tema, conceptos clave y nivel de
              complejidad.
            </p>
          </article>
          <span className="flecha-pasos">→</span>
          <article>
            <span className="numero-inicio">03</span>
            <i>
              <WandSparkles size={26} />
            </i>
            <h3>La clase cobra vida</h3>
            <p>
              Recibe una experiencia con historia, animación 3D, pasos y retos.
            </p>
          </article>
        </div>
      </section>

      <section id="niveles" className="seccion-niveles">
        <div className="texto-niveles">
          <span className="sobrelinea">
            La edad cambia la manera de aprender
          </span>
          <h2>Una experiencia distinta para cada etapa.</h2>
          <p>
            No basta con simplificar palabras. Cambiamos la narrativa, el ritmo,
            los personajes, el tipo de interacción y la profundidad de cada
            pregunta.
          </p>
          <Link className="boton boton-secundario" href="/registro">
            Explorar mis aulas <ArrowRight size={17} />
          </Link>
        </div>
        <div className="comparacion-niveles">
          <article className="nivel-primaria">
            <span>PRIMARIA · 6 A 12 AÑOS</span>
            <div className="ilustracion-nivel">
              🌱<i>⭐</i>
              <b>🫧</b>
            </div>
            <h3>Descubrir jugando</h3>
            <p>
              Personajes, misiones breves, colores vivos y acciones concretas.
            </p>
            <ul>
              <li>Historias guiadas</li>
              <li>Exploración visual</li>
              <li>Retroalimentación inmediata</li>
            </ul>
          </article>
          <article className="nivel-secundaria">
            <span>SECUNDARIA · 12 A 17 AÑOS</span>
            <div className="ilustracion-nivel">
              🌐<i>◈</i>
              <b>✦</b>
            </div>
            <h3>Pensar tomando posición</h3>
            <p>Casos, evidencias, perspectivas y decisiones con argumento.</p>
            <ul>
              <li>Escenarios reales</li>
              <li>Pensamiento crítico</li>
              <li>Retos de aplicación</li>
            </ul>
          </article>
        </div>
      </section>

      <section id="areas" className="seccion-areas">
        <div className="encabezado-centrado">
          <span className="sobrelinea">Todo el currículo, más cerca</span>
          <h2>
            Cada área puede convertirse
            <br />
            en una experiencia.
          </h2>
        </div>
        <div className="cinta-areas">
          {areas.map((area, indice) => (
            <span key={area}>
              {['🌎', '🏛️', '➗', '💬', '🔬', '🎨', '🏃', '🤝', '🔤'][indice]}{' '}
              {area}
            </span>
          ))}
        </div>
        <p className="nota-curriculo">
          <BookOpen size={18} /> Basado en las áreas curriculares de Educación
          Básica Regular del Ministerio de Educación del Perú.
        </p>
      </section>

      <section className="cta-final">
        <span className="estrella-cta">✦</span>
        <span className="estrella-cta dos">✦</span>
        <div>
          <span className="insignia-ia">
            <Sparkles size={14} /> Tu próxima clase empieza aquí
          </span>
          <h2>
            Lo que enseñas importa.
            <br />
            La forma de vivirlo también.
          </h2>
          <p>
            Crea tu espacio docente y transforma una sesión en pocos minutos.
          </p>
          <Link className="boton boton-claro boton-grande" href="/registro">
            Crear mi espacio docente <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="pie-inicio">
        <Marca />
        <p>Experiencias que despiertan curiosidad en las aulas del Perú.</p>
        <span>Primera versión · 2026</span>
      </footer>
    </main>
  )
}
