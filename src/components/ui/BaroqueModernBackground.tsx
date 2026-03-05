import { useEffect, useState } from 'react'

interface BaroqueModernBackgroundProps {
  variant?: 'hero' | 'section' | 'quiet'
}

export default function BaroqueModernBackground({ variant = 'hero' }: BaroqueModernBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    let rafId: number
    const handleMouseMove = (e: MouseEvent) => {
      rafId = requestAnimationFrame(() => {
        setMousePosition({
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        })
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const intensity = variant === 'hero' ? 1 : variant === 'section' ? 0.6 : 0.3

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base: Void escuro (#050509) */}
      <div className="absolute inset-0 bg-void" />

      {/* Gradiente principal: Violet profundo no centro */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 40%, 
              #2B163F 0%, 
              #1A0E28 35%,
              #050509 70%
            )
          `,
        }}
      />

      {/* Halo neon externo sutil - apenas hero */}
      {variant === 'hero' && (
        <div 
          className="absolute inset-0 animate-breathe"
          style={{
            background: `
              radial-gradient(ellipse 100% 80% at 50% 50%, 
                rgba(201, 60, 255, 0.12) 0%, 
                rgba(201, 60, 255, 0.04) 40%,
                transparent 70%
              )
            `,
          }}
        />
      )}

      {/* Movimento parallax sutil com mouse */}
      <div 
        className="absolute inset-0 transition-transform duration-1000 ease-out"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at ${45 + mousePosition.x * 10}% ${35 + mousePosition.y * 10}%, 
              rgba(92, 53, 168, ${0.2 * intensity}) 0%, 
              transparent 60%
            )
          `,
        }}
      />

      {/* Glow imperial secundário */}
      <div 
        className="absolute"
        style={{
          top: '30%',
          right: '20%',
          width: '40%',
          height: '40%',
          background: `radial-gradient(ellipse 100% 100% at 50% 50%, 
            rgba(92, 53, 168, ${0.08 * intensity}) 0%, 
            transparent 70%
          )`,
          filter: 'blur(80px)',
        }}
      />

      {/* Textura noise sutil */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Vinheta dramática */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 70% at 50% 50%, transparent 0%, rgba(5, 5, 9, ${0.6 * intensity}) 100%)`,
        }}
      />
    </div>
  )
}
