import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Instagram, MessageCircle } from 'lucide-react'

const socialItems = [
  { href: 'https://instagram.com/kevinhusseintattoo', icon: Instagram, label: 'Instagram' },
  { href: 'https://wa.me/5541996481275', icon: MessageCircle, label: 'WhatsApp' },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          MOBILE HEADER — Ultra Minimal Premium
          Layout: [ LOGO ] ─────────────────────────── [ Agendar ]
          Clean & Elegant - Menos é mais
          ═══════════════════════════════════════════════════════════════ */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Gradient fade para integrar com o conteúdo */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(5, 5, 9, 0.85) 0%, rgba(5, 5, 9, 0.4) 70%, transparent 100%)',
            height: '120%',
          }}
        />
        
        <div className="relative flex items-center justify-between px-5 py-4">
          {/* Logo — Estilo charutaria */}
          <Link to="/" className="flex items-center gap-2">
            <motion.img 
              src="/LOGO SEM FUNDO.png" 
              alt="Kevin Hussein" 
              className="w-8 h-8 object-contain"
              whileTap={{ scale: 0.95 }}
              style={{ 
                filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.35))' 
              }}
            />
            <span 
              className="text-sm tracking-wider uppercase"
              style={{ 
                fontFamily: '"Cinzel", Georgia, serif',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)',
                letterSpacing: '0.12em',
              }}
            >
              Kevin Hussein
            </span>
          </Link>

          {/* CTA Button — Neon pill */}
          <Link to="/meus-agendamentos">
            <motion.button
              className="relative px-4 py-1.5 text-[10px] font-medium tracking-wider uppercase rounded-full overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.85) 0%, rgba(168, 85, 247, 0.85) 100%)',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(192, 132, 252, 0.25)',
              }}
              whileTap={{ scale: 0.96 }}
            >
              <span className="relative z-10 text-white/90">Já sou cliente</span>
            </motion.button>
          </Link>
        </div>
      </motion.header>

      {/* ═══════════════════════════════════════════════════════════════
          DESKTOP/TABLET HEADER — Liquid Glass Elevado
          ═══════════════════════════════════════════════════════════════ */}
      <header 
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-500 hidden md:block
          ${isScrolled ? 'lg:opacity-0 lg:pointer-events-none' : 'lg:opacity-100'}
        `}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="liquid-glass flex items-center justify-between px-5 py-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/LOGO SEM FUNDO.png" 
                alt="Kevin Hussein" 
                className="w-9 h-9 object-contain"
              />
              <span className="font-medium tracking-tight text-white/90">
                Kevin Hussein
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/5"
              >
                Início
              </Link>
              <Link
                to="/#sobre"
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/5"
              >
                Sobre
              </Link>
              
              <div className="flex items-center gap-1 ml-2 mr-3">
                {socialItems.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-white/40 hover:text-[#A855F7] transition-colors duration-200"
                    aria-label={social.label}
                  >
                    <social.icon size={18} />
                  </a>
                ))}
              </div>

              <Link
                to="/meus-agendamentos"
                className="btn-imperial px-4 py-2 text-xs font-medium tracking-wide rounded-full"
              >
                Já sou cliente
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Floating Nav — Desktop only (aparece no scroll) */}
      <AnimatePresence>
        {isScrolled && (
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 hidden lg:block"
          >
            <div className="liquid-glass-pill flex items-center gap-1 px-4 py-2.5">
              <Link to="/" className="mr-2">
                <img 
                  src="/LOGO SEM FUNDO.png" 
                  alt="Kevin Hussein" 
                  className="w-7 h-7 object-contain"
                />
              </Link>
              
              <Link
                to="/"
                className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/5"
              >
                Início
              </Link>
              <Link
                to="/#sobre"
                className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/5"
              >
                Sobre
              </Link>
              
              {socialItems.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-white/40 hover:text-[#A855F7] transition-colors duration-200"
                  aria-label={social.label}
                >
                  <social.icon size={16} />
                </a>
              ))}

              <Link
                to="/meus-agendamentos"
                className="ml-2 btn-imperial px-3.5 py-1.5 text-xs font-medium tracking-wide rounded-full"
              >
                Já sou cliente
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}
