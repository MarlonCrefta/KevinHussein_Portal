import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MessageSquare,
  CheckCircle,
  XCircle,
  Ban,
  Clock3,
  Save,
  Trash2,
  Edit3,
  CreditCard,
  Award,
  TrendingUp,
  ExternalLink,
  Send,
  Check,
  Plus,
  X,
  CalendarPlus,
  UserPlus
} from 'lucide-react'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useBookings } from '../../hooks'
import { Booking, Client, clientsApi, messagesApi, bookingsApi } from '../../services/api'
import reputationService from '../../services/reputationService'

type BookingStatus = 'pendente' | 'confirmado' | 'cancelado' | 'concluido' | 'nao_compareceu'

const statusOptions: { value: BookingStatus; label: string; icon: any; color: string }[] = [
  { value: 'pendente', label: 'Pendente', icon: Clock3, color: 'text-amber-600' },
  { value: 'confirmado', label: 'Confirmado', icon: CheckCircle, color: 'text-emerald-600' },
  { value: 'concluido', label: 'Concluído', icon: CheckCircle, color: 'text-blue-600' },
  { value: 'cancelado', label: 'Cancelado', icon: XCircle, color: 'text-red-600' },
  { value: 'nao_compareceu', label: 'Não compareceu', icon: Ban, color: 'text-orange-600' },
]

const defaultTimeSlots = ['10:00', '12:00', '14:00', '16:00', '18:00']

const bookingTypeConfig: Record<string, {
  label: string; gradient: string; bg: string; bgIcon: string; color: string;
  ringColor: string; btnColor: string; successLabel: string; successMsg: string;
}> = {
  reuniao: {
    label: 'Agendar Reunião', gradient: 'from-violet-50 to-white', bg: 'bg-violet-50 border-violet-200',
    bgIcon: 'bg-violet-100', color: 'text-violet-600', ringColor: 'focus:ring-violet-500 focus:border-violet-500',
    btnColor: 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/30',
    successLabel: 'Reunião Agendada!', successMsg: 'A reunião foi agendada com sucesso.',
  },
  teste_anatomico: {
    label: 'Agendar Teste Anatômico', gradient: 'from-amber-50 to-white', bg: 'bg-amber-50 border-amber-200',
    bgIcon: 'bg-amber-100', color: 'text-amber-600', ringColor: 'focus:ring-amber-500 focus:border-amber-500',
    btnColor: 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/30',
    successLabel: 'Teste Anatômico Agendado!', successMsg: 'O teste anatômico foi agendado com sucesso.',
  },
  sessao: {
    label: 'Agendar Sessão', gradient: 'from-cyan-50 to-white', bg: 'bg-cyan-50 border-cyan-200',
    bgIcon: 'bg-cyan-100', color: 'text-cyan-600', ringColor: 'focus:ring-cyan-500 focus:border-cyan-500',
    btnColor: 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-600/30',
    successLabel: 'Sessão Agendada!', successMsg: 'A sessão de tatuagem foi agendada com sucesso.',
  },
}

export default function AdminBookingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getById, updateStatus, updateBooking, deleteBooking } = useBookings()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>('pendente')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientData, setClientData] = useState<Client | null>(null)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoadingBooking, setIsLoadingBooking] = useState(true)

  // Modal de novo agendamento
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [newBookingType, setNewBookingType] = useState<'reuniao' | 'teste_anatomico' | 'sessao'>('sessao')
  const [newBookingDate, setNewBookingDate] = useState('')
  const [newBookingTime, setNewBookingTime] = useState('')
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  const [bookingCreatedSuccess, setBookingCreatedSuccess] = useState(false)

  useEffect(() => {
    const loadBooking = async () => {
      if (id) {
        setIsLoadingBooking(true)
        setLoadError(null)
        try {
          const data = await getById(id)
          if (data) {
            setBooking(data)
            setNotes(data.notes || '')
            setSelectedStatus(data.status as BookingStatus)
            
            // Tentar encontrar o cliente pelo CPF ou telefone
            try {
              if (data.clientCpf) {
                const clientRes = await clientsApi.findByCpf(data.clientCpf)
                if (clientRes.success && clientRes.data) {
                  setClientId(clientRes.data.id)
                  setClientData(clientRes.data)
                }
              } else if (data.clientPhone) {
                const clientRes = await clientsApi.findByPhone(data.clientPhone)
                if (clientRes.success && clientRes.data) {
                  setClientId(clientRes.data.id)
                  setClientData(clientRes.data)
                }
              }
            } catch (err) {
              // Cliente não encontrado, não é um erro crítico
            }
          } else {
            setLoadError('Agendamento não encontrado')
          }
        } catch (err: any) {
          console.error('Erro ao carregar agendamento:', err)
          setLoadError(err.message || 'Erro ao carregar agendamento')
        } finally {
          setIsLoadingBooking(false)
        }
      }
    }
    loadBooking()
  }, [id, getById])

  const handleSendWhatsApp = async () => {
    if (!booking) return
    
    setIsSendingMessage(true)
    try {
      // Usar template de lembrete configurado
      const templateType = 'reminder'
      const formattedDate = format(parseISO(booking.date), "d 'de' MMMM", { locale: ptBR })
      const bookingTypeLabel = booking.type === 'reuniao' ? 'Reunião' : booking.type === 'teste_anatomico' ? 'Teste Anatômico' : booking.type === 'sessao' ? 'Sessão' : 'Retoque'
      
      await messagesApi.sendWithTemplate(templateType, booking.clientPhone, {
        id: booking.id,
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        clientEmail: booking.clientEmail,
        date: formattedDate,
        time: booking.time,
        type: bookingTypeLabel,
        clientMessage: booking.clientMessage || '',
      })
      
      setMessageSent(true)
      setTimeout(() => setMessageSent(false), 3000)
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
      // Fallback: abrir WhatsApp Web
      const phone = booking.clientPhone.replace(/\D/g, '')
      const message = encodeURIComponent(`Olá ${booking.clientName}! Aqui é do Kevin Hussein Tattoo Studio.`)
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (!booking) return
    
    setIsSaving(true)
    const success = await updateStatus(booking.id, newStatus)
    if (success) {
      const updated = await getById(booking.id)
      if (updated) {
        setBooking(updated)
        setSelectedStatus(newStatus)
      }
    }
    setIsSaving(false)
  }

  const handleSaveNotes = async () => {
    if (!booking) return
    
    setIsSaving(true)
    const updated = await updateBooking(booking.id, { notes })
    if (updated) {
      setBooking(updated)
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!booking) return
    
    const success = await deleteBooking(booking.id)
    if (success) {
      navigate('/admin/agendamentos')
    }
  }

  const handleCreateNewBooking = async () => {
    if (!booking || !newBookingDate || !newBookingTime) return

    setIsCreatingBooking(true)
    try {
      const typeLabel = newBookingType === 'reuniao' ? 'Reunião' : newBookingType === 'teste_anatomico' ? 'Teste Anatômico' : 'Sessão'
      const response = await bookingsApi.create({
        type: newBookingType,
        date: newBookingDate,
        time: newBookingTime,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail || '',
        clientPhone: booking.clientPhone,
        clientCpf: booking.clientCpf || '',
        clientMessage: `${typeLabel} agendada para ${booking.clientName}`
      })

      if (response.success) {
        setBookingCreatedSuccess(true)
        setTimeout(() => {
          setShowScheduleModal(false)
          setNewBookingDate('')
          setNewBookingTime('')
          setBookingCreatedSuccess(false)
        }, 2000)
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
    } finally {
      setIsCreatingBooking(false)
    }
  }

  if (isLoadingBooking) {
    return (
      <div className="min-h-[100dvh] pt-20 pb-16 px-4 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (loadError || !booking) {
    return (
      <div className="min-h-[100dvh] pt-20 pb-16 px-4 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar</h2>
          <p className="text-gray-500 mb-4">{loadError || 'Agendamento não encontrado'}</p>
          <Link
            to="/admin/agendamentos"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar para agendamentos
          </Link>
        </div>
      </div>
    )
  }

  const bookingDate = parseISO(booking.date)
  const currentStatus = statusOptions.find(s => s.value === booking.status)
  const StatusIcon = currentStatus?.icon || Clock3

  return (
    <div className="min-h-[100dvh] pt-20 lg:pt-8 pb-16 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link
            to="/admin/agendamentos"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar para agendamentos
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium tracking-wide mb-3">
                Detalhes do Agendamento
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 tracking-tight">
                {booking.clientName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* WhatsApp Button */}
              <button
                onClick={handleSendWhatsApp}
                disabled={isSendingMessage}
                className={`p-2.5 rounded-xl transition-all ${
                  messageSent 
                    ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' 
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300'
                }`}
                title="Enviar mensagem WhatsApp"
              >
                {isSendingMessage ? (
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : messageSent ? (
                  <CheckCircle size={20} />
                ) : (
                  <Send size={20} />
                )}
              </button>

              {/* View Client Button */}
              {clientId && (
                <Link
                  to={`/admin/clientes/${clientId}`}
                  className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 transition-all"
                  title="Ver perfil do cliente"
                >
                  <ExternalLink size={20} />
                </Link>
              )}

              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 hover:border-red-300 transition-all"
                title="Excluir agendamento"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Date & Time Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl p-5 sm:p-6 bg-white border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" />
              Data e Horário
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Calendar size={20} className="text-indigo-600" />
                <div>
                  <p className="text-gray-500 text-sm">Data</p>
                  <p className="text-gray-800 font-medium">
                    {format(bookingDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Clock size={20} className="text-indigo-600" />
                <div>
                  <p className="text-gray-500 text-sm">Horário</p>
                  <p className="text-gray-800 font-medium">{booking.time}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-indigo-100 border border-indigo-200">
              <p className="text-sm">
                <span className="font-medium text-gray-800">Tipo:</span>{' '}
                <span className="text-gray-500">
                  {booking.type === 'reuniao' ? 'Reunião de Criação' : 'Sessão de Tatuagem'}
                </span>
              </p>
            </div>
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-2xl p-5 sm:p-6 bg-white border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Confirmar Presença */}
              <button
                onClick={() => handleStatusChange('confirmado')}
                disabled={isSaving || booking.status === 'confirmado'}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  booking.status === 'confirmado'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                    : 'bg-gray-50 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 text-gray-600 hover:text-emerald-600'
                } disabled:opacity-50`}
              >
                <CheckCircle size={24} />
                <span className="text-xs font-medium">
                  {booking.status === 'confirmado' ? 'Confirmado' : 'Confirmar'}
                </span>
              </button>

              {/* Marcar Concluído */}
              <button
                onClick={() => handleStatusChange('concluido')}
                disabled={isSaving || booking.status === 'concluido'}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  booking.status === 'concluido'
                    ? 'bg-blue-50 border-blue-300 text-blue-600'
                    : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-600 hover:text-blue-600'
                } disabled:opacity-50`}
              >
                <Check size={24} />
                <span className="text-xs font-medium">
                  {booking.status === 'concluido' ? 'Concluído' : 'Concluir'}
                </span>
              </button>

              {/* Não Compareceu */}
              <button
                onClick={() => handleStatusChange('nao_compareceu')}
                disabled={isSaving || booking.status === 'nao_compareceu'}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  booking.status === 'nao_compareceu'
                    ? 'bg-orange-50 border-orange-300 text-orange-600'
                    : 'bg-gray-50 border-gray-200 hover:bg-orange-50 hover:border-orange-300 text-gray-600 hover:text-orange-600'
                } disabled:opacity-50`}
              >
                <Ban size={24} />
                <span className="text-xs font-medium">Não Veio</span>
              </button>

              {/* Ver Perfil do Cliente */}
              {clientId ? (
                <Link
                  to={`/admin/clientes/${clientId}`}
                  className="p-4 rounded-xl border bg-gray-50 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 text-gray-600 hover:text-indigo-600 transition-all flex flex-col items-center gap-2"
                >
                  <User size={24} />
                  <span className="text-xs font-medium">Ver Perfil</span>
                </Link>
              ) : (
                <div className="p-4 rounded-xl border bg-gray-100 border-gray-200 text-gray-400 flex flex-col items-center gap-2 cursor-not-allowed">
                  <User size={24} />
                  <span className="text-xs font-medium">Sem Perfil</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Card de Novo Agendamento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="rounded-2xl p-5 sm:p-6 bg-white border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              O que deseja agendar agora?
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {/* Agendar Reunião */}
              <button
                onClick={() => {
                  setNewBookingType('reuniao')
                  setShowScheduleModal(true)
                }}
                className="p-4 rounded-xl border-2 border-violet-200 bg-violet-50 hover:bg-violet-100 hover:border-violet-300 transition-all group"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center transition-colors">
                    <Calendar size={20} className="text-violet-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-violet-700 text-sm">Reunião</p>
                    <p className="text-[10px] text-violet-500 mt-0.5">1ª Etapa</p>
                  </div>
                </div>
              </button>

              {/* Teste Anatômico */}
              <button
                onClick={() => {
                  setNewBookingType('teste_anatomico')
                  setShowScheduleModal(true)
                }}
                className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 transition-all group"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                    <UserPlus size={20} className="text-amber-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-amber-700 text-sm">Teste Anat.</p>
                    <p className="text-[10px] text-amber-500 mt-0.5">2ª Etapa</p>
                  </div>
                </div>
              </button>

              {/* Agendar Sessão */}
              <button
                onClick={() => {
                  setNewBookingType('sessao')
                  setShowScheduleModal(true)
                }}
                className="p-4 rounded-xl border-2 border-cyan-200 bg-cyan-50 hover:bg-cyan-100 hover:border-cyan-300 transition-all group"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 group-hover:bg-cyan-200 flex items-center justify-center transition-colors">
                    <Clock size={20} className="text-cyan-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-cyan-700 text-sm">Sessão</p>
                    <p className="text-[10px] text-cyan-500 mt-0.5">3ª Etapa</p>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Client Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl p-5 sm:p-6 bg-white border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-indigo-600" />
              Informações do Cliente
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <User size={18} className="text-indigo-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-sm">Nome</p>
                  <p className="text-gray-800 font-medium">{booking.clientName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Phone size={18} className="text-indigo-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-sm">Telefone / WhatsApp</p>
                  <a 
                    href={`https://wa.me/${booking.clientPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 font-medium hover:text-indigo-600 transition-colors"
                  >
                    {booking.clientPhone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <Mail size={18} className="text-indigo-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-sm">E-mail</p>
                  <a 
                    href={`mailto:${booking.clientEmail}`}
                    className="text-gray-800 font-medium hover:text-indigo-600 transition-colors break-all"
                  >
                    {booking.clientEmail}
                  </a>
                </div>
              </div>
              {booking.clientCpf && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <CreditCard size={18} className="text-indigo-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-sm">CPF</p>
                    <p className="text-gray-800 font-medium font-mono">{reputationService.formatCPF(booking.clientCpf)}</p>
                  </div>
                </div>
              )}
              {booking.clientMessage && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <MessageSquare size={18} className="text-indigo-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-sm mb-1">Mensagem do cliente</p>
                    <p className="text-gray-800 leading-relaxed">{booking.clientMessage}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Client Reputation & History Card */}
          {booking.clientCpf && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="rounded-2xl p-5 sm:p-6 bg-white border border-gray-200"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award size={20} className="text-indigo-600" />
                Reputação e Histórico
              </h2>
              
              {!clientData ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Novo cliente - Sem histórico anterior</p>
                </div>
              ) : (() => {
                const completionRate = clientData.totalBookings > 0 
                  ? Math.round((clientData.completedBookings / clientData.totalBookings) * 100)
                  : 0
                const canceledCount = clientData.totalBookings - clientData.completedBookings - clientData.noShowCount
                
                return (
                  <div className="space-y-4">
                    {/* Reputation Badge */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${reputationService.getReputationColor(clientData.reputation)} bg-slate-50`}>
                          <Award size={24} />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Reputação</p>
                          <p className={`text-lg font-semibold ${reputationService.getReputationColor(clientData.reputation)}`}>
                            {reputationService.getReputationLabel(clientData.reputation)}
                          </p>
                        </div>
                      </div>
                      {completionRate > 0 && (
                        <div className="text-right">
                          <p className="text-gray-500 text-sm">Taxa de conclusão</p>
                          <p className="text-gray-800 font-semibold">{completionRate}%</p>
                        </div>
                      )}
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-gray-800 mb-1">{clientData.totalBookings}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <div className="text-2xl font-bold text-emerald-600 mb-1">{clientData.completedBookings}</div>
                        <div className="text-xs text-gray-500">Concluídos</div>
                      </div>
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                        <div className="text-2xl font-bold text-red-600 mb-1">{canceledCount > 0 ? canceledCount : 0}</div>
                        <div className="text-xs text-gray-500">Cancelados</div>
                      </div>
                      <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-1">{clientData.noShowCount}</div>
                        <div className="text-xs text-gray-500">Faltas</div>
                      </div>
                    </div>

                    {/* Alerts */}
                    {clientData.noShowCount >= 3 && (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                        <div className="flex items-start gap-3">
                          <Ban size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-red-700 font-medium text-sm mb-1">Atenção: Cliente com histórico de faltas</p>
                            <p className="text-red-600/80 text-xs">Este cliente não compareceu em {clientData.noShowCount} agendamentos anteriores.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {clientData.reputation === 'alta' && (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                        <div className="flex items-start gap-3">
                          <TrendingUp size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-emerald-700 font-medium text-sm mb-1">Cliente Excelente</p>
                            <p className="text-emerald-600/80 text-xs">Histórico impecável com alta taxa de conclusão.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </motion.div>
          )}

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl p-5 sm:p-6 bg-white border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <StatusIcon size={20} className={currentStatus?.color} />
              Status do Agendamento
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {statusOptions.map((option) => {
                const OptionIcon = option.icon
                const isSelected = selectedStatus === option.value
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={isSaving}
                    className={`
                      p-3 sm:p-4 rounded-xl border transition-all text-left
                      ${isSelected
                        ? 'bg-indigo-100 border-indigo-300 ring-2 ring-indigo-200'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-200 hover:bg-gray-100'
                      }
                      ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <OptionIcon 
                      size={20} 
                      className={`mb-2 ${isSelected ? 'text-indigo-600' : option.color}`} 
                    />
                    <p className={`text-sm font-medium ${isSelected ? 'text-gray-800' : 'text-gray-500'}`}>
                      {option.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Notes Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl p-5 sm:p-6 bg-white border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Edit3 size={20} className="text-indigo-600" />
                Notas Internas
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-600-light transition-colors"
                >
                  Editar
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Adicione observações sobre este agendamento..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-600-light active:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save size={16} />
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setNotes(booking.notes || '')
                    }}
                    disabled={isSaving}
                    className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-200 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                {booking.notes ? (
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{booking.notes}</p>
                ) : (
                  <p className="text-gray-400 italic">Nenhuma nota adicionada ainda</p>
                )}
              </div>
            )}
          </motion.div>

          {/* Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-xl p-4 bg-gray-50 border border-gray-200"
          >
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Criado em:</span>{' '}
                <span className="text-gray-500">
                  {format(parseISO(booking.createdAt), "d/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Última atualização:</span>{' '}
                <span className="text-gray-500">
                  {format(parseISO(booking.updatedAt), "d/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-800/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6 bg-white border border-gray-200 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 size={32} className="text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Excluir Agendamento?
                </h3>
                <p className="text-gray-500">
                  Esta ação não pode ser desfeita. O agendamento de <strong className="text-gray-800">{booking.clientName}</strong> será removido permanentemente.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 active:bg-red-800 transition-colors"
                >
                  Sim, excluir
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal de Novo Agendamento */}
        <AnimatePresence>
          {showScheduleModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowScheduleModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className={`flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r ${bookingTypeConfig[newBookingType].gradient}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bookingTypeConfig[newBookingType].bgIcon}`}>
                      <CalendarPlus size={20} className={bookingTypeConfig[newBookingType].color} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">
                        {bookingTypeConfig[newBookingType].label}
                      </h2>
                      <p className="text-sm text-gray-500">para {booking?.clientName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5">
                  {bookingCreatedSuccess ? (
                    <div className="text-center py-8">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${bookingTypeConfig[newBookingType].bgIcon}`}>
                        <Check className={`w-8 h-8 ${bookingTypeConfig[newBookingType].color}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {bookingTypeConfig[newBookingType].successLabel}
                      </h3>
                      <p className="text-gray-500">
                        {bookingTypeConfig[newBookingType].successMsg}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Info do Cliente */}
                      <div className={`flex items-center gap-3 p-3 border rounded-xl ${bookingTypeConfig[newBookingType].bg}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-700`}>
                          <span className="text-white font-semibold">
                            {booking?.clientName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{booking?.clientName}</p>
                          <p className="text-sm text-gray-500">{booking?.clientPhone}</p>
                        </div>
                      </div>

                      {/* Tipo selecionado */}
                      <div className={`p-3 rounded-xl border ${bookingTypeConfig[newBookingType].bg}`}>
                        <p className="text-sm">
                          <span className="text-gray-500">Tipo:</span>{' '}
                          <span className={`font-medium ${bookingTypeConfig[newBookingType].color}`}>
                            {bookingTypeConfig[newBookingType].label.replace('Agendar ', '')}
                          </span>
                        </p>
                      </div>

                      {/* Data e Horário */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data *
                          </label>
                          <input
                            type="date"
                            value={newBookingDate}
                            onChange={(e) => setNewBookingDate(e.target.value)}
                            min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                            className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${bookingTypeConfig[newBookingType].ringColor}`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Horário *
                          </label>
                          <select
                            value={newBookingTime}
                            onChange={(e) => setNewBookingTime(e.target.value)}
                            className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${bookingTypeConfig[newBookingType].ringColor}`}
                          >
                            <option value="">Selecione...</option>
                            {defaultTimeSlots.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-amber-700 text-sm">
                          <strong>Nota:</strong> O cliente receberá uma notificação automática por WhatsApp com os detalhes do agendamento.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {!bookingCreatedSuccess && (
                  <div className="p-5 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={handleCreateNewBooking}
                      disabled={!newBookingDate || !newBookingTime || isCreatingBooking}
                      className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
                        newBookingDate && newBookingTime && !isCreatingBooking
                          ? bookingTypeConfig[newBookingType].btnColor
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isCreatingBooking ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Agendando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Plus size={20} />
                          {bookingTypeConfig[newBookingType].label.replace('Agendar ', 'Confirmar ')}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
