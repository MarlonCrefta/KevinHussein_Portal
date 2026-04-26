import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  Calendar,
  Star,
  AlertTriangle,
  CheckCircle,
  User,
  TrendingUp,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react'
import { clientsApi, Client } from '../../services/api'

const reputationConfig: Record<string, { label: string; color: string; bg: string; activeBg: string; icon: any }> = {
  alta: {
    label: 'VIP',
    color: 'text-amber-700',
    bg: 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50',
    activeBg: 'bg-amber-500 text-white border-amber-500',
    icon: Star,
  },
  boa: {
    label: 'Regular',
    color: 'text-emerald-700',
    bg: 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    activeBg: 'bg-emerald-600 text-white border-emerald-600',
    icon: TrendingUp,
  },
  neutro: {
    label: 'Novo',
    color: 'text-blue-700',
    bg: 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50',
    activeBg: 'bg-blue-600 text-white border-blue-600',
    icon: User,
  },
  baixa: {
    label: 'Atenção',
    color: 'text-red-700',
    bg: 'bg-white border border-red-200 text-red-700 hover:bg-red-50',
    activeBg: 'bg-red-500 text-white border-red-500',
    icon: AlertTriangle,
  },
}

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'name', label: 'Nome A–Z' },
  { value: 'recent', label: 'Mais recentes' },
  { value: 'most_bookings', label: 'Mais agendamentos' },
  { value: 'least_active', label: 'Menos ativos' },
]

type SortOption = 'name' | 'recent' | 'oldest' | 'most_bookings' | 'least_active'

const PAGE_SIZE = 20

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [reputationFilter, setReputationFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [showInactive, setShowInactive] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, reputationFilter, sortBy, showInactive])

  const loadClients = async () => {
    setIsLoading(true)
    try {
      const response = await clientsApi.list({ limit: 500 })
      if (response.success) setClients(response.data.clients)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await clientsApi.list({ limit: 500 })
      if (response.success) setClients(response.data.clients)
    } catch (error) {
      console.error('Erro ao atualizar clientes:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    return phone
  }

  const filteredClients = (() => {
    let filtered = [...clients]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.cpf?.includes(term)
      )
    }

    if (reputationFilter !== 'all') {
      filtered = filtered.filter(c => c.reputation === reputationFilter)
    }

    if (showInactive) {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      filtered = filtered.filter(c => {
        if (!c.updatedAt) return true
        return new Date(c.updatedAt) < ninetyDaysAgo
      })
    }

    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'most_bookings':
        filtered.sort((a, b) => b.totalBookings - a.totalBookings)
        break
      case 'least_active':
        filtered.sort((a, b) => new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime())
        break
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name))
    }

    return filtered
  })()

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE))
  const pagedClients = filteredClients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const stats = {
    total: clients.length,
    vips: clients.filter(c => c.reputation === 'alta').length,
    atencao: clients.filter(c => c.reputation === 'baixa').length,
    novos: clients.filter(c => c.reputation === 'neutro').length,
  }

  return (
    <div className="min-h-[100dvh] pt-20 lg:pt-8 pb-16 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 mb-1">Clientes</h1>
              <p className="text-gray-500 text-sm">
                {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all disabled:opacity-50 self-start sm:self-auto"
              title="Atualizar"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <Star className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{stats.vips}</p>
                <p className="text-xs text-gray-500">VIPs</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{stats.atencao}</p>
                <p className="text-xs text-gray-500">Atenção</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{stats.novos}</p>
                <p className="text-xs text-gray-500">Novos</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-light pl-11 pr-4"
            />
          </div>
        </motion.div>

        {/* Pill Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 space-y-2">
          {/* Reputação */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setReputationFilter('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                reputationFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              Todos
            </button>
            {Object.entries(reputationConfig).map(([key, cfg]) => {
              const Icon = cfg.icon
              const isActive = reputationFilter === key
              return (
                <button
                  key={key}
                  onClick={() => setReputationFilter(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    isActive ? cfg.activeBg : cfg.bg
                  }`}
                >
                  <Icon size={12} />
                  {cfg.label}
                </button>
              )
            })}
          </div>

          {/* Sort + Toggle inativos */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              <ArrowUpDown size={14} className="text-gray-400 ml-1" />
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value as SortOption)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    sortBy === opt.value
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowInactive(v => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                showInactive
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              Inativos +90 dias
            </button>
          </div>
        </motion.div>

        {/* Client List */}
        <div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {pagedClients.map((client, index) => {
                  const reputation = reputationConfig[client.reputation] || reputationConfig.neutro
                  const ReputationIcon = reputation.icon
                  const rate = client.totalBookings > 0
                    ? Math.round((client.completedBookings / client.totalBookings) * 100)
                    : null

                  return (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Link
                        to={`/admin/clientes/${client.id}`}
                        className="block bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-base">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-800 truncate col-primary">
                                {client.name}
                              </h3>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                                reputationFilter === client.reputation
                                  ? reputation.activeBg
                                  : `bg-gray-50 ${reputation.color} border-gray-200`
                              }`}>
                                <ReputationIcon className="w-3 h-3" />
                                {reputation.label}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" />
                                {formatPhone(client.phone)}
                              </span>
                              {client.email && (
                                <span className="flex items-center gap-1 truncate col-hide-mobile">
                                  <Mail className="w-3.5 h-3.5" />
                                  {client.email}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 col-secondary">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {client.totalBookings} agendamento{client.totalBookings !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                {client.completedBookings} concluído{client.completedBookings !== 1 ? 's' : ''}
                              </span>
                              {client.noShowCount > 0 && (
                                <span className="flex items-center gap-1 text-orange-500">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {client.noShowCount} falta{client.noShowCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Taxa */}
                          {rate !== null && (
                            <div className={`flex-col items-center justify-center px-3 py-2 rounded-xl border hidden sm:flex ${
                              rate >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                : rate >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200'
                                : 'text-red-600 bg-red-50 border-red-200'
                            }`}>
                              <span className="text-base font-bold">{rate}%</span>
                              <span className="text-[10px] opacity-70">taxa</span>
                            </div>
                          )}

                          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 col-action" />
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-6 flex items-center justify-between"
          >
            <p className="text-sm text-gray-500">
              Mostrando {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredClients.length)}–{Math.min(currentPage * PAGE_SIZE, filteredClients.length)} de {filteredClients.length}
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
