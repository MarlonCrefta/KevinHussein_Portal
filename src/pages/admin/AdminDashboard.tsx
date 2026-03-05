import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Users, Plus, ChevronRight, Wifi, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useBookings } from '../../hooks'
import { useAuthContext } from '../../contexts'
import { Booking, bookingsApi, clientsApi, whatsappApi, Client } from '../../services/api'

const typeColors: Record<string, { bg: string; text: string; dot: string }> = {
  sessao: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  reuniao: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  teste_anatomico: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
}

export default function AdminDashboard() {
  const { user } = useAuthContext()
  const { fetchStats } = useBookings()
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [whatsappReady, setWhatsappReady] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      await fetchStats()
      try {
        const [bookingsRes, clientsRes, wpRes] = await Promise.all([
          bookingsApi.list({ limit: 500 }),
          clientsApi.list({ limit: 500 }),
          whatsappApi.getStatus()
        ])
        if (bookingsRes.success) setAllBookings(bookingsRes.data.bookings)
        if (clientsRes.success) setClients(clientsRes.data.clients)
        if (wpRes.success) setWhatsappReady(wpRes.data.isReady)
      } catch (e) { console.error(e) }
    }
    loadData()
  }, [fetchStats])

  const weekData = useMemo(() => {
    const baseDate = addWeeks(new Date(), weekOffset)
    const inicio = startOfWeek(baseDate, { weekStartsOn: 0 })
    const fim = endOfWeek(baseDate, { weekStartsOn: 0 })
    const dias = eachDayOfInterval({ start: inicio, end: fim })
    
    return dias.map(dia => ({
      dia,
      agendamentos: allBookings
        .filter(b => isSameDay(parseISO(b.date), dia) && b.status !== 'cancelado')
        .sort((a, b) => a.time.localeCompare(b.time))
    }))
  }, [allBookings, weekOffset])

  const stats = useMemo(() => {
    const ativos = allBookings.filter(b => b.status !== 'cancelado')
    const sessoes = ativos.filter(b => b.type === 'sessao')
    const reunioes = ativos.filter(b => b.type === 'reuniao')
    const pendentes = ativos.filter(b => b.status === 'pendente')
    return { sessoes: sessoes.length, reunioes: reunioes.length, pendentes: pendentes.length, clientes: clients.length }
  }, [allBookings, clients])

  const getGreeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  }

  return (
    <div className="min-h-[100dvh] pt-20 lg:pt-8 pb-16 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{getGreeting()}, {user?.name || 'Kevin'}</h1>
              <p className="text-gray-500 text-sm">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${whatsappReady ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {whatsappReady ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span className="hidden sm:inline">WhatsApp</span>
              </div>
              <Link to="/admin/vagas" className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium">
                <Plus size={16} /> Novo
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Simples */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-bold text-cyan-600">{stats.sessoes}</p>
            <p className="text-xs text-gray-500">Sessões</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-bold text-violet-600">{stats.reunioes}</p>
            <p className="text-xs text-gray-500">Reuniões</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-bold text-amber-600">{stats.pendentes}</p>
            <p className="text-xs text-gray-500">Pendentes</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-bold text-gray-700">{stats.clientes}</p>
            <p className="text-xs text-gray-500">Clientes</p>
          </div>
        </motion.div>

        {/* Calendário Semanal */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header do Calendário */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <ChevronRight size={18} className="rotate-180" />
              </button>
              <div className="text-center">
                <h2 className="font-semibold text-gray-800">
                  {format(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 0 }), "d MMM", { locale: ptBR })} - {format(endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 0 }), "d MMM yyyy", { locale: ptBR })}
                </h2>
                {weekOffset === 0 && <span className="text-xs text-violet-600 font-medium">Semana Atual</span>}
              </div>
              <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Grid Semanal */}
            <div className="grid grid-cols-7 divide-x divide-gray-100">
              {weekData.map(({ dia, agendamentos }) => {
                const isHoje = isToday(dia)
                return (
                  <div key={dia.toISOString()} className={`min-h-[180px] ${isHoje ? 'bg-violet-50/50' : ''}`}>
                    {/* Dia Header */}
                    <div className={`px-2 py-3 text-center border-b border-gray-100 ${isHoje ? 'bg-violet-100' : 'bg-gray-50'}`}>
                      <p className={`text-[10px] uppercase font-medium ${isHoje ? 'text-violet-600' : 'text-gray-400'}`}>
                        {format(dia, 'EEE', { locale: ptBR })}
                      </p>
                      <p className={`text-lg font-bold ${isHoje ? 'text-violet-700' : 'text-gray-700'}`}>
                        {format(dia, 'd')}
                      </p>
                    </div>
                    
                    {/* Agendamentos do Dia */}
                    <div className="p-1.5 space-y-1">
                      {agendamentos.length === 0 ? (
                        <p className="text-[10px] text-gray-300 text-center py-4">-</p>
                      ) : (
                        agendamentos.map(apt => (
                          <Link
                            key={apt.id}
                            to={`/admin/agendamentos/${apt.id}`}
                            className={`block p-1.5 rounded-lg text-[10px] ${typeColors[apt.type].bg} hover:opacity-80 transition-opacity`}
                          >
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${typeColors[apt.type].dot}`} />
                              <span className={`font-medium ${typeColors[apt.type].text}`}>{apt.time}</span>
                            </div>
                            <p className="text-gray-700 truncate font-medium mt-0.5">{apt.clientName.split(' ')[0]}</p>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legenda */}
            <div className="flex items-center justify-center gap-6 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-cyan-500" /> Sessão
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-violet-500" /> Reunião
              </div>
            </div>
          </div>
        </motion.div>

        {/* Links Rápidos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/admin/vagas" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-violet-300 transition-colors">
            <Calendar size={20} className="text-violet-600" />
            <span className="text-sm font-medium text-gray-700">Vagas</span>
          </Link>
          <Link to="/admin/agendamentos" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
            <Clock size={20} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Agendamentos</span>
          </Link>
          <Link to="/admin/clientes" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
            <Users size={20} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Clientes</span>
          </Link>
          <Link to="/admin/whatsapp" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 transition-colors">
            <Wifi size={20} className="text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">WhatsApp</span>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

