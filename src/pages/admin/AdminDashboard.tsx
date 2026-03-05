import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Users, Plus, ChevronRight, ChevronLeft, Wifi, WifiOff, MessageCircle, Ruler, Palette, AlertCircle, CheckCircle, Ban, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addWeeks, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useBookings } from '../../hooks'
import { useAuthContext } from '../../contexts'
import { Booking, bookingsApi, clientsApi, whatsappApi, Client } from '../../services/api'

// Configuração fixa do cronograma do Kevin
const scheduleConfig: Record<number, { type: string; label: string; icon: any; color: string; bgColor: string; borderColor: string; dotColor: string; textColor: string }> = {
  2: { type: 'teste_anatomico', label: 'Teste Anatômico', icon: Ruler, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', dotColor: 'bg-amber-500', textColor: 'text-amber-700' },
  3: { type: 'reuniao', label: 'Reunião', icon: MessageCircle, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', dotColor: 'bg-violet-500', textColor: 'text-violet-700' },
  4: { type: 'sessao', label: 'Sessão', icon: Palette, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', dotColor: 'bg-cyan-500', textColor: 'text-cyan-700' },
  5: { type: 'sessao', label: 'Sessão', icon: Palette, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', dotColor: 'bg-cyan-500', textColor: 'text-cyan-700' },
  6: { type: 'sessao', label: 'Sessão', icon: Palette, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', dotColor: 'bg-cyan-500', textColor: 'text-cyan-700' },
  0: { type: 'sessao', label: 'Sessão', icon: Palette, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', dotColor: 'bg-cyan-500', textColor: 'text-cyan-700' },
}

const typeColors: Record<string, { bg: string; text: string; dot: string }> = {
  sessao: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  reuniao: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  teste_anatomico: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
}

const statusIcons: Record<string, { icon: any; color: string }> = {
  pendente: { icon: AlertCircle, color: 'text-amber-500' },
  confirmado: { icon: CheckCircle, color: 'text-emerald-500' },
  concluido: { icon: CheckCircle, color: 'text-blue-500' },
  cancelado: { icon: Ban, color: 'text-red-400' },
  nao_compareceu: { icon: Ban, color: 'text-orange-500' },
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
          whatsappApi.getStatus().catch(() => ({ success: false, data: { isReady: false } }))
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
      dayOfWeek: getDay(dia),
      schedule: scheduleConfig[getDay(dia)] || null,
      agendamentos: allBookings
        .filter(b => isSameDay(parseISO(b.date), dia) && b.status !== 'cancelado')
        .sort((a, b) => a.time.localeCompare(b.time))
    }))
  }, [allBookings, weekOffset])

  // Dados do dia atual
  const todayData = useMemo(() => {
    const today = new Date()
    const todayBookings = allBookings
      .filter(b => isSameDay(parseISO(b.date), today) && b.status !== 'cancelado')
      .sort((a, b) => a.time.localeCompare(b.time))
    const dayOfWeek = getDay(today)
    const schedule = scheduleConfig[dayOfWeek] || null
    return { bookings: todayBookings, schedule, dayOfWeek }
  }, [allBookings])

  // Stats da semana atual
  const weekStats = useMemo(() => {
    const baseDate = addWeeks(new Date(), weekOffset)
    const inicio = startOfWeek(baseDate, { weekStartsOn: 0 })
    const fim = endOfWeek(baseDate, { weekStartsOn: 0 })
    
    const weekBookings = allBookings.filter(b => {
      const d = parseISO(b.date)
      return d >= inicio && d <= fim && b.status !== 'cancelado'
    })
    
    return {
      total: weekBookings.length,
      reunioes: weekBookings.filter(b => b.type === 'reuniao').length,
      testes: weekBookings.filter(b => b.type === 'teste_anatomico').length,
      sessoes: weekBookings.filter(b => b.type === 'sessao').length,
      pendentes: weekBookings.filter(b => b.status === 'pendente').length,
      confirmados: weekBookings.filter(b => b.status === 'confirmado').length,
    }
  }, [allBookings, weekOffset])

  const getGreeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  }

  const getDayTypeName = (dayOfWeek: number) => {
    const names: Record<number, string> = {
      0: 'Sessão', 1: 'Folga', 2: 'Teste Anatômico', 3: 'Reunião', 4: 'Sessão', 5: 'Sessão', 6: 'Sessão'
    }
    return names[dayOfWeek] || 'Folga'
  }

  return (
    <div className="min-h-[100dvh] pt-20 lg:pt-8 pb-16 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        {/* ══════════════════════════════════════════
            HEADER
            ══════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/LOGO SEM FUNDO.png" alt="KH" className="w-12 h-12 object-contain hidden lg:block" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{getGreeting()}, {user?.name || 'Kevin'}</h1>
                <p className="text-gray-500 text-sm capitalize">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${whatsappReady ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {whatsappReady ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span className="hidden sm:inline">WhatsApp</span>
              </div>
              <Link to="/admin/vagas" className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium shadow-sm">
                <Plus size={16} /> Publicar
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════
            CARD: HOJE
            ══════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <div className={`rounded-2xl border-2 p-5 ${todayData.schedule ? `${todayData.schedule.bgColor} ${todayData.schedule.borderColor}` : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {todayData.schedule ? (
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${todayData.schedule.bgColor} border ${todayData.schedule.borderColor}`}>
                    <todayData.schedule.icon size={22} className={todayData.schedule.color} />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gray-100 border border-gray-200">
                    <Clock size={22} className="text-gray-400" />
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-gray-800 text-lg">Hoje — {getDayTypeName(todayData.dayOfWeek)}</h2>
                  <p className="text-gray-500 text-sm">
                    {todayData.bookings.length === 0 
                      ? todayData.schedule ? 'Nenhum agendamento para hoje' : 'Dia de folga' 
                      : `${todayData.bookings.length} agendamento${todayData.bookings.length > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
              {todayData.bookings.length > 0 && (
                <span className={`text-2xl font-bold ${todayData.schedule?.color || 'text-gray-600'}`}>
                  {todayData.bookings.length}
                </span>
              )}
            </div>

            {/* Lista de agendamentos de hoje */}
            {todayData.bookings.length > 0 && (
              <div className="space-y-2">
                {todayData.bookings.map(apt => {
                  const StatusIcon = statusIcons[apt.status]?.icon || AlertCircle
                  const statusColor = statusIcons[apt.status]?.color || 'text-gray-400'
                  return (
                    <Link
                      key={apt.id}
                      to={`/admin/agendamentos/${apt.id}`}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="text-center min-w-[48px]">
                        <p className="text-lg font-bold text-gray-800">{apt.time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{apt.clientName}</p>
                        <p className="text-xs text-gray-500">{apt.clientPhone}</p>
                      </div>
                      <StatusIcon size={18} className={statusColor} />
                      <ChevronRight size={16} className="text-gray-300" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════
            STATS DA SEMANA
            ══════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              <p className="text-xs text-gray-500 font-medium">Reuniões</p>
            </div>
            <p className="text-2xl font-bold text-violet-600">{weekStats.reunioes}</p>
            <p className="text-[10px] text-gray-400">esta semana</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <p className="text-xs text-gray-500 font-medium">Testes</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{weekStats.testes}</p>
            <p className="text-[10px] text-gray-400">esta semana</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <p className="text-xs text-gray-500 font-medium">Sessões</p>
            </div>
            <p className="text-2xl font-bold text-cyan-600">{weekStats.sessoes}</p>
            <p className="text-[10px] text-gray-400">esta semana</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={12} className="text-amber-500" />
              <p className="text-xs text-gray-500 font-medium">Pendentes</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{weekStats.pendentes}</p>
            <p className="text-[10px] text-gray-400">aguardando</p>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════
            CALENDÁRIO SEMANAL COM CRONOGRAMA FIXO
            ══════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <h2 className="font-semibold text-gray-800">
                  {format(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 0 }), "d MMM", { locale: ptBR })} — {format(endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 0 }), "d MMM yyyy", { locale: ptBR })}
                </h2>
                {weekOffset === 0 && <span className="text-xs text-violet-600 font-medium">Semana Atual</span>}
                {weekOffset !== 0 && (
                  <button onClick={() => setWeekOffset(0)} className="text-xs text-violet-600 font-medium hover:underline">
                    Voltar para hoje
                  </button>
                )}
              </div>
              <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Grid Semanal */}
            <div className="grid grid-cols-7 divide-x divide-gray-100">
              {weekData.map(({ dia, schedule, agendamentos }) => {
                const isHoje = isToday(dia)
                const isWorkDay = !!schedule
                const ScheduleIcon = schedule?.icon || Clock
                
                return (
                  <div key={dia.toISOString()} className={`min-h-[220px] flex flex-col ${isHoje ? 'bg-violet-50/40' : !isWorkDay ? 'bg-gray-50/50' : ''}`}>
                    {/* Dia Header */}
                    <div className={`px-2 py-2.5 text-center border-b ${isHoje ? 'bg-violet-100 border-violet-200' : 'bg-gray-50 border-gray-100'}`}>
                      <p className={`text-[10px] uppercase font-bold tracking-wider ${isHoje ? 'text-violet-600' : 'text-gray-400'}`}>
                        {format(dia, 'EEE', { locale: ptBR })}
                      </p>
                      <p className={`text-xl font-bold ${isHoje ? 'text-violet-700' : 'text-gray-700'}`}>
                        {format(dia, 'd')}
                      </p>
                      {/* Tipo do dia */}
                      {schedule ? (
                        <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${schedule.bgColor} ${schedule.textColor} border ${schedule.borderColor}`}>
                          <ScheduleIcon size={9} />
                          {schedule.label}
                        </div>
                      ) : (
                        <p className="mt-1 text-[9px] text-gray-300 font-medium">Folga</p>
                      )}
                    </div>
                    
                    {/* Agendamentos do Dia */}
                    <div className="p-1.5 space-y-1 flex-1">
                      {agendamentos.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-[10px] text-gray-300">{isWorkDay ? '—' : ''}</p>
                        </div>
                      ) : (
                        agendamentos.map(apt => {
                          const colors = typeColors[apt.type] || typeColors.sessao
                          return (
                            <Link
                              key={apt.id}
                              to={`/admin/agendamentos/${apt.id}`}
                              className={`block p-1.5 rounded-lg text-[10px] ${colors.bg} border ${apt.status === 'pendente' ? 'border-amber-200' : 'border-transparent'} hover:opacity-80 transition-all`}
                            >
                              <div className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                <span className={`font-bold ${colors.text}`}>{apt.time}</span>
                              </div>
                              <p className="text-gray-700 truncate font-medium mt-0.5">{apt.clientName.split(' ')[0]}</p>
                              {apt.status === 'pendente' && (
                                <span className="text-[8px] text-amber-600 font-semibold">⏳ Pendente</span>
                              )}
                            </Link>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legenda e Cronograma Fixo */}
            <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Reunião <span className="text-gray-400">(Qua)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Teste <span className="text-gray-400">(Ter)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Sessão <span className="text-gray-400">(Qui-Dom)</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">Horários: 10h · 12h · 14h · 16h · 18h</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════
            RESUMO GERAL + LINKS RÁPIDOS
            ══════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link to="/admin/vagas" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:shadow-sm transition-all text-center">
            <Calendar size={22} className="text-violet-600" />
            <span className="text-xs font-medium text-gray-700">Publicar Horários</span>
          </Link>
          <Link to="/admin/agendamentos" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-center">
            <Clock size={22} className="text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Agendamentos</span>
          </Link>
          <Link to="/admin/clientes" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-center">
            <Users size={22} className="text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Clientes ({clients.length})</span>
          </Link>
          <Link to="/admin/whatsapp" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition-all text-center">
            <Wifi size={22} className="text-emerald-600" />
            <span className="text-xs font-medium text-gray-700">WhatsApp</span>
          </Link>
          <Link to="/admin/configuracoes" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-center">
            <Settings size={22} className="text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Configurações</span>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
