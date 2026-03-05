import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'

export default function Home() {
  const heroRef = useRef<HTMLElement>(null)
  const [driftX, setDriftX] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })
  
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  useEffect(() => {
    let animationId: number
    let startTime = Date.now()
    const driftSpeed = 0.0006
    const maxDrift = 2
    
    const animateDrift = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const newDrift = Math.sin(elapsed * driftSpeed * Math.PI * 2) * maxDrift
      setDriftX(newDrift)
      animationId = requestAnimationFrame(animateDrift)
    }
    
    animateDrift()
    return () => cancelAnimationFrame(animationId)
  }, [])

  const easeOutQuint = [0.22, 1, 0.36, 1]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050510' }}>
      {/* ═══════════════════════════════════════════════════════════════
          HERO — Elegance Refined Edition
          Foco mobile-first com drama cinematográfico
          ═══════════════════════════════════════════════════════════════ */}
      <section 
        ref={heroRef}
        className="relative min-h-[100dvh] overflow-hidden"
        style={{ color: '#E6E0D6' }}
      >
        {/* ─────────────────────────────────────────────────────────────
            LAYER 1: Imagem de fundo com parallax
            ───────────────────────────────────────────────────────────── */}
        <motion.div 
          className="absolute inset-0 will-change-transform"
          style={{
            backgroundImage: 'url("/download.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundAttachment: isMobile ? 'scroll' : 'fixed',
            backgroundRepeat: 'no-repeat',
            y: parallaxY,
            x: driftX,
            scale: 1.08,
          }}
        />

        {/* ─────────────────────────────────────────────────────────────
            LAYER 2: Overlays cinematográficos
            ───────────────────────────────────────────────────────────── */}
        {/* Vignette elegante */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(
                ellipse 85% 70% at 50% 35%,
                rgba(15, 5, 25, 0.2) 0%,
                rgba(20, 8, 35, 0.5) 50%,
                rgba(10, 5, 20, 0.85) 100%
              )
            `,
          }}
        />
        
        {/* Gradient vertical dramático */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(5, 5, 15, 0.6) 0%, rgba(5, 5, 15, 0.15) 40%, rgba(5, 5, 15, 0.98) 100%)',
          }}
        />

        {/* Halo roxo neon central */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.03) 40%, transparent 70%)',
          }}
        />

        {/* ─────────────────────────────────────────────────────────────
            LAYER 3: CONTEÚDO PRINCIPAL
            ───────────────────────────────────────────────────────────── */}
        <motion.div 
          className="relative z-10 flex flex-col justify-center items-center px-6 min-h-[100dvh]"
          style={{ opacity: contentOpacity }}
        >
          {/* Container com espaçamento refinado */}
          <div className="flex flex-col items-center text-center max-w-lg mx-auto pt-16 pb-24">
          
            {/* Logo com glow pulsante */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.1, ease: easeOutQuint }}
              className="mb-10"
            >
              <motion.img 
                src="/LOGO SEM FUNDO.png" 
                alt="Kevin Hussein Tattoo" 
                className="w-36 sm:w-44 md:w-52 h-auto mx-auto"
                style={{
                  filter: 'drop-shadow(0 0 35px rgba(168, 85, 247, 0.3))',
                }}
                animate={{ 
                  filter: [
                    'drop-shadow(0 0 35px rgba(168, 85, 247, 0.3))',
                    'drop-shadow(0 0 55px rgba(139, 92, 246, 0.45))',
                    'drop-shadow(0 0 35px rgba(168, 85, 247, 0.3))',
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Título principal — estilo charutaria elegante */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: easeOutQuint }}
              className="mb-6"
              style={{ 
                fontFamily: '"Cinzel", Georgia, serif',
                fontSize: 'clamp(2.2rem, 9vw, 3.8rem)',
                lineHeight: 1.05,
                letterSpacing: '0.04em',
                fontWeight: 600,
                color: '#FFFFFF',
                textShadow: '0 4px 60px rgba(0, 0, 0, 0.7)',
                textTransform: 'uppercase',
              }}
            >
              <span>Arte que</span>
              <br />
              <span style={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #A855F7 0%, #C084FC 50%, #E879F9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 25px rgba(168, 85, 247, 0.4))',
              }}>conta histórias</span>
            </motion.h1>
            
            {/* Subtítulo — limpo e direto */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55, ease: easeOutQuint }}
              className="font-sans max-w-xs mx-auto mb-10"
              style={{ 
                fontSize: 'clamp(0.9rem, 2.2vw, 1rem)',
                lineHeight: 1.7,
                fontWeight: 400,
                letterSpacing: '0.01em',
                color: 'rgba(255, 255, 255, 0.75)',
              }}
            >
              Cada traço carrega intenção e significado.
              <br />
              <span style={{ color: 'rgba(192, 132, 252, 0.9)' }}>Arte permanente, memórias eternas.</span>
            </motion.p>

            {/* CTA Button — DESTAQUE PRINCIPAL */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7, ease: easeOutQuint }}
              className="relative"
            >
              {/* Glow por trás do botão */}
              <motion.div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ 
                  background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
                  transform: 'scale(1.5)',
                }}
                animate={{
                  opacity: [0.5, 0.9, 0.5],
                  scale: [1.4, 1.7, 1.4],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              <Link to="/agendar">
                <motion.button
                  className="group relative px-10 py-4 rounded-full overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)',
                    backgroundSize: '200% 200%',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 30px rgba(139, 92, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 8px 50px rgba(168, 85, 247, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{ 
                    backgroundPosition: { duration: 4, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 0.25, ease: 'easeOut' },
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <span>Agendar Agora</span>
                    <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                  </span>
                </motion.button>
              </Link>
            </motion.div>

            {/* Localização — toque de contexto */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-12 flex items-center gap-2"
              style={{ color: 'rgba(192, 132, 252, 0.5)' }}
            >
              <MapPin size={12} strokeWidth={1.5} />
              <span style={{ 
                fontSize: '0.7rem', 
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 300,
              }}>Curitiba, PR</span>
            </motion.div>
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────────────────────
            SCROLL INDICATOR — Refinado
            ───────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            className="w-5 h-9 rounded-full border flex items-start justify-center pt-2"
            style={{ borderColor: 'rgba(168, 85, 247, 0.25)' }}
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="w-0.5 h-2 rounded-full"
              style={{ backgroundColor: 'rgba(168, 85, 247, 0.6)' }}
              animate={{ 
                y: [0, 6, 0],
                opacity: [0.4, 0.9, 0.4],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SOBRE — Seção refinada e elegante
          ═══════════════════════════════════════════════════════════════ */}
      <section 
        id="sobre" 
        className="py-24 sm:py-32 lg:py-40 px-6 sm:px-8 relative overflow-hidden"
        style={{ backgroundColor: '#050510' }}
      >
        {/* Background gradiente roxo neon */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 60%)',
          }}
        />
        
        {/* Linha decorativa superior neon */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 z-10">
          <div 
            className="w-full h-full"
            style={{ 
              background: 'linear-gradient(to bottom, transparent, rgba(168, 85, 247, 0.3), transparent)' 
            }}
          />
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Foto do Artista */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="order-2 lg:order-1"
            >
              <div 
                className="aspect-[3/4] rounded-3xl overflow-hidden relative mx-auto max-w-md lg:max-w-none"
                style={{
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 100px rgba(139, 92, 246, 0.15)',
                }}
              >
                {/* Foto real do artista */}
                <img 
                  src="/artista.png" 
                  alt="Kevin Hussein - Tatuador"
                  className="w-full h-full object-cover object-top"
                  style={{
                    filter: 'contrast(1.02) brightness(0.98)',
                  }}
                />
                
                {/* Overlay gradiente neon decorativo */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, rgba(5, 5, 16, 0.6) 0%, transparent 50%), linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
                  }}
                />
              </div>
            </motion.div>

            {/* Conteúdo textual */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="order-1 lg:order-2 text-center lg:text-left"
            >
              {/* Label superior */}
              <motion.span 
                className="inline-block text-xs tracking-widest uppercase mb-8"
                style={{ color: 'rgba(168, 85, 247, 0.8)', fontWeight: 500, letterSpacing: '0.2em' }}
              >
                Sobre o artista
              </motion.span>
              
              {/* Nome */}
              <h2 
                className="text-4xl sm:text-5xl mb-8"
                style={{ 
                  fontFamily: '"Cinzel", Georgia, serif',
                  color: '#FFFFFF',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Kevin Hussein
              </h2>
              
              {/* Descrição */}
              <div className="space-y-6">
                <p 
                  className="text-xl leading-relaxed"
                  style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}
                >
                  Muito além da técnica: cada projeto carrega um propósito.
                </p>
                <p 
                  className="text-base sm:text-lg leading-relaxed"
                  style={{ color: 'rgba(255, 255, 255, 0.65)' }}
                >
                  Com foco em excelência e originalidade, Kevin Hussein transforma ideias 
                  em tatuagens que comunicam estilo, personalidade e significado. 
                  Cada traço é pensado para durar, tanto na pele quanto na memória.
                </p>
              </div>

              {/* Localização */}
              <div 
                className="mt-10 pt-8 flex items-center gap-4 justify-center lg:justify-start"
                style={{ borderTop: '1px solid rgba(168, 85, 247, 0.15)' }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                  }}
                >
                  <MapPin size={16} style={{ color: 'rgba(192, 132, 252, 0.9)' }} />
                </div>
                <div>
                  <p 
                    className="text-base font-medium"
                    style={{ color: 'rgba(248, 244, 255, 0.85)' }}
                  >
                    Curitiba, PR
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: 'rgba(168, 85, 247, 0.6)' }}
                  >
                    Atendimentos com horário marcado
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
