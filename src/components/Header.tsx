import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Instagram, MessageCircle, LogIn, User } from 'lucide-react'

const socialItems = [
  { href: 'https://instagram.com/kevinhusseintattoo', icon: Instagram, label: 'Instagram' },
  { href: 'https://wa.me/5541996481275', icon: MessageCircle, label: 'WhatsApp' },
]

export default function Header() {
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false)
  const accountLabel = isClientLoggedIn ? 'Minha Conta' : 'Entrar'

  const syncClientAccess = () => {
    const raw = sessionStorage.getItem('kh_client_access')
    if (!raw) {
      setIsClientLoggedIn(false)
      return
    }

    try {
      const parsed = JSON.parse(raw) as { eligible?: boolean }
      setIsClientLoggedIn(!!parsed.eligible)
    } catch {
      setIsClientLoggedIn(false)
    }
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleStorage = () => syncClientAccess()
    const handleAccessUpdate = () => syncClientAccess()

    syncClientAccess()
    window.addEventListener('storage', handleStorage)
    window.addEventListener('kh-client-access-updated', handleAccessUpdate as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('kh-client-access-updated', handleAccessUpdate as EventListener)
    }
  }, [location.pathname])

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
        
        <div className="relative flex items-center justify-between px-5 py-4 min-h-[64px]">
          {/* Logo — Estilo charutaria */}
          <Link to="/" className="flex items-center gap-2">
            <motion.img
              src="/LOGO SEM FUNDO.png"
              alt="Kevin Hussein"
              className="h-8 md:h-10 w-8 md:w-10 object-contain"
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
          <Link
            to={isClientLoggedIn ? '/meus-agendamentos' : '/agendar#cliente-login'}
            className="btn btn-ghost btn-sm"
          >
            {isClientLoggedIn ? <User size={14} /> : <LogIn size={14} />}
            <span>{accountLabel}</span>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="liquid-glass grid grid-cols-[180px_1fr_180px] lg:grid-cols-[220px_1fr_220px] items-center px-4 lg:px-5 py-2.5 lg:py-3 min-h-[64px]">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2.5 lg:gap-3 w-[180px] lg:w-[220px]">
              <img
                src="/LOGO SEM FUNDO.png"
                alt="Kevin Hussein"
                className="h-8 md:h-10 w-8 md:w-10 object-contain"
              />
              <span className="text-sm lg:text-base font-medium tracking-tight text-white/90">
                Kevin Hussein
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="justify-self-center flex items-center gap-4 lg:gap-6">
              <Link
                to="/"
                className="px-2.5 lg:px-3.5 py-1.5 text-sm text-white/65 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/5"
              >
                Início
              </Link>
              <Link
                to="/#sobre"
                className="px-2.5 lg:px-3.5 py-1.5 text-sm text-white/65 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/5"
              >
                Sobre
              </Link>

              <div className="flex items-center gap-1 ml-1 lg:ml-1.5">
                {socialItems.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 lg:p-2 text-white/40 hover:text-[#A855F7] transition-colors duration-200"
                    aria-label={social.label}
                  >
                    <social.icon size={17} />
                  </a>
                ))}
              </div>
            </nav>

            <div className="justify-self-end w-[180px] lg:w-[220px] flex justify-end">
              <Link
                to={isClientLoggedIn ? '/meus-agendamentos' : '/agendar#cliente-login'}
                className="btn btn-ghost btn-sm"
              >
                {isClientLoggedIn ? <User size={14} /> : <LogIn size={14} />}
                {accountLabel}
              </Link>
            </div>
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
            className="fixed top-5 left-0 right-0 z-50 hidden lg:block px-4"
          >
            <div
              className="liquid-glass-pill w-[min(92vw,720px)] mx-auto grid grid-cols-[96px_1fr_188px] xl:grid-cols-[112px_1fr_198px] items-center px-4 py-2"
              style={{
                borderColor: 'rgba(208, 172, 255, 0.28)',
                boxShadow: '0 12px 34px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <Link to="/" className="inline-flex items-center w-[96px] xl:w-[112px]">
                <img 
                  src="/LOGO SEM FUNDO.png" 
                  alt="Kevin Hussein" 
                  className="w-7 h-7 object-contain"
                />
              </Link>

              <div className="justify-self-center flex items-center gap-4 lg:gap-6">
                <Link
                  to="/"
                  className="px-3 py-1.5 text-sm text-white/65 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/5"
                >
                  Início
                </Link>
                <Link
                  to="/#sobre"
                  className="px-3 py-1.5 text-sm text-white/65 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/5"
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
              </div>

              <Link
                to={isClientLoggedIn ? '/meus-agendamentos' : '/agendar#cliente-login'}
                className="justify-self-end btn btn-ghost btn-sm"
              >
                {isClientLoggedIn ? <User size={14} /> : <LogIn size={14} />}
                {accountLabel}
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}
