import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  Search,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckCheck,
  UserX,
  CreditCard,
  UserPlus,
  RefreshCw,
  ChevronLeft,
  Check,
  Loader2,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useBookings } from '../../hooks'
import { Booking, bookingsApi } from '../../services/api'
import reputationService from '../../services/reputationService'

type BookingStatus = 'pendente' | 'confirmado' | 'cancelado' | 'concluido' | 'nao_compareceu'
type BookingType = 'reuniao' | 'teste_anatomico' | 'sessao'

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string; cssClass: string }> = {
  pendente: {
    label: 'Pendente',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-100 border-amber-200 text-amber-700',
    cssClass: 'status-pendente',
  },
  confirmado: {
    label: 'Confirmado',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 border-emerald-200 text-emerald-700',
    cssClass: 'status-confirmado',
  },
  cancelado: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100 border-red-200 text-red-700',
    cssClass: 'status-cancelado',
  },
  concluido: {
    label: 'Concluído',
    icon: CheckCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-100 border-blue-200 text-blue-700',
    cssClass: 'status-concluido',
  },
  nao_compareceu: {
    label: 'Não compareceu',
    icon: UserX,
    color: 'text-orange-600',
    bg: 'bg-orange-100 border-orange-200 text-orange-700',
    cssClass: 'status-nao-compareceu',
  },
}

const typeConfig: Record<string, { label: string; color: string }> = {
  reuniao: { label: 'Reunião', color: 'bg-violet-100 text-violet-700 border border-violet-200' },
  teste_anatomico: { label: 'Teste Anatômico', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
  sessao: { label: 'Sessão', color: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
}

const STATUS_FILTERS: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'concluido', label: 'Concluídos' },
  { value: 'cancelado', label: 'Cancelados' },
  { value: 'nao_compareceu', label: 'Faltas' },
]

const TYPE_FILTERS: { value: BookingType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'teste_anatomico', label: 'Teste' },
  { value: 'sessao', label: 'Sessão' },
]

const PAGE_SIZE = 20

export default function AdminBookings() {
  const { bookings, fetchBookings } = useBookings()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<BookingType | 'all'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings({ limit: 1000 })
  }, [fetchBookings])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter])

  const filteredBookings = (() => {
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

    return filtered
  })()

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE))
  const pagedBookings = filteredBookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const counts = {
    all: bookings.length,
    pendente: bookings.filter(b => b.status === 'pendente').length,
    confirmado: bookings.filter(b => b.status === 'confirmado').length,
    cancelado: bookings.filter(b => b.status === 'cancelado').length,
    concluido: bookings.filter(b => b.status === 'concluido').length,
    nao_compareceu: bookings.filter(b => b.status === 'nao_compareceu').length,
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchBookings({ limit: 1000 })
    setIsRefreshing(false)
  }

  const handleQuickStatus = useCallback(async (e: React.MouseEvent, booking: Booking, newStatus: string) => {
    e.preventDefault()
    e.stopPropagation()
    setUpdatingId(booking.id)
    try {
      await bookingsApi.updateStatus(booking.id, newStatus)
      await fetchBookings({ limit: 1000 })
    } finally {
      setUpdatingId(null)
    }
  }, [fetchBookings])

  return (
    <div className="min-h-[100dvh] pt-20 lg:pt-8 pb-16 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-1">
                Agendamentos
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
                className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all disabled:opacity-50"
                title="Atualizar lista"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <Link
                to="/admin/vagas"
                className="btn btn-admin-primary btn-md"
              >
                <UserPlus size={18} />
                <span className="hidden sm:inline">Novo Agendamento</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4"
        >
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email, telefone ou CPF..."
              className="input-light pl-12 pr-4"
            />
          </div>
        </motion.div>

        {/* Pill Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-6 space-y-2"
        >
          {/* Status pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(f => {
              const count = counts[f.value as keyof typeof counts] ?? 0
              const isActive = statusFilter === f.value
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value as BookingStatus | 'all')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  {f.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Type pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {TYPE_FILTERS.map(f => {
              const isActive = typeFilter === f.value
              const colorMap: Record<string, string> = {
                reuniao: isActive ? 'bg-violet-600 text-white' : 'bg-white border border-violet-200 text-violet-700 hover:bg-violet-50',
                teste_anatomico: isActive ? 'bg-amber-500 text-white' : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50',
                sessao: isActive ? 'bg-cyan-600 text-white' : 'bg-white border border-cyan-200 text-cyan-700 hover:bg-cyan-50',
                all: isActive ? 'bg-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300',
              }
              return (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value as BookingType | 'all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${colorMap[f.value]}`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Bookings List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
            {pagedBookings.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white rounded-xl border border-gray-200">
                <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">Nenhum agendamento encontrado</p>
                <p className="text-gray-400 text-sm">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Aguardando novos agendamentos'}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {pagedBookings.map((booking, index) => {
                  const StatusIcon = statusConfig[booking.status].icon
                  const bookingDate = parseISO(booking.date)
                  const isUpdating = updatingId === booking.id

                  return (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                      <Link
                        to={`/admin/agendamentos/${booking.id}`}
                        className="block group"
                      >
                        <div className="rounded-xl p-4 sm:p-5 bg-white border border-gray-200 hover:border-gray-300 transition-all">
                          {/* Mobile Layout */}
                          <div className="sm:hidden space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-gray-800 font-medium text-base mb-1 truncate">
                                  {booking.clientName}
                                </h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`status-badge ${statusConfig[booking.status].cssClass}`}>
                                    <StatusIcon size={10} />
                                    {statusConfig[booking.status].label}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${typeConfig[booking.type].color}`}>
                                    {typeConfig[booking.type].label}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                            </div>

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

                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Phone size={14} />
                              {booking.clientPhone}
                            </div>

                            {/* Mobile quick actions */}
                            {(booking.status === 'pendente' || booking.status === 'confirmado') && (
                              <div className="flex gap-2" onClick={e => e.preventDefault()}>
                                {booking.status === 'pendente' && (
                                  <button
                                    onClick={(e) => handleQuickStatus(e, booking, 'confirmado')}
                                    disabled={isUpdating}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                  >
                                    {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    Confirmar
                                  </button>
                                )}
                                {booking.status === 'confirmado' && (
                                  <button
                                    onClick={(e) => handleQuickStatus(e, booking, 'concluido')}
                                    disabled={isUpdating}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                                  >
                                    {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
                                    Concluir
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:flex items-center gap-4">
                            {/* Date Badge */}
                            <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-indigo-50 flex flex-col items-center justify-center border border-indigo-100">
                              <span className="text-indigo-600 text-xl font-bold leading-none">
                                {format(bookingDate, 'd')}
                              </span>
                              <span className="text-indigo-400 text-xs uppercase mt-0.5">
                                {format(bookingDate, 'MMM', { locale: ptBR })}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1.5">
                                <h3 className="text-gray-800 font-medium text-base col-primary">
                                  {booking.clientName}
                                </h3>
                                <span className={`status-badge ${statusConfig[booking.status].cssClass}`}>
                                  <StatusIcon size={12} />
                                  {statusConfig[booking.status].label}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs ${typeConfig[booking.type].color}`}>
                                  {typeConfig[booking.type].label}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap col-secondary">
                                <span className="flex items-center gap-1.5">
                                  <Clock size={14} />
                                  {booking.time}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Phone size={14} />
                                  {booking.clientPhone}
                                </span>
                                {booking.clientCpf && (
                                  <span className="flex items-center gap-1.5 col-hide-mobile">
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

                            {/* Quick Actions */}
                            {(booking.status === 'pendente' || booking.status === 'confirmado') && (
                              <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.preventDefault()}>
                                {booking.status === 'pendente' && (
                                  <button
                                    onClick={(e) => handleQuickStatus(e, booking, 'confirmado')}
                                    disabled={isUpdating}
                                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                                  >
                                    {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    Confirmar
                                  </button>
                                )}
                                {booking.status === 'confirmado' && (
                                  <button
                                    onClick={(e) => handleQuickStatus(e, booking, 'concluido')}
                                    disabled={isUpdating}
                                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                                  >
                                    {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
                                    Concluir
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Arrow */}
                            <span className="col-action flex-shrink-0">
                              <ChevronRight size={24} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex items-center justify-between"
          >
            <p className="text-sm text-gray-500">
              Mostrando {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredBookings.length)}–{Math.min(currentPage * PAGE_SIZE, filteredBookings.length)} de {filteredBookings.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        currentPage === p
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
