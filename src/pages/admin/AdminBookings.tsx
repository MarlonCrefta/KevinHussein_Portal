import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare,
  Filter,
  Search,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock3,
  Ban,
  CreditCard,
  UserPlus,
  RefreshCw
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useBookings } from '../../hooks'
import { Booking } from '../../services/api'
import reputationService from '../../services/reputationService'

type BookingStatus = 'pendente' | 'confirmado' | 'cancelado' | 'concluido' | 'nao_compareceu'
type BookingType = 'reuniao' | 'teste_anatomico' | 'sessao'

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pendente: { 
    label: 'Pendente', 
    icon: Clock3, 
    color: 'text-amber-600', 
    bg: 'bg-amber-100 border-amber-200 text-amber-700' 
  },
  confirmado: { 
    label: 'Confirmado', 
    icon: CheckCircle, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-100 border-emerald-200 text-emerald-700' 
  },
  cancelado: { 
    label: 'Cancelado', 
    icon: XCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-100 border-red-200 text-red-700' 
  },
  concluido: { 
    label: 'Concluído', 
    icon: CheckCircle, 
    color: 'text-blue-600', 
    bg: 'bg-blue-100 border-blue-200 text-blue-700' 
  },
  nao_compareceu: { 
    label: 'Não compareceu', 
    icon: Ban, 
    color: 'text-orange-600', 
    bg: 'bg-orange-100 border-orange-200 text-orange-700' 
  },
}

const typeConfig: Record<string, { label: string; color: string }> = {
  reuniao: { label: 'Reunião', color: 'bg-violet-100 text-violet-700 border border-violet-200' },
  teste_anatomico: { label: 'Teste Anatômico', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
  sessao: { label: 'Sessão', color: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
}

export default function AdminBookings() {
  const { bookings, fetchBookings } = useBookings()
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<BookingType | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchTerm, statusFilter, typeFilter])

  const filterBookings = () => {
    let filtered = [...bookings]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(b => 
        b.clientName.toLowerCase().includes(term) ||
        b.clientEmail.toLowerCase().includes(term) ||
        b.clientPhone.includes(term) ||
        (b.clientCpf && b.clientCpf.includes(term))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(b => b.type === typeFilter)
    }

    filtered.sort((a, b) => {
      const dateA = parseISO(a.date)
      const dateB = parseISO(b.date)
      if (dateA.getTime() === dateB.getTime()) {
        return a.time.localeCompare(b.time)
      }
      return dateB.getTime() - dateA.getTime()
    })

    setFilteredBookings(filtered)
  }

  const getStatusCounts = () => {
    return {
      all: bookings.length,
      pendente: bookings.filter(b => b.status === 'pendente').length,
      confirmado: bookings.filter(b => b.status === 'confirmado').length,
      cancelado: bookings.filter(b => b.status === 'cancelado').length,
      concluido: bookings.filter(b => b.status === 'concluido').length,
      nao_compareceu: bookings.filter(b => b.status === 'nao_compareceu').length,
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchBookings()
    setIsRefreshing(false)
  }

  const counts = getStatusCounts()

  return (
    <div className="min-h-[100dvh] pt-20 lg:pt-8 pb-16 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium mb-3">
                Gestão de Agendamentos
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">
                Todos os Agendamentos
              </h1>
              <p className="text-gray-500 text-sm">
                {filteredBookings.length} {filteredBookings.length === 1 ? 'agendamento' : 'agendamentos'}
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? ' encontrado(s)' : ' no total'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-3 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all disabled:opacity-50"
                title="Atualizar lista"
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <Link
                to="/admin/vagas"
                className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <UserPlus size={18} />
                <span className="hidden sm:inline">Novo Agendamento</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email, telefone ou CPF..."
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Filter Toggle Button (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all"
          >
            <span className="flex items-center gap-2">
              <Filter size={18} />
              Filtros
            </span>
            <ChevronRight size={18} className={`transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </button>

          {/* Filters */}
          <AnimatePresence>
            {(showFilters || window.innerWidth >= 1024) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid sm:grid-cols-2 gap-3"
              >
                {/* Status Filter */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
                    className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="all">Todos ({counts.all})</option>
                    <option value="pendente">Pendente ({counts.pendente})</option>
                    <option value="confirmado">Confirmado ({counts.confirmado})</option>
                    <option value="concluido">Concluído ({counts.concluido})</option>
                    <option value="cancelado">Cancelado ({counts.cancelado})</option>
                    <option value="nao_compareceu">Não compareceu ({counts.nao_compareceu})</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Tipo
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as BookingType | 'all')}
                    className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="all">Todos</option>
                    <option value="reuniao">Reunião</option>
                    <option value="teste_anatomico">Teste Anatômico</option>
                    <option value="sessao">Sessão</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bookings List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3"
        >
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16 px-4">
              <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Nenhum agendamento encontrado</p>
              <p className="text-gray-400 text-sm">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Aguardando novos agendamentos'}
              </p>
            </div>
          ) : (
            filteredBookings.map((booking, index) => {
              const StatusIcon = statusConfig[booking.status].icon
              const bookingDate = parseISO(booking.date)

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link
                    to={`/admin/agendamentos/${booking.id}`}
                    className="block group"
                  >
                    <div className="rounded-xl p-4 sm:p-5 bg-white border border-gray-200 hover:border-gray-300 transition-all">
                      {/* Mobile Layout */}
                      <div className="sm:hidden space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-800 font-medium text-base mb-1 truncate">
                              {booking.clientName}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs border ${statusConfig[booking.status].bg}`}>
                                {statusConfig[booking.status].label}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${typeConfig[booking.type].color}`}>
                                {typeConfig[booking.type].label}
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar size={16} className="text-indigo-600" />
                            {format(bookingDate, "d 'de' MMM", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock size={16} className="text-indigo-600" />
                            {booking.time}
                          </div>
                        </div>

                        {/* Contact & CPF */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Phone size={14} />
                            {booking.clientPhone}
                          </div>
                          {booking.clientCpf && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <CreditCard size={14} />
                                {reputationService.formatCPF(booking.clientCpf)}
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${reputationService.getReputationColor(booking.clientReputation)} bg-gray-50 border border-gray-200`}>
                                {reputationService.getReputationLabel(booking.clientReputation)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:flex items-center gap-4">
                        {/* Date Badge */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-indigo-100 flex flex-col items-center justify-center">
                          <span className="text-indigo-600 text-xl font-semibold leading-none">
                            {format(bookingDate, 'd')}
                          </span>
                          <span className="text-gray-500 text-xs uppercase mt-0.5">
                            {format(bookingDate, 'MMM', { locale: ptBR })}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-gray-800 font-medium text-lg">
                              {booking.clientName}
                            </h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs border ${statusConfig[booking.status].bg} flex items-center gap-1.5`}>
                              <StatusIcon size={12} className={statusConfig[booking.status].color} />
                              {statusConfig[booking.status].label}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs ${typeConfig[booking.type].color}`}>
                              {typeConfig[booking.type].label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} />
                              {booking.time}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Phone size={14} />
                              {booking.clientPhone}
                            </span>
                            {booking.clientCpf && (
                              <span className="flex items-center gap-1.5">
                                <CreditCard size={14} />
                                {reputationService.formatCPF(booking.clientCpf)}
                              </span>
                            )}
                            {booking.clientReputation && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${reputationService.getReputationColor(booking.clientReputation)} bg-gray-50 border border-gray-200`}>
                                {reputationService.getReputationLabel(booking.clientReputation)}
                              </span>
                            )}
                            {booking.clientMessage && (
                              <span className="flex items-center gap-1.5 text-gray-400">
                                <MessageSquare size={14} />
                                Mensagem
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action */}
                        <ChevronRight size={24} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </div>
    </div>
  )
}
