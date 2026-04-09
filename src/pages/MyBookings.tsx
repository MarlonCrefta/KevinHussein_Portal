import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  MapPin,
  Phone,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Star,
  Shield,
  User,
} from 'lucide-react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link, useNavigate } from 'react-router-dom'
import { bookingsApi, Booking, Client } from '../services/api'

const easeOutQuint = [0.22, 1, 0.36, 1]

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export default function MyBookings() {
  const navigate = useNavigate()
  const [cpf, setCpf] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [searched, setSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('kh_client_access')

    if (!raw) {
      navigate('/agendar#cliente-login', { replace: true })
      return
    }

    let parsed: { cpf?: string; eligible?: boolean }
    try {
      parsed = JSON.parse(raw)
    } catch {
      sessionStorage.removeItem('kh_client_access')
      window.dispatchEvent(new Event('kh-client-access-updated'))
      navigate('/agendar#cliente-login', { replace: true })
      return
    }

    if (!parsed?.eligible || !parsed?.cpf) {
      sessionStorage.removeItem('kh_client_access')
      window.dispatchEvent(new Event('kh-client-access-updated'))
      navigate('/agendar#cliente-login', { replace: true })
      return
    }

    const cleanCpf = parsed.cpf.replace(/\D/g, '')
    if (cleanCpf.length !== 11) {
      sessionStorage.removeItem('kh_client_access')
      window.dispatchEvent(new Event('kh-client-access-updated'))
      navigate('/agendar#cliente-login', { replace: true })
      return
    }

    setCpf(maskCpf(cleanCpf))

    bookingsApi
      .getByCpf(cleanCpf)
      .then((response) => {
        if (response.success) {
          setBookings(response.data.bookings)
          setClient(response.data.client)
        } else {
          setBookings([])
          setClient(null)
        }
      })
      .catch((error) => {
        console.error('Erro ao carregar histórico da sessão:', error)
        setBookings([])
        setClient(null)
      })
      .finally(() => {
        setSearched(true)
        setIsLoading(false)
      })
  }, [navigate])

  const goToBookingChoice = () => navigate('/agendar')

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; border: string; icon: typeof Clock; label: string; dot: string }> = {
      pendente: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Clock, label: 'Pendente', dot: 'bg-amber-400' },
      confirmado: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: CheckCircle, label: 'Confirmado', dot: 'bg-emerald-400' },
      cancelado: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: XCircle, label: 'Cancelado', dot: 'bg-red-400' },
      concluido: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', icon: CheckCircle, label: 'Concluido', dot: 'bg-violet-400' },
      nao_compareceu: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: AlertCircle, label: 'Nao Compareceu', dot: 'bg-orange-400' },
    }
    return configs[status] || configs.pendente
  }

  const getReputationConfig = (rep: string) => {
    const configs: Record<string, { icon: typeof Star; label: string; color: string }> = {
      neutro: { icon: Star, label: 'Cliente Novo', color: 'text-violet-400' },
      boa: { icon: Shield, label: 'Cliente Regular', color: 'text-emerald-400' },
      alta: { icon: Sparkles, label: 'Cliente VIP', color: 'text-amber-400' },
      baixa: { icon: AlertCircle, label: 'Em Alerta', color: 'text-red-400' },
    }
    return configs[rep] || configs.neutro
  }

  if (isLoading || !searched) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: '#050509' }}>
        <div className="w-7 h-7 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (selectedBooking) {
    const status = getStatusConfig(selectedBooking.status)
    const StatusIcon = status.icon
    const bookingDate = parseISO(selectedBooking.date)
    const isBookingPast = isPast(bookingDate) && !isToday(bookingDate)
    const isBookingToday = isToday(bookingDate)

    return (
      <div className="min-h-[100dvh] relative" style={{ backgroundColor: '#050509' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[420px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(ellipse, #8B5CF6 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 pt-24 pb-16 px-5 sm:px-8">
          <div className="max-w-lg mx-auto">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={goToBookingChoice}
              className="flex items-center gap-2 text-sm mb-8 transition-colors duration-200"
              style={{ color: '#A9A3B8' }}
            >
              <ArrowLeft size={16} />
              Voltar para agendamentos
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOutQuint }}
              className={`rounded-2xl p-6 mb-6 border ${status.bg} ${status.border}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${status.bg}`}>
                  <StatusIcon size={28} className={status.text} />
                </div>
                <div className="flex-1">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${status.text}`}>{status.label}</span>
                  <h1 className="text-xl font-bold mt-1" style={{ color: '#E8E4F0' }}>
                    {selectedBooking.type === 'reuniao'
                      ? 'Reuniao Estrategica'
                      : selectedBooking.type === 'teste_anatomico'
                        ? 'Teste Anatomico'
                        : 'Sessao de Tatuagem'}
                  </h1>
                </div>
                {isBookingToday && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    HOJE
                  </span>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: easeOutQuint }}
              className="rounded-2xl p-6 mb-4 border"
              style={{ background: 'rgba(22, 18, 31, 0.6)', borderColor: 'rgba(255, 255, 255, 0.06)' }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139, 92, 255, 0.1)' }}>
                    <Calendar size={20} style={{ color: '#8B5CF6' }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: '#7A7489' }}>Data</p>
                    <p className="text-sm font-semibold" style={{ color: '#E8E4F0' }}>
                      {format(bookingDate, "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139, 92, 255, 0.1)' }}>
                    <Clock size={20} style={{ color: '#8B5CF6' }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: '#7A7489' }}>Horario</p>
                    <p className="text-sm font-semibold" style={{ color: '#E8E4F0' }}>{selectedBooking.time}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm capitalize" style={{ color: '#A9A3B8' }}>
                  {format(bookingDate, 'EEEE', { locale: ptBR })}
                  {isBookingPast && <span className="ml-2 text-xs" style={{ color: '#7A7489' }}>(passado)</span>}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: easeOutQuint }}
              className="rounded-2xl p-5 mb-4 border"
              style={{ background: 'rgba(22, 18, 31, 0.6)', borderColor: 'rgba(255, 255, 255, 0.06)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139, 92, 255, 0.1)' }}>
                  <MapPin size={20} style={{ color: '#8B5CF6' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#E8E4F0' }}>Kevin Hussein Tattoo Studio</p>
                  <p className="text-xs" style={{ color: '#7A7489' }}>Curitiba, PR</p>
                </div>
              </div>
            </motion.div>

            {selectedBooking.clientMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: easeOutQuint }}
                className="rounded-2xl p-5 mb-4 border"
                style={{ background: 'rgba(22, 18, 31, 0.6)', borderColor: 'rgba(255, 255, 255, 0.06)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139, 92, 255, 0.1)' }}>
                    <MessageSquare size={20} style={{ color: '#8B5CF6' }} />
                  </div>
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: '#7A7489' }}>Sua mensagem</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#A9A3B8' }}>{selectedBooking.clientMessage}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedBooking.adminNotes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: easeOutQuint }}
                className="rounded-2xl p-5 mb-4 border"
                style={{ background: 'rgba(139, 92, 255, 0.05)', borderColor: 'rgba(139, 92, 255, 0.15)' }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: '#8B5CF6' }}>Observacoes do estudio</p>
                <p className="text-sm leading-relaxed" style={{ color: '#A9A3B8' }}>{selectedBooking.adminNotes}</p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: easeOutQuint }}
              className="mt-8"
            >
              <a
                href="https://wa.me/5541996481275"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: 'rgba(139, 92, 255, 0.1)',
                  border: '1px solid rgba(139, 92, 255, 0.2)',
                  color: '#A855F7',
                }}
              >
                <Phone size={16} />
                Duvidas? Fale conosco
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  if (client) {
    const repConfig = getReputationConfig(client.reputation)
    const RepIcon = repConfig.icon

    return (
      <div className="min-h-[100dvh] relative" style={{ backgroundColor: '#050509' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[420px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(ellipse, #8B5CF6 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 pt-24 pb-16 px-5 sm:px-8">
          <div className="max-w-lg mx-auto">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={goToBookingChoice}
              className="flex items-center gap-2 text-sm mb-6 transition-colors duration-200"
              style={{ color: '#A9A3B8' }}
            >
              <ArrowLeft size={16} />
              Voltar para agendamentos
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOutQuint }}
              className="rounded-2xl p-6 mb-6 border"
              style={{
                background: 'linear-gradient(180deg, rgba(28, 23, 43, 0.86) 0%, rgba(22, 18, 31, 0.86) 100%)',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-xs uppercase tracking-widest" style={{ color: '#A855F7' }}>Conta do cliente</span>
                <span className="text-xs" style={{ color: '#9A94AE' }}>CPF {cpf}</span>
              </div>

              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 255, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)' }}>
                  <User size={26} style={{ color: '#A855F7' }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: '#E8E4F0' }}>{client.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <RepIcon size={14} className={repConfig.color} />
                    <span className={`text-xs font-medium ${repConfig.color}`}>{repConfig.label}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <div className="text-xl font-bold" style={{ color: '#E8E4F0' }}>{client.totalBookings}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: '#7A7489' }}>Total</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <div className="text-xl font-bold text-emerald-400">{client.completedBookings}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: '#7A7489' }}>Concluidos</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <div className="text-xl font-bold text-amber-400">{client.noShowCount}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: '#7A7489' }}>Faltas</div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#7A7489' }}>
                {bookings.length} agendamento{bookings.length !== 1 ? 's' : ''}
              </h3>

              <div className="space-y-3">
                {bookings.map((booking, index) => {
                  const statusCfg = getStatusConfig(booking.status)
                  const bookingDate = parseISO(booking.date)
                  const isBookingToday = isToday(bookingDate)

                  return (
                    <motion.button
                      key={booking.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 + index * 0.05, ease: easeOutQuint }}
                      onClick={() => setSelectedBooking(booking)}
                      className="w-full text-left rounded-2xl p-5 border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                      style={{ background: 'rgba(22, 18, 31, 0.6)', borderColor: 'rgba(255, 255, 255, 0.06)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${statusCfg.dot}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate" style={{ color: '#E8E4F0' }}>
                                {booking.type === 'reuniao'
                                  ? 'Reuniao Estrategica'
                                  : booking.type === 'teste_anatomico'
                                    ? 'Teste Anatomico'
                                    : 'Sessao de Tatuagem'}
                              </p>
                              {isBookingToday && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 shrink-0">HOJE</span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: '#7A7489' }}>
                              {format(bookingDate, 'dd MMM yyyy', { locale: ptBR })} · {booking.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${statusCfg.text}`}>
                            {statusCfg.label}
                          </span>
                          <ChevronRight size={16} style={{ color: '#4A4558' }} />
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center mt-10">
              <p className="text-sm" style={{ color: '#7A7489' }}>
                Duvidas?{' '}
                <a
                  href="https://wa.me/5541996481275"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors duration-200"
                  style={{ color: '#A855F7' }}
                >
                  Fale conosco
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-5" style={{ backgroundColor: '#050509' }}>
      <div className="max-w-md text-center">
        <h2 className="text-xl font-bold mb-2" style={{ color: '#E8E4F0' }}>
          Nao encontramos seu historico
        </h2>
        <p className="text-sm mb-8" style={{ color: '#7A7489' }}>
          Valide seu CPF novamente para consultar os agendamentos.
        </p>
        <Link
          to="/agendar#cliente-login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)', color: '#FFFFFF' }}
        >
          <Calendar size={16} />
          Voltar para agendar
        </Link>
      </div>
    </div>
  )
}
