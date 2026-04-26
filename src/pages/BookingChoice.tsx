import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Ruler, ArrowRight, Calendar, Clock, Lock, LogIn, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { bookingsApi } from '../services/api'

const CLIENT_ACCESS_KEY = 'kh_client_access'

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export default function BookingChoice() {
  const location = useLocation()
  const navigate = useNavigate()
  const cpfInputRef = useRef<HTMLInputElement | null>(null)
  const loginCardRef = useRef<HTMLDivElement | null>(null)
  const easeOutQuint = [0.22, 1, 0.36, 1]
  const [isCheckingAccess, setIsCheckingAccess] = useState<null | 'teste_anatomico' | 'sessao'>(null)
  const [cpfInput, setCpfInput] = useState(() => {
    const raw = sessionStorage.getItem(CLIENT_ACCESS_KEY)
    if (!raw) return ''
    try {
      const parsed = JSON.parse(raw) as { cpf?: string }
      return parsed.cpf ? maskCpf(parsed.cpf) : ''
    } catch {
      return ''
    }
  })
  const [cpfError, setCpfError] = useState('')
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(() => {
    const raw = sessionStorage.getItem(CLIENT_ACCESS_KEY)
    if (!raw) return false
    try {
      const parsed = JSON.parse(raw) as { eligible?: boolean }
      return !!parsed.eligible
    } catch {
      return false
    }
  })

  const persistClientAccess = (cleanCpf: string) => {
    sessionStorage.setItem(CLIENT_ACCESS_KEY, JSON.stringify({ cpf: cleanCpf, eligible: true }))
    window.dispatchEvent(new Event('kh-client-access-updated'))
  }

  const clearClientAccess = () => {
    setIsClientLoggedIn(false)
    setCpfError('')
    sessionStorage.removeItem(CLIENT_ACCESS_KEY)
    window.dispatchEvent(new Event('kh-client-access-updated'))
  }

  const validateRestrictedAccess = async (targetType?: 'teste_anatomico' | 'sessao') => {
    const accessType = targetType ?? null
    if (isCheckingAccess) return

    const cleanCpf = cpfInput.replace(/\D/g, '')
    if (!cleanCpf) {
      setCpfError('Informe seu CPF para continuar.')
      cpfInputRef.current?.focus()
      return
    }

    if (cleanCpf.length !== 11) {
      setCpfError('CPF inválido. Digite os 11 dígitos.')
      cpfInputRef.current?.focus()
      return
    }

    setIsCheckingAccess(accessType || 'teste_anatomico')
    setCpfError('')
    try {
      const response = await bookingsApi.getByCpf(cleanCpf)
      const bookings = response?.data?.bookings || []
      const hasCompletedMeeting = bookings.some(
        (b) => b.type === 'reuniao' && b.status === 'concluido'
      )

      if (!hasCompletedMeeting) {
        setIsClientLoggedIn(false)
        sessionStorage.removeItem(CLIENT_ACCESS_KEY)
        window.dispatchEvent(new Event('kh-client-access-updated'))
        setCpfError('Acesso liberado apenas para clientes com reunião concluída.')
        return
      }

      setIsClientLoggedIn(true)
      persistClientAccess(cleanCpf)

      if (accessType) {
        navigate(`/agendar/reuniao?tipo=${accessType}`, { state: { cpf: cleanCpf } })
      }
    } catch {
      setIsClientLoggedIn(false)
      setCpfError('Não foi possível validar seu CPF agora. Tente novamente em instantes.')
    } finally {
      setIsCheckingAccess(null)
    }
  }

  const handleRestrictedAccess = (targetType: 'teste_anatomico' | 'sessao') => {
    if (isCheckingAccess) return

    if (isClientLoggedIn) {
      const cleanCpf = cpfInput.replace(/\D/g, '')
      navigate(`/agendar/reuniao?tipo=${targetType}`, { state: { cpf: cleanCpf } })
      return
    }

    validateRestrictedAccess(targetType)
  }

  useEffect(() => {
    if (location.hash !== '#cliente-login') return

    requestAnimationFrame(() => {
      loginCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      cpfInputRef.current?.focus()
    })
  }, [location.hash])

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
          className="text-center mb-8"
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

          <div className="mt-4 text-xs" style={{ color: '#9A94AE' }}>
            Etapas 2 e 3 ficam bloqueadas até validar CPF com reunião concluída.
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            CARD 1: Reunião Estratégica — Quartas
            ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOutQuint }}
          className="mb-6"
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
                    Primeiro contato para alinhar o projeto, referências e estilo. 
                    Até 3 encontros gratuitos para definição do projeto.
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

        <motion.div
          ref={loginCardRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16, ease: easeOutQuint }}
          className="mb-6"
          id="cliente-login"
        >
          <div
            className="rounded-3xl p-5 border"
            style={{
              background: 'linear-gradient(180deg, rgba(22, 17, 35, 0.94) 0%, rgba(14, 11, 27, 0.94) 100%)',
              borderColor: isClientLoggedIn ? 'rgba(52, 211, 153, 0.42)' : 'rgba(168, 85, 247, 0.3)',
              boxShadow: isClientLoggedIn
                ? '0 16px 36px rgba(5, 6, 18, 0.42), inset 0 1px 0 rgba(52, 211, 153, 0.08)'
                : '0 16px 36px rgba(5, 6, 18, 0.42), inset 0 1px 0 rgba(168, 85, 247, 0.08)',
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] mb-1" style={{ color: '#A855F7' }}>
                  Login do cliente
                </p>
                <p className="text-xs" style={{ color: '#9A94AE' }}>
                  Valide seu CPF para liberar as etapas 2 e 3.
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0"
                style={{
                  color: isClientLoggedIn ? '#86EFAC' : '#C4B5FD',
                  background: isClientLoggedIn ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.16)',
                  border: isClientLoggedIn ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(168, 85, 247, 0.3)',
                }}
              >
                {isClientLoggedIn ? <ShieldCheck size={11} /> : <Lock size={11} />}
                {isClientLoggedIn ? 'Acesso liberado' : 'Aguardando CPF'}
              </span>
            </div>

            <div className="space-y-2.5">
              <input
                ref={cpfInputRef}
                type="text"
                inputMode="numeric"
                value={cpfInput}
                onChange={(e) => {
                  setCpfInput(maskCpf(e.target.value))
                  if (cpfError) setCpfError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    validateRestrictedAccess()
                  }
                }}
                placeholder="000.000.000-00"
                className={`input-dark no-icon${cpfError ? ' input-error' : ''}`}
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <p className="text-[11px] sm:text-xs" style={{ color: '#9A94AE' }}>
                  Use o mesmo CPF cadastrado no atendimento.
                </p>

                <div className="flex items-center gap-2 self-start sm:self-auto sm:justify-end">
                {isClientLoggedIn && (
                  <button
                    type="button"
                    onClick={clearClientAccess}
                    className="btn btn-ghost btn-sm rounded-xl"
                  >
                    Trocar CPF
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => validateRestrictedAccess()}
                  disabled={isCheckingAccess !== null}
                  className="btn btn-primary btn-lg min-w-[136px] sm:min-w-[144px] tracking-wide rounded-xl"
                  style={{ opacity: isCheckingAccess ? 0.7 : 1 }}
                >
                  {isCheckingAccess ? (
                    'Validando'
                  ) : isClientLoggedIn ? (
                    <>
                      <ShieldCheck size={14} />
                      Revalidar
                    </>
                  ) : (
                    <>
                      <LogIn size={14} />
                      Entrar
                    </>
                  )}
                </button>
                </div>
              </div>
            </div>

            {cpfError ? (
              <p className="text-xs mt-2.5" style={{ color: '#FCA5A5' }}>
                {cpfError}
              </p>
            ) : (
              <p className="text-xs mt-2.5" style={{ color: isClientLoggedIn ? '#86EFAC' : '#A9A3B8' }}>
                {isClientLoggedIn
                  ? 'CPF validado. Etapas 2 e 3 liberadas para este cliente.'
                  : 'Sem CPF validado, as etapas 2 e 3 permanecem restritas.'}
              </p>
            )}

            {isClientLoggedIn && (
              <Link
                to="/meus-agendamentos"
                className="mt-3 h-11 sm:h-12 inline-flex items-center justify-center gap-2 w-full px-4 rounded-xl border text-sm font-semibold transition-all duration-200"
                style={{
                  color: '#E8E4F0',
                  borderColor: 'rgba(168, 85, 247, 0.36)',
                  background: 'rgba(139, 92, 246, 0.16)',
                }}
              >
                <Calendar size={15} />
                Ver histórico e meus agendamentos
              </Link>
            )}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            CARD 2: Teste Anatômico — Terças
            ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: easeOutQuint }}
          className="mb-6"
        >
          <button
            type="button"
            onClick={() => handleRestrictedAccess('teste_anatomico')}
            disabled={isCheckingAccess !== null}
            className="block group w-full text-left disabled:opacity-70"
          >
          <div className="liquid-glass-card-highlight relative p-7 sm:p-8 transition-all duration-300 hover:scale-[1.01]">
            <div className="flex items-start gap-5">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0.08) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                }}
              >
                <Ruler size={26} style={{ color: '#F59E0B' }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium" style={{ color: '#F59E0B' }}>2ª ETAPA</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: '#FCD34D', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    {isClientLoggedIn ? 'acesso liberado' : 'bloqueado sem CPF'}
                  </span>
                  {!isClientLoggedIn && <Lock size={12} style={{ color: '#F59E0B' }} />}
                </div>
                
                <h2 className="text-xl font-semibold mb-2 group-hover:text-[#F59E0B] transition-colors duration-200" style={{ color: '#E6E0D6' }}>
                  Teste Anatômico
                </h2>
                
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#A9A3B8' }}>
                  Aplicação do desenho no corpo para validar tamanho, posição e proporções antes da sessão definitiva.
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <Calendar size={11} /> Terças-feiras
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <Clock size={11} /> 2h por sessão
                  </span>
                </div>

                <div className="flex items-center justify-end">
                  <span className="inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all duration-200" style={{ color: '#F59E0B' }}>
                    {isClientLoggedIn ? 'Agendar teste' : 'Validar CPF para continuar'}
                    <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          </div>
          </button>
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
          <button
            type="button"
            onClick={() => handleRestrictedAccess('sessao')}
            disabled={isCheckingAccess !== null}
            className="block group w-full text-left disabled:opacity-70"
          >
          <div className="liquid-glass-card-highlight relative p-7 sm:p-8 transition-all duration-300 hover:scale-[1.01]">
            <div className="flex items-start gap-5">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(6, 182, 212, 0.08) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                }}
              >
                <Calendar size={26} style={{ color: '#06B6D4' }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium" style={{ color: '#06B6D4' }}>3ª ETAPA</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: '#67E8F9', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                    {isClientLoggedIn ? 'acesso liberado' : 'bloqueado sem CPF'}
                  </span>
                  {!isClientLoggedIn && <Lock size={12} style={{ color: '#06B6D4' }} />}
                </div>
                
                <h2 className="text-xl font-semibold mb-2 group-hover:text-[#06B6D4] transition-colors duration-200" style={{ color: '#E6E0D6' }}>
                  Sessão de Tatuagem
                </h2>
                
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#A9A3B8' }}>
                  Execução da tatuagem. As datas são liberadas após aprovação do projeto e pagamento do sinal.
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#67E8F9', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                    <Calendar size={11} /> Quinta a Domingo
                  </span>
                </div>

                <div className="flex items-center justify-end">
                  <span className="inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all duration-200" style={{ color: '#06B6D4' }}>
                    {isClientLoggedIn ? 'Agendar sessão' : 'Validar CPF para continuar'}
                    <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          </div>
          </button>
        </motion.div>

      </div>
    </div>
  )
}
