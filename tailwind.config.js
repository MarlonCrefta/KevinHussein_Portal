/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════════
        // KEVIN HUSSEIN — DESIGN SYSTEM v1.0
        // Drama controlado. Cinematográfico. Premium.
        // Proporção: 70% Neutros / 20% Roxos / 10% Neon
        // ═══════════════════════════════════════════════════════════════
        
        // ─────────────────────────────────────────────────────────────────
        // NEUTROS (70%) — Base do design
        // ─────────────────────────────────────────────────────────────────
        obsidian: {
          DEFAULT: '#0B0B0D',
        },
        graphite: {
          DEFAULT: '#1A1A1F',
          light: '#252529',
        },
        bone: {
          DEFAULT: '#D9D4C6',
          muted: '#9A9590',
          faded: '#5C5955',
        },
        
        // ─────────────────────────────────────────────────────────────────
        // ACANTHUS / CLÁSSICOS — Detalhes premium
        // ─────────────────────────────────────────────────────────────────
        champagne: {
          DEFAULT: '#C8B89A',
          light: '#D4C8B0',
          muted: 'rgba(200, 184, 154, 0.15)',
        },
        
        // ─────────────────────────────────────────────────────────────────
        // ROXOS (20%) — Títulos e blocos-chave
        // ─────────────────────────────────────────────────────────────────
        imperial: {
          DEFAULT: '#4B2F6B',
          light: '#5C3D7D',
        },
        violet: {
          DEFAULT: '#3A1D54',
          deep: '#2A1340',
        },
        
        // ─────────────────────────────────────────────────────────────────
        // NEON (10%) — MICRO DETALHES APENAS
        // Uso: hover, linha fina, ícone ativo, sublinhado mínimo
        // NUNCA em blocos grandes
        // ─────────────────────────────────────────────────────────────────
        neon: {
          DEFAULT: '#C93CFF',
          glow: 'rgba(201, 60, 255, 0.35)',
          muted: 'rgba(201, 60, 255, 0.15)',
          subtle: 'rgba(201, 60, 255, 0.08)',
        },
        
        // Base escura vibrante (Art Direction V3)
        void: {
          DEFAULT: '#050509',
          light: '#111119',
        },
        
        // Feedback
        success: { DEFAULT: '#7D9B76', muted: 'rgba(125, 155, 118, 0.15)' },
        warning: { DEFAULT: '#CFC4AD', muted: 'rgba(207, 196, 173, 0.15)' },
        error: { DEFAULT: '#B07070', muted: 'rgba(176, 112, 112, 0.15)' },
        
        // ─────────────────────────────────────────────────────────────────
        // ADMIN PORTAL — Light Professional Theme
        // Neutro, limpo, profissional (estilo NFSe)
        // ─────────────────────────────────────────────────────────────────
        admin: {
          // Backgrounds
          bg: '#F8FAFC',           // slate-50
          card: '#FFFFFF',         // white
          surface: '#F1F5F9',      // slate-100
          hover: '#E2E8F0',        // slate-200
          border: '#E2E8F0',       // slate-200 (mais suave)
          'border-strong': '#CBD5E1', // slate-300
          
          // Text
          text: '#1E293B',         // slate-800 (melhor contraste)
          muted: '#64748B',        // slate-500
          subtle: '#94A3B8',       // slate-400
          
          // Accent (Indigo profissional)
          accent: '#4F46E5',       // indigo-600
          'accent-hover': '#4338CA', // indigo-700 (escurece no hover)
          'accent-light': '#6366F1', // indigo-500
          'accent-muted': '#EEF2FF', // indigo-50 (sólido, não transparente)
          'accent-subtle': 'rgba(79, 70, 229, 0.08)',
          
          // Secondary colors (para tipos de agendamento)
          'type-meeting': '#8B5CF6',    // violet-500
          'type-meeting-bg': '#F5F3FF', // violet-50
          'type-session': '#06B6D4',    // cyan-500
          'type-session-bg': '#ECFEFF', // cyan-50
          
          // Status colors
          'success': '#059669',    // emerald-600
          'success-bg': '#ECFDF5', // emerald-50
          'warning': '#D97706',    // amber-600
          'warning-bg': '#FFFBEB', // amber-50
          'error': '#DC2626',      // red-600
          'error-bg': '#FEF2F2',   // red-50
          'info': '#0284C7',       // sky-600
          'info-bg': '#F0F9FF',    // sky-50
        },
      },
      fontFamily: {
        display: ['Cinzel Decorative', 'Cinzel', 'Georgia', 'serif'],
        heading: ['Cinzel', 'Georgia', 'serif'],
        body: ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        // Sombras para tema claro (admin)
        'admin-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'admin-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'admin-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'admin-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'admin-card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'admin-button': '0 1px 2px rgba(79, 70, 229, 0.2)',
        'admin-button-hover': '0 4px 12px rgba(79, 70, 229, 0.3)',
        // Sombras originais (tema escuro)
        sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
        md: '0 4px 6px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.25)',
        '2xl': '0 25px 50px rgba(0, 0, 0, 0.4)',
        neon: '0 0 30px rgba(201, 60, 255, 0.35)',
        'neon-sm': '0 0 15px rgba(201, 60, 255, 0.25)',
        'neon-lg': '0 0 50px rgba(201, 60, 255, 0.4)',
        champagne: '0 8px 32px rgba(207, 196, 173, 0.25)',
        'champagne-lg': '0 12px 40px rgba(207, 196, 173, 0.3)',
        float: '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        'gradient-shift': 'gradientShift 45s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
        'breathe': 'breathe 8s ease-in-out infinite',
        'scroll-hint': 'scrollHint 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { 
          '0%': { opacity: '0' }, 
          '100%': { opacity: '1' } 
        },
        fadeInUp: { 
          '0%': { opacity: '0', transform: 'translateY(20px)' }, 
          '100%': { opacity: '1', transform: 'translateY(0)' } 
        },
        scaleIn: { 
          '0%': { opacity: '0', transform: 'scale(0.95)' }, 
          '100%': { opacity: '1', transform: 'scale(1)' } 
        },
        shimmer: { 
          '0%': { backgroundPosition: '-200% 0' }, 
          '100%': { backgroundPosition: '200% 0' } 
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.95' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.02)' },
        },
        scrollHint: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.6' },
          '50%': { transform: 'translateY(8px)', opacity: '1' },
        },
      },
      backgroundImage: { 
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero': 'radial-gradient(ellipse 80% 60% at 50% 40%, #2B163F 0%, #050509 70%)',
      },
      transitionTimingFunction: { 
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)', 
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
