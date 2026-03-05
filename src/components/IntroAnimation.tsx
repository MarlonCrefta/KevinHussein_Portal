import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════
// RITUAL DE ENTRADA — Logo sendo TATUADA = LOADING OFICIAL
// A animação é o loading. Não existe loader separado.
// Assets carregam enquanto a logo é tatuada.
// O site só surge quando tudo estiver pronto.
// ═══════════════════════════════════════════════════════════════

interface IntroAnimationProps {
  onComplete: () => void
  children: React.ReactNode
}

export default function IntroAnimation({ onComplete, children }: IntroAnimationProps) {
  const [phase, setPhase] = useState<'tattoo' | 'glow' | 'reveal' | 'done'>('tattoo')
  const [assetsReady, setAssetsReady] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false

  // Verificar quando assets estão prontos
  useEffect(() => {
    const checkAssetsReady = () => {
      // Verificar se documento está carregado
      if (document.readyState === 'complete') {
        setAssetsReady(true)
        return
      }
      
      // Aguardar load completo
      window.addEventListener('load', () => setAssetsReady(true), { once: true })
    }
    
    // Verificar fontes
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        checkAssetsReady()
      })
    } else {
      checkAssetsReady()
    }
    
    // Fallback: marcar como pronto após 2s mesmo se algo falhar
    const fallbackTimer = setTimeout(() => setAssetsReady(true), 2000)
    
    return () => clearTimeout(fallbackTimer)
  }, [])

  const completeIntro = useCallback(() => {
    setPhase('done')
    onComplete()
  }, [onComplete])

  // Só finaliza quando AMBOS: animação completa E assets prontos
  useEffect(() => {
    if (animationComplete && assetsReady) {
      completeIntro()
    }
  }, [animationComplete, assetsReady, completeIntro])

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimationComplete(true)
      return
    }

    // Fase 1: Tatuar logo (0-2000ms)
    const glowTimer = setTimeout(() => setPhase('glow'), 2000)
    
    // Fase 2: Glow dramático (2000-2500ms)
    const revealTimer = setTimeout(() => setPhase('reveal'), 2500)
    
    // Fase 3: Marcar animação como completa (2500-3300ms)
    const doneTimer = setTimeout(() => {
      setAnimationComplete(true)
    }, 3300)

    return () => {
      clearTimeout(glowTimer)
      clearTimeout(revealTimer)
      clearTimeout(doneTimer)
    }
  }, [prefersReducedMotion])

  const handleSkip = () => {
    if (phase !== 'done') {
      completeIntro()
    }
  }

  if (phase === 'done') {
    return <>{children}</>
  }

  return (
    <>
      {/* Site surge ao redor da logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'reveal' ? 1 : 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
      
      {/* RITUAL DE ENTRADA */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'reveal' ? 0 : 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: phase === 'reveal' ? 0.3 : 0 }}
        onClick={handleSkip}
        className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer overflow-hidden"
        style={{ 
          backgroundColor: '#050404',
          pointerEvents: phase === 'reveal' ? 'none' : 'auto',
        }}
      >
        {/* Vignette dramática */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 50% 50% at 50% 50%, 
              transparent 0%, 
              rgba(5, 4, 4, 0.3) 50%,
              rgba(5, 4, 4, 0.8) 100%
            )`,
          }}
        />
        
        {/* Glow roxo litúrgico profundo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: phase === 'tattoo' ? 0.4 : phase === 'glow' ? 0.8 : 0, 
            scale: phase === 'glow' ? 1.5 : 1 
          }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute"
          style={{
            width: '500px',
            height: '500px',
            background: `radial-gradient(ellipse at center, 
              rgba(42, 26, 58, 0.6) 0%, 
              rgba(42, 26, 58, 0.2) 40%,
              transparent 70%
            )`,
            filter: 'blur(60px)',
          }}
        />
        
        {/* Glow âmbar quente - luz de vela */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ 
            opacity: phase === 'tattoo' ? 0.3 : phase === 'glow' ? 1 : 0, 
            scale: phase === 'glow' ? 1.3 : 1 
          }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="absolute"
          style={{
            width: '400px',
            height: '400px',
            background: `radial-gradient(ellipse at center, 
              rgba(212, 168, 83, 0.25) 0%, 
              rgba(212, 168, 83, 0.08) 40%,
              transparent 70%
            )`,
            filter: 'blur(50px)',
          }}
        />
        
        {/* Container da logo — PONTO DE ORIGEM */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo sendo TATUADA */}
          <motion.div
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Efeito de desenho progressivo */}
            <motion.div
              className="relative"
              style={{ width: 'auto', height: 'auto' }}
            >
              {/* Logo com reveal dramático */}
              <motion.img 
                src="/LOGO SEM FUNDO.png" 
                alt="Kevin Hussein" 
                className="w-24 sm:w-32 md:w-40 h-auto"
                initial={{ 
                  clipPath: 'inset(0 100% 0 0)',
                  filter: 'brightness(0.2) saturate(0)',
                }}
                animate={{ 
                  clipPath: phase === 'tattoo' || phase === 'glow' || phase === 'reveal' 
                    ? 'inset(0 0% 0 0)' 
                    : 'inset(0 100% 0 0)',
                  filter: phase === 'glow' || phase === 'reveal' 
                    ? 'brightness(1.1) saturate(1)' 
                    : 'brightness(0.6) saturate(0.5)',
                }}
                transition={{ 
                  clipPath: {
                    duration: 1.8,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                  filter: {
                    duration: 0.6,
                    delay: 1.6,
                  }
                }}
                style={{ 
                  filter: 'drop-shadow(0 0 40px rgba(212, 168, 83, 0.4))'
                }}
              />
              
              {/* Linha de agulha - stroke que tatua */}
              <motion.div
                className="absolute top-0 h-full w-0.5 rounded-full"
                initial={{ left: '0%', opacity: 0 }}
                animate={{ 
                  left: ['0%', '25%', '50%', '75%', '100%'],
                  opacity: [0, 1, 1, 1, 0],
                }}
                transition={{ 
                  duration: 1.8,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                style={{
                  background: 'linear-gradient(to bottom, transparent, #D4A853, transparent)',
                  boxShadow: '0 0 12px rgba(212, 168, 83, 1), 0 0 30px rgba(212, 168, 83, 0.6), 0 0 50px rgba(212, 168, 83, 0.3)',
                }}
              />
              
              {/* Partículas de "tinta" */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === 'tattoo' ? 0.6 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-amber"
                    initial={{ 
                      x: '50%', 
                      y: '50%', 
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{ 
                      x: `${30 + Math.random() * 40}%`,
                      y: `${20 + Math.random() * 60}%`,
                      opacity: [0, 0.8, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{ 
                      duration: 0.8,
                      delay: 0.3 + i * 0.3,
                      ease: 'easeOut',
                    }}
                    style={{
                      boxShadow: '0 0 6px rgba(212, 168, 83, 0.8)',
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
            
            {/* Glow final dramático */}
            <motion.div
              className="absolute inset-0 -z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: phase === 'glow' ? 1 : 0,
                scale: phase === 'glow' ? 1.2 : 0.8,
              }}
              transition={{ duration: 0.4 }}
              style={{
                background: `radial-gradient(ellipse at center, 
                  rgba(212, 168, 83, 0.3) 0%, 
                  transparent 70%
                )`,
                filter: 'blur(20px)',
              }}
            />
          </motion.div>
        </div>

        {/* Hint para pular */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'tattoo' ? 0.25 : 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="absolute bottom-8 text-xs text-ivory/30 tracking-widest uppercase"
        >
          Clique para pular
        </motion.p>
      </motion.div>
    </>
  )
}
