import { useState } from 'react';
import {
  Activity,
  ArrowDown,
  DollarSign,
  Eye,
  Flower2,
  Heart,
  MessageCircle,
  Moon,
  Orbit,
  Shield,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react';

const services = [
  {
    number: '01',
    title: 'Tarot clarividente intuitivo',
    quote: 'Tu presente tiene respuestas. Yo tengo el canal.',
    description:
      'Conecto con tu energía y el tarot para leer lo que tu alma ya sabe. Sin rodeos, sin miedo. Dinero, salud, amor: vemos qué viene y qué puedes mover hoy para cambiar tu destino.',
    icon: Eye,
  },
  {
    number: '02',
    title: 'Lectura de energía vital',
    quote: 'Tu cuerpo habla. Yo lo traduzco.',
    description:
      'Decodificamos con numerología dónde se estancó tu energía y por qué. Desde saberes ancestrales, identificamos bloqueos y encontramos una herramienta para volver a tu centro.',
    icon: Sun,
  },
  {
    number: '03',
    title: 'Cuántica y memorias ancestrales',
    quote: 'Sana lo que no sabías que cargabas.',
    description:
      'Exploramos memorias, lealtades, miedos y patrones viejos que siguen resonando en tu presente. Un espacio para recuperar tu camino y honrar tu linaje.',
    icon: Orbit,
  },
  {
    number: '04',
    title: 'Recuperación del amor',
    quote: 'El amor no se ruega. Se realinea.',
    description:
      'Si hay distancia o la conexión se enfrió, trabajamos tu energía desde el amor propio. Sin amarres: abrimos caminos para dejar fluir lo que realmente es para ti.',
    icon: Heart,
  },
  {
    number: '05',
    title: 'Limpieza energética profunda',
    quote: 'Sacamos lo que no es tuyo.',
    description:
      'Para momentos de pesadez, puertas cerradas o cansancio. Limpiamos tu campo áurico, tu casa y tu energía para que vuelvas a sentir ligereza, protección y claridad.',
    icon: Sparkles,
  },
  {
    number: '06',
    title: 'Protección energética',
    quote: 'Tu energía vuelve a estar en tus manos.',
    description:
      'Identificamos interferencias, trabajamos su liberación y activamos una protección ancestral. Un acto de cierre y cuidado consciente para recuperar tu propio espacio.',
    icon: Shield,
  },
  {
    number: '07',
    title: 'Sanación desde el Yo Superior',
    quote: 'La cura ya vive en ti. Yo te guío hacia ella.',
    description:
      'Conecta con tu versión más alta. Desde ahí soltamos dolor, reprogramamos creencias y activamos tu poder creador. Tu camino vuelve a hablar con tu propia voz.',
    icon: Moon,
  },
];

const deckCards = [
  { title: 'La Visión', subtitle: 'Claridad', symbol: '✦', text: 'Escucha lo que tu presente ya está mostrando.' },
  { title: 'El Linaje', subtitle: 'Memoria', symbol: '☾', text: 'Reconoce las historias que ya puedes soltar.' },
  { title: 'El Corazón', subtitle: 'Amor', symbol: '♡', text: 'Vuelve a tu centro antes de abrir caminos.' },
  { title: 'La Energía', subtitle: 'Vitalidad', symbol: '☼', text: 'Dale espacio a lo que pide volver a fluir.' },
  { title: 'El Escudo', subtitle: 'Protección', symbol: '✧', text: 'Cierra ciclos y recupera tu propio espacio.' },
  { title: 'La Luz', subtitle: 'Limpieza', symbol: '⋆', text: 'Deja atrás el peso que no te pertenece.' },
  { title: 'El Oráculo', subtitle: 'Destino', symbol: '◈', text: 'Tu intuición conoce el siguiente paso.' },
];

const whatsappUrl =
  'https://wa.me/573148668237?text=Hola%2C%20quisiera%20recibir%20informaci%C3%B3n%20sobre%20las%20lecturas%20de%20Destino.';

function ConstellationField() {
  return (
    <div className="constellation-field" aria-hidden="true">
      <svg className="constellation constellation-one" viewBox="0 0 360 230">
        <path d="M24 180 78 112l62 28 54-88 58 65 84-72" />
        {[[24, 180], [78, 112], [140, 140], [194, 52], [252, 117], [336, 45]].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" />
        ))}
      </svg>
      <svg className="constellation constellation-two" viewBox="0 0 280 210">
        <path d="M20 42 78 81l54-38 37 74 82 62" />
        {[[20, 42], [78, 81], [132, 43], [169, 117], [251, 179]].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" />
        ))}
      </svg>
      <span className="shooting-star shooting-star-one" />
      <span className="shooting-star shooting-star-two" />
      <span className="shooting-star shooting-star-three" />
    </div>
  );
}

export default function Landing() {
  const [flippedCards, setFlippedCards] = useState<number[]>([]);

  const toggleDeckCard = (index: number) => {
    setFlippedCards((current) =>
      current.includes(index) ? current.filter((cardIndex) => cardIndex !== index) : [...current, index],
    );
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#080718] text-[#f8f2e4]">
      <header className="destino-navbar fixed inset-x-0 top-0 z-50 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#inicio" className="flex items-center gap-3">
            <span className="logo-mark grid h-10 w-10 place-items-center rounded-full">
              <Moon size={20} />
            </span>
            <span>
              <strong className="block font-display text-3xl font-normal leading-none text-[#f4d47e]">Destino</strong>
              <small className="block text-[8px] font-bold uppercase tracking-[0.3em] text-[#7fe8f2]">Oráculo espiritual</small>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-xs font-bold uppercase tracking-[0.2em] text-[#d8e9ff]/75 md:flex">
            <a className="nav-link" href="#inicio">Inicio</a>
            <a className="nav-link" href="#oraculo">El oráculo</a>
            <a className="nav-link" href="#servicios">Lecturas</a>
            <a className="nav-link" href="#baraja">La baraja</a>
          </nav>
          <a className="whatsapp-button px-4 py-2 text-[10px] sm:px-5 sm:text-xs" href={whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={15} />
            Contactar
          </a>
        </div>
      </header>

      <section id="inicio" className="mystic-hero relative isolate flex min-h-screen items-center overflow-hidden px-5 pb-16 pt-28 sm:px-8">
        <ConstellationField />
        <div className="orb orb-purple left-[-7rem] top-[14%]" />
        <div className="orb orb-gold bottom-[4%] right-[-8rem]" />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">
          <p className="hero-kicker">Yo soy el</p>
          <h1 className="hero-brand">Oráculo del Destino</h1>
          <div className="ornament-line"><span>✦</span></div>
          <p className="hero-subtitle"><Star size={16} fill="currentColor" /> Tarot clarividente intuitivo <Star size={16} fill="currentColor" /></p>

          <div className="hero-stage">
            <div className="sacred-circle sacred-circle-hero" aria-hidden="true"><span>✧</span></div>
            <div className="tarot-card hero-card hero-card-back-left"><span>✦</span></div>
            <div className="tarot-card hero-card hero-card-back-right"><span>☾</span></div>
            <div className="tarot-card hero-card hero-card-main">
              <div className="card-frame">
                <span className="text-2xl text-[#f0c96f]">✦</span>
                <div className="card-orbit">
                  <Sun size={68} strokeWidth={1} />
                  <span className="orbit-star orbit-star-one">✧</span>
                  <span className="orbit-star orbit-star-two">⋆</span>
                </div>
                <div className="text-center">
                  <p className="font-serif-display text-4xl text-[#f2d78b]">El Sol</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.45em] text-[#d5ad5b]">Claridad y destino</p>
                </div>
                <span className="rotate-180 text-2xl text-[#f0c96f]">✦</span>
              </div>
            </div>
          </div>

          <div className="hero-quote">
            <Sparkles size={22} />
            <p>“Tu presente tiene respuestas. Yo tengo el canal.”</p>
          </div>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-[#eee4f5]/80">
            Conecto con tu energía y el tarot para leer lo que tu alma ya sabe. Sin rodeos, sin miedo.
            Dinero, salud, amor: vemos qué viene y qué puedes mover hoy para cambiar tu destino.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a className="whatsapp-button" href={whatsappUrl} target="_blank" rel="noreferrer">Escribir por WhatsApp <MessageCircle size={16} /></a>
              <a className="ghost-button" href="#oraculo">Conocer el oráculo <ArrowDown size={16} /></a>
          </div>
        </div>
      </section>

      <section id="oraculo" className="oraculo-section relative border-y border-white/10 px-5 py-24 sm:px-8">
        <div className="section-star-field" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow"><Moon size={14} /> Oráculo del destino</p>
            <h2 className="section-title">Donde tu energía se escucha.</h2>
          </div>
          <div className="border-l border-[#78b7ef]/30 pl-6 sm:pl-9">
            <p className="text-xl leading-9 text-[#dcecff]/85 sm:text-2xl">
              Tu camino se aclara y tu poder se recupera. Cada lectura es un espacio para mirar tu presente,
              reconocer lo que pesa y volver a elegir desde tu propia intuición.
            </p>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-[#e3bd67]">
              Energía · Claridad · Transformación
            </p>
          </div>
        </div>
      </section>

      <section id="servicios" className="services-section relative px-5 py-24 text-[#172043] sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow justify-center"><Sparkles size={14} /> Lecturas y orientación</p>
            <h2 className="editorial-title mt-5">Lectura de energía vital</h2>
            <p className="mt-3 text-sm font-bold uppercase tracking-[0.28em] text-[#e9c473]">Decodificando con numerología</p>
            <p className="mt-6 text-lg leading-8 text-[#e6ddeb]/75">
              Cada proceso abre una puerta distinta. Elige la que hoy resuena con tu energía.
            </p>
          </div>
          <div className="energy-showcase">
            <div className="energy-body sacred-circle">
              <Activity size={86} strokeWidth={0.8} />
              <span className="energy-point energy-point-one" />
              <span className="energy-point energy-point-two" />
              <span className="energy-point energy-point-three" />
              <span className="energy-point energy-point-four" />
              <span className="energy-point energy-point-five" />
            </div>
            <div className="energy-message">
              <div className="numerology-orbit"><span>3</span><span>7</span><span>9</span><strong>✦</strong><span>5</span><span>1</span></div>
              <p className="font-serif-display text-3xl leading-tight text-[#f5ebef]">“Tu cuerpo habla.<br />Yo lo traduzco.”</p>
            </div>
          </div>
          <div className="energy-pillars">
            <div><DollarSign /><span>Dinero</span></div>
            <div><Heart /><span>Amor</span></div>
            <div><Flower2 /><span>Salud</span></div>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <article key={service.number} className={`service-card ${index === services.length - 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black tracking-[0.22em] text-[#c28d29]">{service.number}</span>
                    <span className="service-icon grid h-11 w-11 place-items-center rounded-full">
                      <Icon size={20} strokeWidth={1.7} />
                    </span>
                  </div>
                  <h3 className="mt-7 text-2xl font-black leading-tight">{service.title}</h3>
                  <p className="mt-3 font-display text-2xl leading-tight text-[#a16d13]">{service.quote}</p>
                  <p className="mt-5 leading-7 text-[#66718d]">{service.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="baraja" className="deck-section relative overflow-hidden px-5 py-28 sm:px-8">
        <ConstellationField />
        <div className="relative z-10 mx-auto max-w-7xl text-center">
          <p className="eyebrow justify-center"><Star size={14} fill="currentColor" /> La baraja del oráculo</p>
          <h2 className="section-title mx-auto max-w-3xl">Siete cartas. Siete caminos hacia ti.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#c7dcf5]/75">
            Toca una carta para voltearla y descubrir la energía que representa. La respuesta empieza por aquello que más te llama.
          </p>
          <div className="deck-grid mt-14">
            {deckCards.map((card, index) => (
              <button
                type="button"
                className={`deck-card ${flippedCards.includes(index) ? 'is-flipped' : ''}`}
                key={card.title}
                onClick={() => toggleDeckCard(index)}
                aria-pressed={flippedCards.includes(index)}
                aria-label={`${flippedCards.includes(index) ? 'Ocultar' : 'Descubrir'} carta ${card.title}`}
                style={{
                  '--card-offset': `${Math.abs(index - 3) * 0.8}rem`,
                  '--card-rotate': `${(index - 3) * 3}deg`,
                } as React.CSSProperties}
              >
                <div className="deck-card-flipper">
                  <div className="deck-card-face deck-card-front">
                    <div className="deck-corner">✦</div>
                    <span className="deck-symbol">{card.symbol}</span>
                    <p className="deck-number">0{index + 1}</p>
                    <div className="deck-corner rotate-180">✦</div>
                  </div>
                  <div className="deck-card-face deck-card-back">
                    <div className="deck-corner">✦</div>
                    <div>
                      <h3 className="font-serif-display text-2xl text-[#f2d78b]">{card.title}</h3>
                      <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.4em] text-[#cba75a]">{card.subtitle}</p>
                      <p className="deck-message">{card.text}</p>
                    </div>
                    <div className="deck-corner rotate-180">✦</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-section relative overflow-hidden px-5 py-24 text-center sm:px-8">
        <div className="orb orb-blue left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative mx-auto max-w-3xl">
          <Sparkles className="mx-auto text-[#f0c96f]" size={30} />
          <h2 className="mt-5 text-4xl font-black sm:text-6xl">Tu poder siempre estuvo en ti.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#d4e5fa]/80">
            Sana desde tu Yo Superior. Conecta con esa versión tuya que ya resolvió, soltó y eligió volver a su luz.
          </p>
          <a className="whatsapp-button mt-9" href={whatsappUrl} target="_blank" rel="noreferrer">
            Consultar por WhatsApp <MessageCircle size={16} />
          </a>
        </div>
      </section>

      <footer className="destino-footer px-5 py-10 text-center sm:px-8">
        <p className="font-display text-4xl text-[#edcb76]">Destino</p>
        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.32em] text-[#70dce9]/80">Oráculo espiritual</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#bdeff5]/70">
          Tu energía se escucha · Tu camino se aclara
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-xs leading-5 text-[#b7c6da]/50">
          Los servicios ofrecidos son prácticas de orientación espiritual y bienestar personal. No sustituyen
          diagnósticos, tratamientos médicos, psicológicos, legales o financieros profesionales.
        </p>
      </footer>
      <a
        className="whatsapp-float"
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar a Destino por WhatsApp"
        title="Contactar por WhatsApp"
      >
        <MessageCircle size={22} />
      </a>
    </main>
  );
}
