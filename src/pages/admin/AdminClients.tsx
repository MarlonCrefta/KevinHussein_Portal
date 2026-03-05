import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Users, 
  Search,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  Star,
  AlertTriangle,
  CheckCircle,
  User,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { clientsApi, Client } from '../../services/api'

const reputationConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  alta: { 
    label: 'VIP', 
    color: 'text-amber-600', 
    bg: 'bg-amber-50 border-amber-200',
    icon: Star
  },
  boa: { 
    label: 'Regular', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50 border-emerald-200',
    icon: TrendingUp
  },
  neutro: { 
    label: 'Novo', 
    color: 'text-blue-600', 
    bg: 'bg-blue-50 border-blue-200',
    icon: User
  },
  baixa: { 
    label: 'Atenção', 
    color: 'text-red-600', 
    bg: 'bg-red-50 border-red-200',
    icon: AlertTriangle
  },
}

type SortOption = 'name' | 'recent' | 'oldest' | 'most_bookings' | 'least_active'

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [reputationFilter, setReputationFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm, reputationFilter, sortBy, showInactive])

  const loadClients = async () => {
    setIsLoading(true)
    try {
      const response = await clientsApi.list({ limit: 500 })
      if (response.success) {
        setClients(response.data.clients)
      }
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
      if (response.success) {
        setClients(response.data.clients)
      }
    } catch (error) {
      console.error('Erro ao atualizar clientes:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const filterClients = () => {
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

    // Filtrar clientes inativos (sem agendamentos ou última atividade há mais de 90 dias)
    if (showInactive) {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      filtered = filtered.filter(c => {
        if (!c.updatedAt) return true
        const lastActivity = new Date(c.updatedAt)
        return lastActivity < ninetyDaysAgo
      })
    }

    // Ordenação
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
      case 'name':
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name))
    }

    setFilteredClients(filtered)
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  // Stats
  const stats = {
    total: clients.length,
    vips: clients.filter(c => c.reputation === 'alta').length,
    atencao: clients.filter(c => c.reputation === 'baixa').length,
    novos: clients.filter(c => c.reputation === 'neutro').length,
  }

  return (
    <div className="p-4 lg:p-8 pt-20 lg:pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Clientes</h1>
          <p className="text-gray-500">Gerencie sua base de clientes</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.vips}</p>
              <p className="text-xs text-gray-500">VIPs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.atencao}</p>
              <p className="text-xs text-gray-500">Atenção</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.novos}</p>
              <p className="text-xs text-gray-500">Novos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, telefone, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Reputation Filter */}
            <select
              value={reputationFilter}
              onChange={(e) => setReputationFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas reputações</option>
              <option value="alta">VIP</option>
              <option value="boa">Regular</option>
              <option value="neutro">Novo</option>
              <option value="baixa">Atenção</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name">Ordenar: Nome A-Z</option>
              <option value="recent">Ordenar: Mais recentes</option>
              <option value="oldest">Ordenar: Mais antigos</option>
              <option value="most_bookings">Ordenar: Mais agendamentos</option>
              <option value="least_active">Ordenar: Menos ativos</option>
            </select>
          </div>

          {/* Toggle Inativos */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
            <span className="text-sm text-gray-600">
              Mostrar apenas clientes inativos (+90 dias)
            </span>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Client List */}
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
        <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client, index) => {
              const reputation = reputationConfig[client.reputation] || reputationConfig.novo
              const ReputationIcon = reputation.icon

              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link
                    to={`/admin/clientes/${client.id}`}
                    className="block bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-lg">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {client.name}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${reputation.bg} ${reputation.color}`}>
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
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3.5 h-3.5" />
                              {client.email}
                            </span>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
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

                      {/* Taxa de Comparecimento */}
                      {client.totalBookings > 0 && (() => {
                        const rate = Math.round((client.completedBookings / client.totalBookings) * 100)
                        const rateColor = rate >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
                          : rate >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' 
                          : 'text-red-600 bg-red-50 border-red-200'
                        return (
                          <div className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl border ${rateColor}`}>
                            <span className="text-lg font-bold">{rate}%</span>
                            <span className="text-[10px] opacity-70">taxa</span>
                          </div>
                        )
                      })()}

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
