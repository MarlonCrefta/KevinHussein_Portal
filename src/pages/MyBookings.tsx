import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, User, Calendar, Clock, AlertCircle, CheckCircle, 
  XCircle, ArrowLeft, MapPin, Phone, MessageSquare,
  Sparkles, ChevronRight, Star, Shield
} from 'lucide-react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { bookingsApi, Booking, Client } from '../services/api'

// Validação de CPF
function validateCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '')
  if (cleanCpf.length !== 11) return false
  if (/^(\d)\1+$/.test(cleanCpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCpf[10])) return false

  return true
}

const easeOutQuint = [0.22, 1, 0.36, 1]

export default function MyBookings() {
  const [cpf, setCpf] = useState('')
  const [cpfError, setCpfError] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [searched, setSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cleanValue = value.replace(/\D/g, '')
    
    let maskedValue = cleanValue
    if (cleanValue.length <= 11) {
      maskedValue = cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    
    setCpf(maskedValue)
    setCpfError('')
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setCpfError('')
    
    const cleanCpf = cpf.replace(/\D/g, '')
    
    if (!validateCPF(cleanCpf)) {
      setCpfError('CPF inválido')
      setIsLoading(false)
      return
    }

    try {
      const response = await bookingsApi.getByCpf(cleanCpf)
      if (response.success) {
        setBookings(response.data.bookings)
        setClient(response.data.client)
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error)
      setBookings([])
      setClient(null)
    } finally {
      setSearched(true)
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setSearched(false)
    setSelectedBooking(null)
    setBookings([])
    setClient(null)
    setCpf('')
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; border: string; icon: typeof Clock; label: string; dot: string }> = {
      pendente: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Clock, label: 'Pendente', dot: 'bg-amber-400' },
      confirmado: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: CheckCircle, label: 'Confirmado', dot: 'bg-emerald-400' },
      cancelado: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: XCircle, label: 'Cancelado', dot: 'bg-red-400' },
      concluido: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', icon: CheckCircle, label: 'Concluído', dot: 'bg-violet-400' },
      nao_compareceu: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: AlertCircle, label: 'Não Compareceu', dot: 'bg-orange-400' },
    }
    return configs[status] || configs.pendente
  }

  const getReputationConfig = (rep: string) => {
    const configs: Record<string, { icon: typeof Star; label: string; color: string; bg: string }> = {
      neutro: { icon: Star, label: 'Cliente Novo', color: 'text-violet-400', bg: 'bg-violet-500/10' },
      boa: { icon: Shield, label: 'Cliente Regular', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      alta: { icon: Sparkles, label: 'Cliente VIP', color: 'text-amber-400', bg: 'bg-amber-500/10' },
      baixa: { icon: AlertCircle, label: 'Em Alerta', color: 'text-red-400', bg: 'bg-red-500/10' },
    }
    return configs[rep] || configs.neutro
  }

  // ════════════════════════════════════════════════════════════
  // TELA DE DETALHE DO AGENDAMENTO
  // ════════════════════════════════════════════════════════════
  if (selectedBooking) {
    const status = getStatusConfig(selectedBooking.status)
    const StatusIcon = status.icon
    const bookingDate = parseISO(selectedBooking.date)
    const isBookingPast = isPast(bookingDate) && !isToday(bookingDate)
    const isBookingToday = isToday(bookingDate)

    return (
      <div className="min-h-[100dvh] relative" style={{ backgroundColor: '#050509' }}>
        {/* Glow sutil */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(ellipse, #8B5CF6 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 pt-24 pb-16 px-5 sm:px-8">
          <div className="max-w-lg mx-auto">
            {/* Back */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="flex items-center gap-2 text-sm mb-8 transition-colors duration-200"
              style={{ color: '#A9A3B8' }}
            >
              <ArrowLeft size={16} />
              Voltar aos agendamentos
            </motion.button>

            {/* Status Banner */}
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
                  <span className={`text-xs font-semibold uppercase tracking-wider ${status.text}`}>
                    {status.label}
                  </span>
                  <h1 className="text-xl font-bold mt-1" style={{ color: '#E8E4F0' }}>
                    {selectedBooking.type === 'reuniao' ? 'Reunião Estratégica' : selectedBooking.type === 'teste_anatomico' ? 'Teste Anatômico' : 'Sessão de Tatuagem'}
                  </h1>
                </div>
                {isBookingToday && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    HOJE
                  </span>
                )}
              </div>
            </motion.div>

            {/* Data e Hora */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: easeOutQuint }}
              className="rounded-2xl p-6 mb-4 border"
              style={{ 
                background: 'rgba(22, 18, 31, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.06)',
              }}
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
                    <p className="text-xs" style={{ color: '#7A7489' }}>Horário</p>
                    <p className="text-sm font-semibold" style={{ color: '#E8E4F0' }}>
                      {selectedBooking.time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dia da semana */}
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm capitalize" style={{ color: '#A9A3B8' }}>
                  {format(bookingDate, "EEEE", { locale: ptBR })}
                  {isBookingPast && <span className="ml-2 text-xs" style={{ color: '#7A7489' }}>(passado)</span>}
                </p>
              </div>
            </motion.div>

            {/* Local */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: easeOutQuint }}
              className="rounded-2xl p-5 mb-4 border"
              style={{ 
                background: 'rgba(22, 18, 31, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.06)',
              }}
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

            {/* Mensagem do cliente */}
            {selectedBooking.clientMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: easeOutQuint }}
                className="rounded-2xl p-5 mb-4 border"
                style={{ 
                  background: 'rgba(22, 18, 31, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139, 92, 255, 0.1)' }}>
                    <MessageSquare size={20} style={{ color: '#8B5CF6' }} />
                  </div>
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: '#7A7489' }}>Sua mensagem</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#A9A3B8' }}>
                      {selectedBooking.clientMessage}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Observações do estúdio */}
            {selectedBooking.adminNotes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: easeOutQuint }}
                className="rounded-2xl p-5 mb-4 border"
                style={{ 
                  background: 'rgba(139, 92, 255, 0.05)',
                  borderColor: 'rgba(139, 92, 255, 0.15)',
                }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: '#8B5CF6' }}>Observações do estúdio</p>
                <p className="text-sm leading-relaxed" style={{ color: '#A9A3B8' }}>
                  {selectedBooking.adminNotes}
                </p>
              </motion.div>
            )}

            {/* ID e data de criação */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center mt-8 space-y-1"
            >
              <p className="text-xs" style={{ color: '#4A4558' }}>
                ID: {selectedBooking.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs" style={{ color: '#4A4558' }}>
                Criado em {format(parseISO(selectedBooking.createdAt), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </motion.div>

            {/* Contato */}
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
                Dúvidas? Fale conosco
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // TELA DE RESULTADOS (lista de agendamentos)
  // ════════════════════════════════════════════════════════════
  if (searched && client) {
    const repConfig = getReputationConfig(client.reputation)
    const RepIcon = repConfig.icon

    return (
      <div className="min-h-[100dvh] relative" style={{ backgroundColor: '#050509' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(ellipse, #8B5CF6 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 pt-24 pb-16 px-5 sm:px-8">
          <div className="max-w-lg mx-auto">
            {/* Back */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBack}
              className="flex items-center gap-2 text-sm mb-8 transition-colors duration-200"
              style={{ color: '#A9A3B8' }}
            >
              <ArrowLeft size={16} />
              Nova consulta
            </motion.button>

            {/* Client Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOutQuint }}
              className="rounded-2xl p-6 mb-6 border"
              style={{ 
                background: 'rgba(22, 18, 31, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(139, 92, 255, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)' }}>
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

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <div className="text-xl font-bold" style={{ color: '#E8E4F0' }}>{client.totalBookings}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: '#7A7489' }}>Total</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <div className="text-xl font-bold text-emerald-400">{client.completedBookings}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: '#7A7489' }}>Concluídos</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <div className="text-xl font-bold text-amber-400">{client.noShowCount}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: '#7A7489' }}>Faltas</div>
                </div>
              </div>
            </motion.div>

            {/* Bookings */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
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
                      style={{ 
                        background: 'rgba(22, 18, 31, 0.6)',
                        borderColor: 'rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${statusCfg.dot}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate" style={{ color: '#E8E4F0' }}>
                                {booking.type === 'reuniao' ? 'Reunião Estratégica' : booking.type === 'teste_anatomico' ? 'Teste Anatômico' : 'Sessão de Tatuagem'}
                              </p>
                              {isBookingToday && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 shrink-0">
                                  HOJE
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: '#7A7489' }}>
                              {format(bookingDate, "dd MMM yyyy", { locale: ptBR })} · {booking.time}
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

            {/* Contato */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-10"
            >
              <p className="text-sm" style={{ color: '#7A7489' }}>
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
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // TELA DE RESULTADOS (sem agendamentos)
  // ════════════════════════════════════════════════════════════
  if (searched && !client) {
    return (
      <div className="min-h-[100dvh] relative" style={{ backgroundColor: '#050509' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(ellipse, #8B5CF6 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 pt-24 pb-16 px-5 sm:px-8">
          <div className="max-w-md mx-auto text-center">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBack}
              className="flex items-center gap-2 text-sm mb-12 transition-colors duration-200"
              style={{ color: '#A9A3B8' }}
            >
              <ArrowLeft size={16} />
              Voltar
            </motion.button>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: easeOutQuint }}
            >
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(139, 92, 255, 0.1)' }}>
                <Search size={36} style={{ color: '#7A7489' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#E8E4F0' }}>
                Nenhum agendamento encontrado
              </h2>
              <p className="text-sm mb-8" style={{ color: '#7A7489' }}>
                Não encontramos agendamentos para este CPF.
              </p>
              <Link
                to="/agendar"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                  color: '#FFFFFF',
                }}
              >
                <Calendar size={16} />
                Agendar reunião
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // TELA PRINCIPAL — Campo CPF (tela única)
  // ════════════════════════════════════════════════════════════
  return (
    <div className="min-h-[100dvh] flex flex-col relative" style={{ backgroundColor: '#050509' }}>
      {/* Glow sutil no topo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(ellipse, #8B5CF6 0%, transparent 70%)' }} />
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10 px-5 sm:px-8">
        <div className="w-full max-w-md">
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
              className="w-16 h-16 object-contain"
              style={{ filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.3))' }}
            />
          </motion.div>

          {/* Card principal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutQuint }}
            className="rounded-3xl p-8 border"
            style={{
              background: 'rgba(22, 18, 31, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Ícone */}
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(139, 92, 255, 0.15)' }}
              >
                <Search size={22} style={{ color: '#A855F7' }} />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: '#E8E4F0' }}>
                  Já é cliente?
                </h1>
                <p className="text-sm" style={{ color: '#7A7489' }}>
                  Consulte seus agendamentos pelo CPF.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSearch}>
              <div className="relative mb-4">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#4A4558' }} />
                <input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-sm transition-all duration-200 focus:outline-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: cpfError 
                      ? '1px solid rgba(239, 68, 68, 0.4)' 
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#E8E4F0',
                  }}
                />
              </div>

              {cpfError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mb-3 flex items-center gap-1"
                >
                  <AlertCircle size={12} />
                  {cpfError}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading || cpf.replace(/\D/g, '').length < 11}
                className="w-full py-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(168, 85, 247, 0.9) 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 0 30px rgba(139, 92, 246, 0.25)',
                }}
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Search size={16} />
                    Consultar
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Link de contato */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
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
    </div>
  )
}
