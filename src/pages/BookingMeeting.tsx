import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, Calendar, User, Phone, Mail, MessageSquare, Check, ArrowLeft, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfToday, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import BaroqueModernBackground from '../components/ui/BaroqueModernBackground'
import { Link } from 'react-router-dom'
import { slotsApi, bookingsApi, clientsApi, Slot, Client, Booking } from '../services/api'

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

function getReputationLabel(reputation: string): string {
  const labels: Record<string, string> = {
    neutro: 'Cliente Novo',
    boa: 'Cliente Regular',
    alta: 'Cliente VIP',
    baixa: 'Cliente em Alerta',
  }
  return labels[reputation] || 'Cliente Novo'
}

function getReputationColor(reputation: string): string {
  const colors: Record<string, string> = {
    neutro: 'text-blue-400',
    boa: 'text-green-400',
    alta: 'text-amber-400',
    baixa: 'text-red-400',
  }
  return colors[reputation] || 'text-blue-400'
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type Step = 'date' | 'time' | 'form' | 'confirm'

interface FormData {
  name: string
  phone: string
  email: string
  cpf: string
  message: string
}

export default function BookingMeeting() {
  const [currentStep, setCurrentStep] = useState<Step>('date')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([])
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    cpf: '',
    message: ''
  })
  const [cpfError, setCpfError] = useState<string>('')
  const [phoneError, setPhoneError] = useState<string>('')
  const [clientHistory, setClientHistory] = useState<Client | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [existingBookings, setExistingBookings] = useState<Booking[]>([])
  const [showExistingBooking, setShowExistingBooking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  // Carregar datas disponíveis
  useEffect(() => {
    async function loadSlots() {
      try {
        // Filtrar apenas slots do tipo 'reuniao'
        const response = await slotsApi.list({ available: true, type: 'reuniao' })
        if (response.success) {
          const dates = new Set(response.data.map(slot => slot.date))
          setAvailableDates(dates)
        }
      } catch (error) {
        console.error('Erro ao carregar slots:', error)
      }
    }
    loadSlots()
  }, [])

  // Carregar horários disponíveis quando data é selecionada
  useEffect(() => {
    if (selectedDate) {
      async function loadSlotsForDate() {
        try {
          const dateStr = format(selectedDate!, 'yyyy-MM-dd')
          // Filtrar apenas slots do tipo 'reuniao'
          const response = await slotsApi.getAvailable(dateStr, 'reuniao')
          if (response.success) {
            setAvailableSlots(response.data.sort((a, b) => a.time.localeCompare(b.time)))
          }
        } catch (error) {
          console.error('Erro ao carregar horários:', error)
        }
      }
      loadSlotsForDate()
    }
  }, [selectedDate])

  const today = startOfToday()
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const startPadding = getDay(monthStart)
  const paddedDays = [...Array(startPadding).fill(null), ...days]

  const handleDateSelect = (date: Date) => {
    if (isBefore(date, today)) return
    const dateStr = format(date, 'yyyy-MM-dd')
    if (!availableDates.has(dateStr)) return
    setSelectedDate(date)
    setCurrentStep('time')
  }

  const handleTimeSelect = (time: string) => {
    if (!selectedDate) return
    
    const slot = availableSlots.find(s => s.time === time)
    
    if (slot) {
      setSelectedTime(time)
      setSelectedSlotId(slot.id)
      setCurrentStep('form')
    }
  }

  const handleFormChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'phone') {
      // Aplicar máscara de telefone brasileiro (XX) XXXXX-XXXX
      const cleanValue = value.replace(/\D/g, '')
      if (cleanValue.length <= 11) {
        let maskedValue = cleanValue
        if (cleanValue.length > 2) {
          maskedValue = `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`
        }
        if (cleanValue.length > 7) {
          maskedValue = `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7)}`
        }
        setFormData(prev => ({ ...prev, phone: maskedValue }))
        
        // Validar telefone
        if (cleanValue.length === 11) {
          setPhoneError('')
        } else if (cleanValue.length > 0) {
          setPhoneError('Digite os 11 dígitos do telefone')
        } else {
          setPhoneError('')
        }
      }
      return
    }
    
    if (name === 'cpf') {
      // Aplicar máscara de CPF
      const cleanValue = value.replace(/\D/g, '')
      let maskedValue = cleanValue
      
      if (cleanValue.length <= 11) {
        maskedValue = cleanValue
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      }
      
      setFormData(prev => ({ ...prev, cpf: maskedValue }))
      setCpfError('')
      
      // Buscar histórico quando CPF estiver completo
      if (cleanValue.length === 11) {
        const isValid = validateCPF(cleanValue)
        if (isValid) {
          try {
            // Buscar cliente e agendamentos existentes
            const [clientResponse, bookingsResponse] = await Promise.all([
              clientsApi.findByCpf(cleanValue).catch(() => null),
              bookingsApi.getByCpf(cleanValue).catch(() => null)
            ])
            
            if (clientResponse?.success) {
              setClientHistory(clientResponse.data)
              setShowHistory(true)
            } else {
              setClientHistory(null)
              setShowHistory(false)
            }
            
            // Verificar se tem reunião pendente ou confirmada
            if (bookingsResponse?.success && bookingsResponse.data.bookings) {
              const activeBookings = bookingsResponse.data.bookings.filter(
                (b: Booking) => b.type === 'reuniao' && ['pendente', 'confirmado'].includes(b.status)
              )
              if (activeBookings.length > 0) {
                setExistingBookings(activeBookings)
                setShowExistingBooking(true)
              } else {
                setExistingBookings([])
                setShowExistingBooking(false)
              }
            }
          } catch {
            // Cliente não encontrado - é um cliente novo
            setClientHistory(null)
            setShowHistory(false)
            setExistingBookings([])
            setShowExistingBooking(false)
          }
        } else {
          setCpfError('CPF inválido')
          setClientHistory(null)
          setShowHistory(false)
          setExistingBookings([])
          setShowExistingBooking(false)
        }
      } else {
        setClientHistory(null)
        setShowHistory(false)
        setExistingBookings([])
        setShowExistingBooking(false)
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Validação do formulário em tempo real
  const isFormValid = () => {
    const cleanPhone = formData.phone.replace(/\D/g, '')
    const cleanCpf = formData.cpf.replace(/\D/g, '')
    
    return (
      formData.name.trim().length >= 2 &&
      cleanPhone.length === 11 &&
      formData.email.includes('@') &&
      formData.email.includes('.') &&
      cleanCpf.length === 11 &&
      validateCPF(cleanCpf) &&
      !cpfError &&
      !phoneError
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    
    // Validar CPF antes de submeter
    const cleanCpf = formData.cpf.replace(/\D/g, '')
    const cleanPhone = formData.phone.replace(/\D/g, '')
    
    if (!validateCPF(cleanCpf)) {
      setCpfError('Por favor, insira um CPF válido')
      return
    }
    
    if (cleanPhone.length !== 11) {
      setPhoneError('Telefone inválido')
      return
    }
    
    // Criar agendamento
    if (selectedDate && selectedTime && selectedSlotId) {
      setIsLoading(true)
      try {
        await bookingsApi.create({
          type: 'reuniao',
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          clientName: formData.name.trim(),
          clientEmail: formData.email.trim(),
          clientPhone: cleanPhone,
          clientCpf: cleanCpf,
          clientMessage: formData.message.trim()
        })
        
        setCurrentStep('confirm')
      } catch (error: any) {
        console.error('Erro ao criar agendamento:', error)
        setSubmitError(error.message || 'Erro ao criar agendamento. Tente novamente.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const goBack = () => {
    if (currentStep === 'time') setCurrentStep('date')
    else if (currentStep === 'form') setCurrentStep('time')
  }

  const steps = [
    { id: 'date', label: 'Data', icon: Calendar },
    { id: 'time', label: 'Horário', icon: Clock },
    { id: 'form', label: 'Dados', icon: User },
    { id: 'confirm', label: 'Confirmação', icon: Check },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="min-h-[100dvh] pt-24 pb-16 px-6 sm:px-8 lg:px-12 relative">
      <BaroqueModernBackground variant="section" />
      <div className="max-w-lg mx-auto relative z-20">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <Link 
            to="/agendar" 
            className="inline-flex items-center gap-2 text-bone-muted hover:text-neon transition-colors duration-200 text-sm"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <img 
            src="/LOGO SEM FUNDO.png" 
            alt="Kevin Hussein Tattoo" 
            className="w-14 h-14 object-contain mx-auto mb-4"
            style={{ filter: 'drop-shadow(0 0 12px rgba(139, 92, 246, 0.3))' }}
          />
          <span className="inline-block px-4 py-1.5 rounded-full bg-neon-muted text-neon text-xs font-medium mb-4 tracking-wide">
            1ª Etapa — Quartas-feiras
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-bone mb-2 tracking-tight">
            Reunião Estratégica
          </h1>
          <p className="text-bone-muted text-sm">
            Duração: 2 horas · Horários: 10h, 12h, 14h, 16h, 18h
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300
                  ${index <= currentStepIndex 
                    ? 'bg-neon-muted text-neon' 
                    : 'bg-graphite-light text-bone-faded'
                  }
                `}>
                  <step.icon size={16} />
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-8 h-0.5 mx-1 transition-colors duration-300
                    ${index < currentStepIndex ? 'bg-neon/50' : 'bg-bone/10'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Date Selection */}
          {currentStep === 'date' && (
            <motion.div
              key="date"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl bg-graphite-light/50 border border-bone/8 p-5 sm:p-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 rounded-lg bg-graphite-light hover:bg-graphite-light/80 transition-colors duration-200"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft size={20} className="text-bone-muted" />
                  </button>
                  <h2 className="text-lg font-semibold text-bone capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </h2>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 rounded-lg bg-graphite-light hover:bg-graphite-light/80 transition-colors duration-200"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight size={20} className="text-bone-muted" />
                  </button>
                </div>

                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-bone-muted text-xs font-medium py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Info: Quartas-feiras */}
                <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                  <p className="text-xs text-center" style={{ color: '#A9A3B8' }}>
                    <span style={{ color: '#A855F7' }}>●</span> Reuniões disponíveis apenas às <strong style={{ color: '#C4B5FD' }}>quartas-feiras</strong>
                  </p>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {paddedDays.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="aspect-square" />
                    }

                    const dateStr = format(day, 'yyyy-MM-dd')
                    const hasSlots = availableDates.has(dateStr)
                    const isWednesday = getDay(day) === 3
                    const isDisabled = isBefore(day, today) || !hasSlots
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isTodayDate = isToday(day)
                    const isCurrentMonth = isSameMonth(day, currentMonth)

                    return (
                      <motion.button
                        key={day.toISOString()}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDateSelect(day)}
                        disabled={isDisabled}
                        className={`
                          aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium
                          transition-all duration-200 relative
                          ${isDisabled 
                            ? isWednesday && isCurrentMonth && !isBefore(day, today)
                              ? 'text-bone-faded/50 cursor-not-allowed bg-neon/5 border border-neon/10'
                              : 'text-bone-faded/40 cursor-not-allowed bg-graphite/20' 
                            : isSelected
                              ? 'bg-neon text-obsidian shadow-lg shadow-neon/30 ring-2 ring-neon/50'
                              : hasSlots
                                ? 'bg-neon/10 text-bone border border-neon/30 hover:bg-neon/20 hover:border-neon/50 hover:shadow-md hover:shadow-neon/20'
                                : isTodayDate
                                  ? 'bg-graphite-light text-bone border border-bone/10'
                                  : isCurrentMonth
                                    ? 'text-bone-muted hover:bg-graphite-light/30 border border-transparent'
                                    : 'text-bone-faded/30 border border-transparent'
                          }
                        `}
                      >
                        <span className={hasSlots && !isSelected ? 'font-semibold' : ''}>{format(day, 'd')}</span>
                        {hasSlots && !isSelected && (
                          <span className="absolute bottom-1 flex gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-neon animate-pulse" />
                            <span className="w-1 h-1 rounded-full bg-neon animate-pulse" style={{ animationDelay: '0.2s' }} />
                          </span>
                        )}
                        {isTodayDate && !isSelected && !hasSlots && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-bone/40" />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Time Selection */}
          {currentStep === 'time' && (
            <motion.div
              key="time"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl bg-graphite-light/50 border border-bone/8 p-5 sm:p-6">
                {/* Header with Back */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={goBack}
                    className="p-2 rounded-lg bg-graphite-light hover:bg-graphite-light/80 transition-colors duration-200"
                    aria-label="Voltar"
                  >
                    <ChevronLeft size={20} className="text-bone-muted" />
                  </button>
                  <div>
                    <h2 className="text-lg font-semibold text-bone">
                      Horários disponíveis
                    </h2>
                    <p className="text-bone-muted text-sm">
                      {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {/* Time Slots Grid */}
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableSlots.map((slot) => (
                      <motion.button
                        key={slot.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTimeSelect(slot.time)}
                        className={`
                          py-4 px-4 rounded-xl text-center font-medium transition-all duration-200
                          ${selectedTime === slot.time
                            ? 'bg-neon text-obsidian'
                            : 'bg-graphite-light hover:bg-graphite-light/80 text-bone-muted'
                          }
                        `}
                      >
                        <Clock size={18} className="mx-auto mb-1.5 opacity-60" />
                        {slot.time}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle size={48} className="mx-auto mb-4 text-bone-faded" />
                    <p className="text-bone-muted mb-2">Nenhum horário disponível</p>
                    <p className="text-bone-muted text-sm">Escolha outra data ou aguarde novos horários</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Form */}
          {currentStep === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl bg-graphite-light/50 border border-bone/8 p-5 sm:p-6">
                {/* Header with Back */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={goBack}
                    className="p-2 rounded-lg bg-graphite-light hover:bg-graphite-light/80 transition-colors duration-200"
                    aria-label="Voltar"
                  >
                    <ChevronLeft size={20} className="text-bone-muted" />
                  </button>
                  <div>
                    <h2 className="text-lg font-semibold text-bone">
                      Seus dados
                    </h2>
                    <p className="text-bone-muted text-sm">
                      {selectedDate && format(selectedDate, "d/MM", { locale: ptBR })} às {selectedTime}
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-bone-muted text-sm mb-2">
                      Nome completo <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone-faded pointer-events-none z-10" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        required
                        autoComplete="name"
                        placeholder="Seu nome"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-graphite border border-bone/10 text-bone placeholder:text-bone-faded/50 focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-all duration-200"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-bone-muted text-sm mb-2">
                      WhatsApp <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone-faded pointer-events-none z-10" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        required
                        autoComplete="tel"
                        placeholder="(41) 99999-9999"
                        className={`w-full pl-12 pr-4 py-3 rounded-xl bg-graphite border text-bone placeholder:text-bone-faded/50 focus:outline-none focus:ring-1 transition-all duration-200 ${
                          phoneError 
                            ? 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20' 
                            : 'border-bone/10 focus:border-neon/40 focus:ring-neon/20'
                        }`}
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    {phoneError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
                      >
                        <AlertCircle size={12} />
                        {phoneError}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-bone-muted text-sm mb-2">
                      E-mail <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone-faded pointer-events-none z-10" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        required
                        autoComplete="email"
                        placeholder="seu@email.com"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-graphite border border-bone/10 text-bone placeholder:text-bone-faded/50 focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-all duration-200"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cpf" className="block text-bone-muted text-sm mb-2">
                      CPF <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone-faded pointer-events-none z-10" />
                      <input
                        type="text"
                        id="cpf"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleFormChange}
                        required
                        autoComplete="off"
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl bg-graphite border text-bone placeholder:text-bone-faded/50 focus:outline-none focus:ring-1 transition-all duration-200 ${
                          cpfError 
                            ? 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20' 
                            : 'border-bone/10 focus:border-neon/40 focus:ring-neon/20'
                        }`}
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    {cpfError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
                      >
                        <AlertCircle size={12} />
                        {cpfError}
                      </motion.p>
                    )}
                    {showHistory && clientHistory && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 rounded-lg bg-graphite border border-bone/10"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={14} className={getReputationColor(clientHistory.reputation)} />
                          <span className="text-sm font-medium text-bone">
                            {getReputationLabel(clientHistory.reputation)}
                          </span>
                        </div>
                        <div className="text-xs text-bone-muted space-y-1">
                          <p>• {clientHistory.totalBookings} agendamento(s) total</p>
                          <p>• {clientHistory.completedBookings} concluído(s)</p>
                          {clientHistory.noShowCount > 0 && (
                            <p className="text-yellow-400">• {clientHistory.noShowCount} não comparecimento(s)</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                    {showHistory && !clientHistory && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-blue-400 text-xs mt-1.5 flex items-center gap-1"
                      >
                        <CheckCircle size={12} />
                        Novo cliente - Seja bem-vindo!
                      </motion.p>
                    )}
                    
                    {/* Mostrar reunião existente */}
                    {showExistingBooking && existingBookings.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-4 rounded-xl bg-neon/10 border border-neon/30"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar size={16} className="text-neon" />
                          <span className="text-sm font-semibold text-neon">
                            Você já tem uma reunião agendada!
                          </span>
                        </div>
                        {existingBookings.map((booking) => (
                          <div key={booking.id} className="bg-graphite/50 rounded-lg p-3 mb-2 last:mb-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                booking.status === 'confirmado' 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {booking.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-bone">
                                <Calendar size={14} className="text-bone-muted" />
                                {format(new Date(booking.date + 'T00:00:00'), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </div>
                              <div className="flex items-center gap-2 text-bone">
                                <Clock size={14} className="text-bone-muted" />
                                {booking.time}
                              </div>
                            </div>
                          </div>
                        ))}
                        <p className="text-xs text-bone-muted mt-3">
                          Se precisar reagendar, entre em contato pelo WhatsApp.
                        </p>
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-bone-muted text-sm mb-2">
                      Sobre sua ideia <span className="text-emerald-400 text-xs">(opcional)</span>
                    </label>
                    <div className="relative">
                      <MessageSquare size={18} className="absolute left-4 top-4 text-bone-faded pointer-events-none z-10" />
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleFormChange}
                        rows={3}
                        placeholder="Descreva brevemente..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-graphite border border-bone/10 text-bone placeholder:text-bone-faded/50 focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-all duration-200 resize-none"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>

                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2"
                    >
                      <AlertCircle size={16} />
                      {submitError}
                    </motion.div>
                  )}

                  {/* Botão só aparece quando formulário válido */}
                  <AnimatePresence>
                    {isFormValid() ? (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 mt-6 text-base font-semibold text-white bg-neon hover:bg-neon/90 active:bg-neon/80 rounded-xl transition-colors duration-200 shadow-neon disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            Confirmar agendamento
                            <Check size={18} />
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 p-4 rounded-xl bg-graphite-light border border-bone/10 text-center"
                      >
                        <p className="text-bone-muted text-sm">
                          Preencha todos os campos obrigatórios corretamente para continuar
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="rounded-2xl bg-graphite-light/50 border border-bone/10 p-6 sm:p-8 text-center">
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-full bg-neon flex items-center justify-center shadow-neon"
                >
                  <Check size={32} className="text-white" />
                </motion.div>

                <h2 className="text-2xl font-semibold text-bone mb-2">
                  Agendamento confirmado!
                </h2>
                <p className="text-bone-muted mb-8">
                  Você receberá uma confirmação por e-mail e WhatsApp.
                </p>

                {/* Summary */}
                <div className="rounded-xl bg-graphite border border-bone/10 p-4 text-left mb-8 max-w-xs mx-auto">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-neon" />
                      <span className="text-bone-muted text-sm">
                        {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-neon" />
                      <span className="text-bone-muted text-sm">{selectedTime}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-neon" />
                      <span className="text-bone-muted text-sm">{formData.name}</span>
                    </div>
                  </div>
                </div>

                {/* Aviso de não comparecimento */}
                <div className="max-w-xs mx-auto mb-6 px-4 py-3 rounded-xl bg-neon-muted border border-neon/20">
                  <p className="text-bone-faded text-xs leading-relaxed text-center">
                    Em caso de não comparecimento sem aviso prévio, o próximo agendamento poderá estar sujeito à cobrança antecipada.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link 
                    to="/"
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-bone-muted hover:text-bone bg-graphite-light hover:bg-graphite border border-bone/10 hover:border-bone/20 rounded-full transition-all duration-200"
                  >
                    Voltar ao início
                  </Link>
                  <Link 
                    to="/meus-agendamentos"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-neon hover:bg-neon/80 rounded-full transition-all duration-200 shadow-neon"
                  >
                    <Calendar size={16} />
                    Ver meus agendamentos
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
