import { motion } from 'framer-motion'
import { MessageCircle, Ruler, Lock, ArrowRight, Calendar, Clock, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BookingChoice() {
  const easeOutQuint = [0.22, 1, 0.36, 1]

  return (
    <div 
      className="min-h-[100dvh] pt-28 pb-16 px-6 sm:px-8 lg:px-12 relative"
      style={{ backgroundColor: '#050510' }}
    >
      {/* Background Acanthus com blur e profundidade */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'url("/download.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          filter: 'blur(6px)',
          opacity: 0.08,
          transform: 'scale(1.05)',
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 60%),
            linear-gradient(to bottom, rgba(5, 5, 15, 0.75) 0%, rgba(5, 5, 15, 0.98) 100%)
          `,
        }}
      />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: easeOutQuint }}
          className="flex justify-center mb-8"
        >
          <img 
            src="/LOGO SEM FUNDO.png" 
            alt="Kevin Hussein Tattoo" 
            className="w-20 h-20 object-contain"
            style={{ filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))' }}
          />
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutQuint }}
          className="text-center mb-12"
        >
          <span 
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium mb-5 tracking-wide"
            style={{ 
              background: 'rgba(139, 92, 246, 0.15)',
              color: '#A855F7',
              border: '1px solid rgba(168, 85, 247, 0.25)',
            }}
          >
            Processo de Agendamento
          </span>
          <h1 
            className="text-3xl sm:text-4xl mb-4 uppercase"
            style={{ 
              fontFamily: '"Cinzel", Georgia, serif',
              color: '#FFFFFF',
              letterSpacing: '0.06em',
              fontWeight: 600,
            }}
          >
            Como funciona
          </h1>
          <p style={{ color: '#A9A3B8' }} className="max-w-md mx-auto">
            Nosso processo é em 3 etapas para garantir um projeto perfeito e exclusivo.
          </p>
        </motion.div>

        {/* ═══════════════════════════════════════════
            CARD 1: Reunião Estratégica — Quartas
            ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOutQuint }}
          className="mb-4"
        >
          <Link to="/agendar/reuniao" className="block group">
            <div className="liquid-glass-card-highlight relative p-7 sm:p-8 transition-all duration-300 hover:scale-[1.01]">
              <div className="flex items-start gap-5">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                  }}
                >
                  <MessageCircle size={26} style={{ color: '#A855F7' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium" style={{ color: '#A855F7' }}>1ª ETAPA</span>
                  </div>
                  
                  <h2 
                    className="text-xl font-semibold mb-2 group-hover:text-[#A855F7] transition-colors duration-200"
                    style={{ color: '#E6E0D6' }}
                  >
                    Reunião Estratégica
                  </h2>

                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#A9A3B8' }}>
                    Alinhamento do projeto, referências e estilo. 
                    Ao final da aprovação, é cobrado um sinal de <strong style={{ color: '#E6E0D6' }}>R$ 270</strong> para dar sequência.
                  </p>

                  {/* Info Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                      style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#C4B5FD', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      <Calendar size={11} /> Quartas-feiras
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                      style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#C4B5FD', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      <Clock size={11} /> 2h por sessão
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                      style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#C4B5FD', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      <CreditCard size={11} /> Sinal R$ 270
                    </span>
                  </div>

                  <div className="flex items-center justify-end">
                    <span 
                      className="inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all duration-200"
                      style={{ color: '#A855F7' }}
                    >
                      Agendar reunião
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ═══════════════════════════════════════════
            CARD 2: Teste Anatômico — Terças
            ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: easeOutQuint }}
          className="mb-4"
        >
          <div className="liquid-glass-card p-7 sm:p-8 opacity-60">
            <div className="flex items-start gap-5">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              >
                <Ruler size={26} style={{ color: '#7A7489' }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium" style={{ color: '#7A7489' }}>2ª ETAPA</span>
                  <Lock size={12} style={{ color: '#7A7489' }} />
                </div>
                
                <h2 className="text-xl font-semibold mb-2" style={{ color: '#7A7489' }}>
                  Teste Anatômico
                </h2>
                
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#4A4558' }}>
                  Aplicação do desenho no corpo para validar tamanho, posição e proporções antes da sessão definitiva.
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#4A4558', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Calendar size={11} /> Terças-feiras
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#4A4558', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Clock size={11} /> 2h por sessão
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            CARD 3: Sessão de Tatuagem — Qui a Dom
            ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: easeOutQuint }}
          className="mb-8"
        >
          <div className="liquid-glass-card p-7 sm:p-8 opacity-60">
            <div className="flex items-start gap-5">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              >
                <Calendar size={26} style={{ color: '#7A7489' }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium" style={{ color: '#7A7489' }}>3ª ETAPA</span>
                  <Lock size={12} style={{ color: '#7A7489' }} />
                </div>
                
                <h2 className="text-xl font-semibold mb-2" style={{ color: '#7A7489' }}>
                  Sessão de Tatuagem
                </h2>
                
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#4A4558' }}>
                  Execução da tatuagem. As datas são liberadas após aprovação do projeto e pagamento do sinal.
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#4A4558', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Calendar size={11} /> Quinta a Domingo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-sm mt-8"
          style={{ color: '#7A7489' }}
        >
          Dúvidas?{' '}
          <a 
            href="https://wa.me/5541996481275" 
            target="_blank" 
            rel="noopener noreferrer"
            className="transition-colors duration-200"
            style={{ color: '#A855F7' }}
          >
            Fale conosco
          </a>
        </motion.p>
      </div>
    </div>
  )
}
