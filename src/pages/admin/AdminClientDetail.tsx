import { useState, useEffect, useRef } from 'react'
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
  Edit3,
  Star,
  AlertTriangle,
  TrendingUp,
  Image,
  FileText,
  Shield,
  Trash2,
  Eye,
  X,
  Upload,
  Camera,
  Plus
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clientsApi, bookingsApi, Client, Booking } from '../../services/api'

type BookingStatus = 'pendente' | 'confirmado' | 'cancelado' | 'concluido' | 'nao_compareceu'

const statusConfig: Record<BookingStatus, { label: string; icon: any; color: string; bg: string }> = {
  pendente: { label: 'Pendente', icon: Clock3, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  confirmado: { label: 'Confirmado', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  cancelado: { label: 'Cancelado', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  concluido: { label: 'Concluído', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  nao_compareceu: { label: 'Não compareceu', icon: Ban, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
}

const reputationConfig: Record<string, { label: string; color: string; bg: string; icon: any; description: string }> = {
  alta: { 
    label: 'VIP', 
    color: 'text-amber-600', 
    bg: 'bg-amber-50 border-amber-200',
    icon: Star,
    description: 'Cliente exemplar, sempre comparece'
  },
  boa: { 
    label: 'Regular', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50 border-emerald-200',
    icon: TrendingUp,
    description: 'Cliente confiável'
  },
  neutro: { 
    label: 'Novo', 
    color: 'text-blue-600', 
    bg: 'bg-blue-50 border-blue-200',
    icon: User,
    description: 'Primeiro agendamento'
  },
  baixa: { 
    label: 'Atenção', 
    color: 'text-red-600', 
    bg: 'bg-red-50 border-red-200',
    icon: AlertTriangle,
    description: 'Histórico de faltas'
  },
}

interface TattooImage {
  id: string
  url: string
  description: string
  date: string
}

export default function AdminClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [client, setClient] = useState<Client | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'bookings' | 'documents' | 'tattoos' | 'progress'>('info')
  
  // Edit form
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    notes: ''
  })

  // Tattoo images (simulated - would come from API)
  const [tattooImages, setTattooImages] = useState<TattooImage[]>([])
  const [selectedImage, setSelectedImage] = useState<TattooImage | null>(null)

  // New booking modal
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [newBookingDate, setNewBookingDate] = useState('')
  const [newBookingTime, setNewBookingTime] = useState('')
  const [newBookingType, setNewBookingType] = useState<'reuniao' | 'sessao'>('reuniao')
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Delete client
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const defaultTimeSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ]

  useEffect(() => {
    loadClient()
  }, [id])

  const loadClient = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const response = await clientsApi.getById(id)
      if (response.success) {
        setClient(response.data)
        setBookings(response.data.bookings || [])
        setEditForm({
          name: response.data.name,
          email: response.data.email || '',
          phone: response.data.phone,
          cpf: response.data.cpf || '',
          notes: response.data.notes || ''
        })
        
        // Load tattoo images from localStorage (temporary - would come from API)
        const savedImages = localStorage.getItem(`tattoos_${id}`)
        if (savedImages) {
          setTattooImages(JSON.parse(savedImages))
        }
      } else {
        navigate('/admin/clientes')
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      navigate('/admin/clientes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!client) return
    setIsSaving(true)
    try {
      const response = await clientsApi.update(client.id, editForm)
      if (response.success) {
        setClient({ ...client, ...editForm })
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !client) return
    
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newImage: TattooImage = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          url: event.target?.result as string,
          description: '',
          date: new Date().toISOString()
        }
        
        setTattooImages(prev => {
          const updated = [...prev, newImage]
          // Save to localStorage
          localStorage.setItem(`tattoos_${client.id}`, JSON.stringify(updated))
          return updated
        })
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteImage = (imageId: string) => {
    if (!client) return
    setTattooImages(prev => {
      const updated = prev.filter(img => img.id !== imageId)
      localStorage.setItem(`tattoos_${client.id}`, JSON.stringify(updated))
      return updated
    })
    setSelectedImage(null)
  }

  const handleCreateBooking = async () => {
    if (!client || !newBookingDate || !newBookingTime) return

    setIsCreatingBooking(true)
    try {
      const response = await bookingsApi.create({
        type: newBookingType,
        date: newBookingDate,
        time: newBookingTime,
        clientName: client.name,
        clientEmail: client.email || '',
        clientPhone: client.phone,
        clientCpf: client.cpf || '',
        clientMessage: 'Agendamento criado manualmente pelo admin'
      })

      if (response.success) {
        setBookingSuccess(true)
        // Reload client to get updated bookings
        setTimeout(async () => {
          setShowNewBooking(false)
          setNewBookingDate('')
          setNewBookingTime('')
          setBookingSuccess(false)
          await loadClient()
        }, 1500)
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
    } finally {
      setIsCreatingBooking(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!client) return

    setIsDeleting(true)
    try {
      const response = await clientsApi.delete(client.id)
      if (response.success) {
        navigate('/admin/clientes')
      }
    } catch (error) {
      console.error('Erro ao deletar cliente:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  const formatCpf = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `${cleaned.slice(0,3)}.${cleaned.slice(3,6)}.${cleaned.slice(6,9)}-${cleaned.slice(9)}`
    }
    return cpf
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="bg-white rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full" />
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-200 rounded w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!client) return null

  const reputation = reputationConfig[client.reputation] || reputationConfig.novo
  const ReputationIcon = reputation.icon

  // Stats
  const completedBookings = bookings.filter(b => b.status === 'concluido')
  const noShowBookings = bookings.filter(b => b.status === 'nao_compareceu')
  const upcomingBookings = bookings.filter(b => 
    ['pendente', 'confirmado'].includes(b.status) && 
    new Date(b.date) >= new Date()
  )
  const completionRate = bookings.length > 0 
    ? Math.round((completedBookings.length / (completedBookings.length + noShowBookings.length || 1)) * 100) 
    : 0

  return (
    <div className="p-4 lg:p-8 pt-20 lg:pt-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/clientes')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Detalhes do Cliente</h1>
          <p className="text-gray-500 text-sm">Visualize e gerencie informações</p>
        </div>
      </div>

      {/* Client Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-3xl">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">{client.name}</h2>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${reputation.bg} ${reputation.color}`}>
                  <ReputationIcon className="w-4 h-4" />
                  {reputation.label}
                </div>
                <p className="text-xs text-gray-400 mt-1">{reputation.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewBooking(true)}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Agendar
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Edit3 className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Deletar cliente"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 border-t border-gray-100">
          <div className="p-4 text-center border-r border-gray-100">
            <p className="text-2xl font-bold text-gray-800">{client.totalBookings}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="p-4 text-center border-r border-gray-100">
            <p className="text-2xl font-bold text-emerald-600">{client.completedBookings}</p>
            <p className="text-xs text-gray-500">Concluídos</p>
          </div>
          <div className="p-4 text-center border-r border-gray-100">
            <p className="text-2xl font-bold text-orange-600">{client.noShowCount}</p>
            <p className="text-xs text-gray-500">Faltas</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{completionRate}%</p>
            <p className="text-xs text-gray-500">Taxa</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[
            { id: 'info', label: 'Info', icon: User },
            { id: 'bookings', label: 'Agenda', icon: Calendar },
            { id: 'documents', label: 'Docs', icon: FileText },
            { id: 'tattoos', label: 'Fotos', icon: Image },
            { id: 'progress', label: 'Progresso', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                    <input
                      type="text"
                      value={editForm.cpf}
                      onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Preferências, alergias, observações importantes..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Phone className="w-4 h-4" />
                        Telefone
                      </div>
                      <p className="font-medium text-gray-800">{formatPhone(client.phone)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                      <p className="font-medium text-gray-800">{client.email || '-'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <User className="w-4 h-4" />
                        CPF
                      </div>
                      <p className="font-medium text-gray-800">{client.cpf ? formatCpf(client.cpf) : '-'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        Cliente desde
                      </div>
                      <p className="font-medium text-gray-800">
                        {format(parseISO(client.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {client.notes && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 text-sm mb-1">
                        <MessageSquare className="w-4 h-4" />
                        Observações
                      </div>
                      <p className="text-amber-800">{client.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {/* Upcoming */}
              {upcomingBookings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Próximos Agendamentos
                  </h3>
                  <div className="space-y-2">
                    {upcomingBookings.map(booking => {
                      const status = statusConfig[booking.status as BookingStatus] || statusConfig.pendente
                      const StatusIcon = status.icon
                      return (
                        <Link
                          key={booking.id}
                          to={`/admin/agendamentos/${booking.id}`}
                          className="flex items-center gap-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {format(parseISO(booking.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </p>
                            <p className="text-sm text-gray-500">{booking.time} - {booking.type === 'reuniao' ? 'Reunião' : 'Sessão'}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* History */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Histórico ({bookings.length})
                </h3>
                {bookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum agendamento</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookings
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(booking => {
                        const status = statusConfig[booking.status as BookingStatus] || statusConfig.pendente
                        const StatusIcon = status.icon
                        return (
                          <Link
                            key={booking.id}
                            to={`/admin/agendamentos/${booking.id}`}
                            className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">
                                {format(parseISO(booking.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                              <p className="text-sm text-gray-500">{booking.time} - {booking.type === 'reuniao' ? 'Reunião' : 'Sessão'}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </Link>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">
                Termos e Documentos
              </h3>

              {/* Termo de Responsabilidade */}
              <div className={`p-4 rounded-xl border-2 ${
                client?.termsAccepted 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    client?.termsAccepted ? 'bg-emerald-100' : 'bg-gray-200'
                  }`}>
                    <FileText className={`w-5 h-5 ${
                      client?.termsAccepted ? 'text-emerald-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800">Termo de Responsabilidade</h4>
                      {client?.termsAccepted ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Aceito
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                          Pendente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Termo de ciência sobre procedimentos, cuidados e riscos da tatuagem.
                    </p>
                    {client?.termsAcceptedAt && (
                      <p className="text-xs text-gray-400 mt-2">
                        Aceito em: {format(parseISO(client.termsAcceptedAt), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Direito de Uso de Imagem */}
              <div className={`p-4 rounded-xl border-2 ${
                client?.imageRightsAccepted 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    client?.imageRightsAccepted ? 'bg-emerald-100' : 'bg-gray-200'
                  }`}>
                    <Shield className={`w-5 h-5 ${
                      client?.imageRightsAccepted ? 'text-emerald-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800">Direito de Uso de Imagem</h4>
                      {client?.imageRightsAccepted ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Autorizado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                          Pendente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Autorização para uso de fotos da tatuagem em portfólio e redes sociais.
                    </p>
                    {client?.imageRightsAcceptedAt && (
                      <p className="text-xs text-gray-400 mt-2">
                        Autorizado em: {format(parseISO(client.imageRightsAcceptedAt), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Anamnese */}
              <div className="p-4 rounded-xl border-2 bg-gray-50 border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-100">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800">Ficha de Anamnese</h4>
                      <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        Em breve
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Questionário de saúde com informações sobre alergias, medicamentos e condições médicas.
                    </p>
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-purple-700 text-xs">
                        <strong>OCR:</strong> Em breve será possível digitalizar fichas de anamnese preenchidas à mão usando reconhecimento de texto.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-700 text-sm">
                  <strong>Nota:</strong> Os termos são aceitos pelo cliente durante o processo de agendamento ou presencialmente antes da sessão.
                </p>
              </div>
            </div>
          )}

          {/* Tattoos Tab */}
          {activeTab === 'tattoos' && (
            <div className="space-y-4">
              {/* Upload Button */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Fotos das Tattoos ({tattooImages.length})
                </h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Adicionar Fotos
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Gallery */}
              {tattooImages.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">Nenhuma foto adicionada</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-600 text-sm hover:underline"
                  >
                    Clique para adicionar
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tattooImages.map(image => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200"
                    >
                      <img
                        src={image.url}
                        alt="Tattoo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedImage(image)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Eye className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-white text-xs">
                          {format(parseISO(image.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              {/* Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Jornada do Cliente
                </h3>

                <div className="relative">
                  {/* Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                  {/* Items */}
                  <div className="space-y-4">
                    {bookings
                      .filter(b => b.status === 'concluido')
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((booking, index) => (
                        <div key={booking.id} className="relative flex items-start gap-4 pl-10">
                          <div className="absolute left-2.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                          <div className="flex-1 bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-gray-800">
                                {booking.type === 'reuniao' ? 'Reunião de Criação' : 'Sessão de Tattoo'}
                              </p>
                              <span className="text-xs text-gray-400">
                                {format(parseISO(booking.date), 'dd/MM/yyyy')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {index === 0 ? 'Primeiro contato' : `Sessão ${index + 1}`}
                            </p>
                          </div>
                        </div>
                      ))}

                    {upcomingBookings.length > 0 && (
                      <div className="relative flex items-start gap-4 pl-10">
                        <div className="absolute left-2.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white animate-pulse" />
                        <div className="flex-1 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                          <p className="font-medium text-indigo-800">Próximo: {upcomingBookings[0].type === 'reuniao' ? 'Reunião' : 'Sessão'}</p>
                          <p className="text-sm text-indigo-600">
                            {format(parseISO(upcomingBookings[0].date), "d 'de' MMMM", { locale: ptBR })} às {upcomingBookings[0].time}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-800">Comparecimentos</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">{completedBookings.length}</p>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Ban className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-orange-800">Faltas</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">{noShowBookings.length}</p>
                </div>
              </div>

              {/* Completion Progress */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">Taxa de Comparecimento</span>
                  <span className="text-lg font-bold text-indigo-600">{completionRate}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      completionRate >= 80 ? 'bg-emerald-500' :
                      completionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedImage.url}
              alt="Tattoo"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Booking Modal */}
      <AnimatePresence>
        {showNewBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowNewBooking(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Novo Agendamento</h2>
                <button
                  onClick={() => setShowNewBooking(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                {bookingSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Agendamento Criado!</h3>
                    <p className="text-gray-500">O agendamento foi criado com sucesso.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Client Info */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{client.name}</p>
                        <p className="text-sm text-gray-500">{formatPhone(client.phone)}</p>
                      </div>
                    </div>

                    {/* Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Atendimento
                      </label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setNewBookingType('reuniao')}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            newBookingType === 'reuniao'
                              ? 'bg-violet-600 text-white'
                              : 'bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            <Calendar size={18} />
                            Reunião
                          </span>
                        </button>
                        <button
                          onClick={() => setNewBookingType('sessao')}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            newBookingType === 'sessao'
                              ? 'bg-cyan-600 text-white'
                              : 'bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            <Clock size={18} />
                            Sessão
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data
                        </label>
                        <input
                          type="date"
                          value={newBookingDate}
                          onChange={(e) => setNewBookingDate(e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horário
                        </label>
                        <select
                          value={newBookingTime}
                          onChange={(e) => setNewBookingTime(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Selecione...</option>
                          {defaultTimeSlots.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!bookingSuccess && (
                <div className="p-5 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={handleCreateBooking}
                    disabled={!newBookingDate || !newBookingTime || isCreatingBooking}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      newBookingDate && newBookingTime && !isCreatingBooking
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isCreatingBooking ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Criando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Plus size={20} />
                        Criar Agendamento
                      </span>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            >
              <div className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                  Deletar Cliente
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Tem certeza que deseja deletar <strong>{client?.name}</strong>? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 rounded-xl font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    disabled={isDeleting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteClient}
                    disabled={isDeleting}
                    className="flex-1 py-3 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deletando...
                      </span>
                    ) : (
                      'Deletar'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
