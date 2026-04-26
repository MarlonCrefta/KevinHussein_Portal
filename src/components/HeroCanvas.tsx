import { useEffect, useRef } from 'react'

interface Orb {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  hue: number
  opacity: number
  pulseSpeed: number
  pulseOffset: number
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let t = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    const orbs: Orb[] = [
      // Orb 1 — grande, roxo profundo, centro-superior
      { x: 0.5, y: 0.25, vx: 0.00012, vy: 0.00008, radius: 0.55, hue: 265, opacity: 0.13, pulseSpeed: 0.0008, pulseOffset: 0 },
      // Orb 2 — médio, violeta, esquerda
      { x: 0.15, y: 0.45, vx: -0.00009, vy: 0.00011, radius: 0.38, hue: 278, opacity: 0.10, pulseSpeed: 0.0011, pulseOffset: 1.2 },
      // Orb 3 — médio, roxo escuro, direita
      { x: 0.82, y: 0.35, vx: 0.00007, vy: -0.00013, radius: 0.40, hue: 258, opacity: 0.09, pulseSpeed: 0.0009, pulseOffset: 2.4 },
      // Orb 4 — pequeno, champagne quente, canto superior direito
      { x: 0.75, y: 0.12, vx: -0.00011, vy: 0.00007, radius: 0.22, hue: 38, opacity: 0.06, pulseSpeed: 0.0007, pulseOffset: 0.8 },
      // Orb 5 — grande, roxo muito escuro, baixo-centro
      { x: 0.45, y: 0.75, vx: 0.00008, vy: -0.00006, radius: 0.50, hue: 270, opacity: 0.08, pulseSpeed: 0.0010, pulseOffset: 1.8 },
      // Orb 6 — pequeno, violeta médio, esquerda-baixo
      { x: 0.18, y: 0.70, vx: 0.00013, vy: 0.00009, radius: 0.25, hue: 283, opacity: 0.07, pulseSpeed: 0.0012, pulseOffset: 3.0 },
    ]

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 1

      const W = canvas.width
      const H = canvas.height

      for (const orb of orbs) {
        // Deriva lenta com bounce nas bordas
        orb.x += orb.vx
        orb.y += orb.vy
        if (orb.x < 0.05 || orb.x > 0.95) orb.vx *= -1
        if (orb.y < 0.05 || orb.y > 0.95) orb.vy *= -1

        // Pulso suave de opacity
        const pulse = Math.sin(t * orb.pulseSpeed + orb.pulseOffset)
        const currentOpacity = orb.opacity + pulse * (orb.opacity * 0.3)

        const cx = orb.x * W
        const cy = orb.y * H
        const r = orb.radius * Math.min(W, H)

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        grad.addColorStop(0, `hsla(${orb.hue}, 75%, 45%, ${currentOpacity})`)
        grad.addColorStop(0.4, `hsla(${orb.hue}, 65%, 35%, ${currentOpacity * 0.5})`)
        grad.addColorStop(1, `hsla(${orb.hue}, 60%, 25%, 0)`)

        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    draw()

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 1 }}
      aria-hidden="true"
    />
  )
}
