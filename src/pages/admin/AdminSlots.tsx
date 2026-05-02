import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Calendar, Clock, ChevronLeft, ChevronRight, Check, CheckCircle, UserPlus, Search, X, User, Phone, AlertTriangle } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, parseISO, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useSlots } from '../../hooks'
import { clientsApi, bookingsApi, Client } from '../../services/api'

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type SlotType = 'reuniao' | 'teste_anatomico' | 'sessao'

// Regras de agenda definidas pelo Kevin. Para alterar dias ou horários,
// editar allowedDays (0=Dom,1=Seg,2=Ter,3=Qua,4=Qui,5=Sex,6=Sáb) e timeSlots abaixo.
const agendaConfig: Record<SlotType, {
  label: string
  sublabel: string
  step: string
  allowedDays: number[]
  timeSlots: string[]
  duration: number
  color: string
  bgLight: string
  bgBadge: string
  borderColor: string
}> = {
  reuniao: {
    label: 'Reunião Estratégica',
    sublabel: 'Meet — Alinhamento do projeto',
    step: '1ª Etapa',
    allowedDays: [3],
    timeSlots: ['10:00', '12:00', '14:00', '16:00', '18:00'],
    duration: 120,
    color: 'text-violet-600',
    bgLight: 'bg-violet-50',
    bgBadge: 'bg-violet-100',
    borderColor: 'border-violet-200',
  },
  teste_anatomico: {
    label: 'Teste Anatômico',
    sublabel: 'Aplicação do desenho no corpo',
    step: '2ª Etapa',
    allowedDays: [2],
    timeSlots: ['10:00', '12:00', '14:00', '16:00', '18:00'],
    duration: 120,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50',
    bgBadge: 'bg-amber-100',
    borderColor: 'border-amber-200',
  },
  sessao: {
    label: 'Sessão de Tatuagem',
    sublabel: 'Execução da tattoo',
    step: '3ª Etapa',
    allowedDays: [0, 4, 5, 6],
    timeSlots: ['10:00', '12:00', '14:00', '16:00', '18:00'],
    duration: 120,
    color: 'text-cyan-600',
    bgLight: 'bg-cyan-50',
    bgBadge: 'bg-cyan-100',
    borderColor: 'border-cyan-200',
  },
}

const slotTypes: SlotType[] = ['reuniao', 'teste_anatomico', 'sessao']

export default function AdminSlots() {
  const { slots, fetchSlots, createMany, deleteSlot } = useSlots()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<SlotType>('reuniao')

  // Feedback de publicação
  const [publishResult, setPublishResult] = useState<{ created: number; skipped: number } | null>(null)

  // Bulk delete
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)

  // Modal Agendar Sessão
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [sessionDate, setSessionDate] = useState('')
  const [sessionTime, setSessionTime] = useState('')
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [sessionSuccess, setSessionSuccess] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isLoadingClients, setIsLoadingClients] = useState(false)

  const activeConfig = agendaConfig[selectedType]

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  useEffect(() => {
    if (showSessionModal) loadClients()
  }, [showSessionModal])

  // Reset bulk selection when type changes
  useEffect(() => {
    setSelectedSlots(new Set())
  }, [selectedType])

  const loadClients = async () => {
    setIsLoadingClients(true)
    try {
      const response = await clientsApi.list({ limit: 500 })
      if (response.success && response.data?.clients) setClients(response.data.clients)
      else setClients([])
    } catch { setClients([]) }
    finally { setIsLoadingClients(false) }
  }

  const filteredClients = clients.filter(client => {
    if (!clientSearch) return true
    const search = clientSearch.toLowerCase()
    return client.name.toLowerCase().includes(search) || client.phone.includes(search) || (client.cpf && client.cpf.includes(search))
  })

  // Heatmap: occupancy per day for the current type
  const dayOccupancy = useMemo(() => {
    const map: Record<string, { total: number; booked: number }> = {}
    slots
      .filter(s => s.type === selectedType)
      .forEach(s => {
        if (!map[s.date]) map[s.date] = { total: 0, booked: 0 }
        map[s.date].total++
        if (s.bookingId) map[s.date].booked++
      })
    return map
  }, [slots, selectedType])

  // Conflict detection: selected date+time already published for this type
  const conflictingCombos = useMemo(() => {
    const set = new Set<string>()
    slots
      .filter(s => s.type === selectedType)
      .forEach(s => set.add(`${s.date}|${s.time}`))
    return set
  }, [slots, selectedType])

  const hasConflict = selectedDates.some(date =>
    selectedTimes.some(time => conflictingCombos.has(`${format(date, 'yyyy-MM-dd')}|${time}`))
  )

  const handleCreateSession = async () => {
    if (!selectedClient || !sessionDate || !sessionTime) return
    setIsCreatingSession(true)
    setSessionError(null)
    try {
      const response = await bookingsApi.create({
        type: 'sessao',
        date: sessionDate,
        time: sessionTime,
        clientName: selectedClient.name,
        clientEmail: selectedClient.email || '',
        clientPhone: selectedClient.phone,
        clientCpf: selectedClient.cpf || '',
        clientMessage: 'Sessão agendada pelo admin',
      })
      if (response.success) {
        setSessionSuccess(true)
        setTimeout(() => { closeSessionModal(); fetchSlots() }, 1500)
      } else {
        setSessionError('Não foi possível criar o agendamento. Tente novamente.')
      }
    } catch (err: any) {
      setSessionError(err.message || 'Erro ao criar agendamento. Tente novamente.')
    } finally { setIsCreatingSession(false) }
  }

  const closeSessionModal = () => {
    setShowSessionModal(false)
    setSelectedClient(null)
    setSessionDate('')
    setSessionTime('')
    setClientSearch('')
    setSessionSuccess(false)
    setSessionError(null)
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    return phone
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart)
  const paddedDays = [...Array(startPadding).fill(null), ...days]

  const toggleDate = (date: Date) => {
    setSelectedDates(prev => {
      const exists = prev.some(d => isSameDay(d, date))
      return exists ? prev.filter(d => !isSameDay(d, date)) : [...prev, date]
    })
  }

  const toggleTime = (time: string) => {
    setSelectedTimes(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time])
  }

  const handlePublishSlots = async () => {
    const slotsToPublish = selectedDates.flatMap(date =>
      selectedTimes.map(time => ({
        date: format(date, 'yyyy-MM-dd'),
        time,
        type: selectedType,
        duration: activeConfig.duration,
      }))
    )
    const result = await createMany(slotsToPublish)
    setPublishResult(result)
    setTimeout(() => setPublishResult(null), 5000)
    if (result.created > 0 || result.skipped > 0) {
      await fetchSlots()
      setSelectedDates([])
      setSelectedTimes([])
    }
  }

  const handleChangeType = (type: SlotType) => {
    setSelectedType(type)
    setSelectedDates([])
    setSelectedTimes([])
  }

  const removeSlot = async (id: string) => {
    await deleteSlot(id)
  }

  // Bulk delete handlers
  const toggleSlotSelection = (id: string) => {
    setSelectedSlots(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = (typeSlots: typeof slots) => {
    const allIds = typeSlots.map(s => s.id)
    const allSelected = allIds.every(id => selectedSlots.has(id))
    setSelectedSlots(prev => {
      const next = new Set(prev)
      if (allSelected) allIds.forEach(id => next.delete(id))
      else allIds.forEach(id => next.add(id))
      return next
    })
  }

  const handleBulkDelete = async (typeSlots: typeof slots) => {
    const toDelete = typeSlots.filter(s => selectedSlots.has(s.id))
    if (toDelete.length === 0) return
    const confirmed = window.confirm(`Excluir ${toDelete.length} vaga${toDelete.length > 1 ? 's' : ''}? Reservas existentes não serão afetadas.`)
    if (!confirmed) return
    setIsDeletingBulk(true)
    try {
      await Promise.all(toDelete.map(s => deleteSlot(s.id)))
      setSelectedSlots(new Set())
    } finally { setIsDeletingBulk(false) }
  }

  const getDayName = (days: number[]) => {
    const names: Record<number, string> = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sab' }
    return days.map(d => names[d]).join(', ')
  }

  const getHeatmapStyle = (dateStr: string) => {
    const occ = dayOccupancy[dateStr]
    if (!occ || occ.total === 0) return ''
    const ratio = occ.booked / occ.total
    if (ratio === 1) return 'ring-1 ring-red-300 bg-red-50'
    if (ratio > 0.5) return 'ring-1 ring-amber-300 bg-amber-50'
    return 'ring-1 ring-emerald-300 bg-emerald-50'
  }

  return (
    <div className="min-h-[100dvh] pt-20 lg:pt-8 pb-16 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Gerenciar Agenda</h1>
              <p className="text-gray-500 mt-1 text-sm">Publique vagas por etapa do processo criativo</p>
            </div>
            <button onClick={() => setShowSessionModal(true)} className="btn btn-admin-primary btn-md">
              <UserPlus size={20} />
              Agendar Sessão
            </button>
          </div>

          {/* Seletor de tipo */}
          <div className="grid grid-cols-3 gap-3">
            {slotTypes.map(type => {
              const cfg = agendaConfig[type]
              const count = slots.filter(s => s.type === type).length
              const isActive = selectedType === type
              return (
                <button
                  key={type}
                  onClick={() => handleChangeType(type)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${isActive ? `${cfg.bgLight} ${cfg.borderColor} shadow-sm` : 'bg-white border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? cfg.color : 'text-gray-400'}`}>
                      {cfg.step}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? cfg.bgBadge + ' ' + cfg.color : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  </div>
                  <p className={`font-semibold text-sm ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>{cfg.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{getDayName(cfg.allowedDays)} &middot; 2h</p>
                </button>
              )
            })}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Publicar Vagas */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl ${activeConfig.bgBadge} flex items-center justify-center`}>
                  <Calendar size={20} className={activeConfig.color} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Publicar {activeConfig.label}</h2>
                  <p className="text-sm text-gray-500">{activeConfig.sublabel} &middot; Apenas {getDayName(activeConfig.allowedDays)}</p>
                </div>
              </div>

              {/* Legenda heatmap */}
              <div className="flex items-center gap-3 mb-4 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-1 ring-emerald-300 bg-emerald-50 inline-block" /> Com vagas</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-1 ring-amber-300 bg-amber-50 inline-block" /> &gt;50% reservado</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-1 ring-red-300 bg-red-50 inline-block" /> Lotado</span>
              </div>

              {/* Navegação do mês */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <ChevronLeft size={20} className="text-gray-500" />
                </button>
                <h3 className="font-medium text-gray-800 capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <ChevronRight size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Cabeçalho dias da semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day, i) => (
                  <div key={day} className={`text-center text-xs font-medium py-2 rounded ${activeConfig.allowedDays.includes(i) ? activeConfig.color + ' font-bold' : 'text-gray-400'}`}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendário com heatmap */}
              <div className="grid grid-cols-7 gap-1 mb-5">
                {paddedDays.map((day, index) => {
                  if (!day) return <div key={`empty-${index}`} className="aspect-square" />

                  const dayOfWeek = getDay(day)
                  const isAllowed = activeConfig.allowedDays.includes(dayOfWeek)
                  const isSelected = selectedDates.some(d => isSameDay(d, day))
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isTodayDate = isToday(day)
                  const isPast = day < new Date() && !isToday(day)
                  const isDisabled = isPast || !isAllowed
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const heatmap = !isDisabled && !isSelected ? getHeatmapStyle(dateStr) : ''
                  const occ = dayOccupancy[dateStr]

                  return (
                    <div key={day.toISOString()} className="relative group">
                      <button
                        onClick={() => !isDisabled && toggleDate(day)}
                        disabled={isDisabled}
                        className={`
                          aspect-square w-full min-h-[2rem] rounded-lg flex items-center justify-center text-sm transition-all relative
                          ${isDisabled
                            ? 'text-gray-300 cursor-not-allowed'
                            : isSelected
                              ? 'bg-indigo-600 text-white font-bold shadow-lg'
                              : isCurrentMonth && isAllowed
                                ? `text-gray-700 hover:opacity-90 font-medium ${heatmap || 'hover:bg-gray-50'}`
                                : 'text-gray-300'
                          }
                        `}
                      >
                        {format(day, 'd')}
                        {isTodayDate && !isSelected && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600" />
                        )}
                      </button>
                      {/* Tooltip ocupação */}
                      {occ && occ.total > 0 && !isSelected && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {occ.total - occ.booked} livre{occ.total - occ.booked !== 1 ? 's' : ''} / {occ.total} total
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Horários */}
              <div className="mb-5">
                <label className="block text-gray-700 text-sm font-medium mb-3">
                  Horários (blocos de {activeConfig.duration / 60}h)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {activeConfig.timeSlots.map((time: string) => {
                    const isConflict = selectedDates.some(d => conflictingCombos.has(`${format(d, 'yyyy-MM-dd')}|${time}`))
                    return (
                      <button
                        key={time}
                        onClick={() => toggleTime(time)}
                        className={`py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                          selectedTimes.includes(time)
                            ? 'bg-indigo-600 text-white'
                            : isConflict
                              ? 'bg-amber-50 border border-amber-300 text-amber-700'
                              : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200'
                        }`}
                      >
                        {time}
                        {isConflict && !selectedTimes.includes(time) && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Aviso de conflito */}
              {hasConflict && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-700 text-sm">
                    Alguns horários selecionados já têm vagas publicadas. Publicar novamente não duplica — vagas existentes serão ignoradas.
                  </p>
                </div>
              )}

              {/* Resumo */}
              {selectedDates.length > 0 && selectedTimes.length > 0 && (
                <div className={`p-4 ${activeConfig.bgLight} border ${activeConfig.borderColor} rounded-xl mb-5`}>
                  <p className={`${activeConfig.color} text-sm`}>
                    <strong>{selectedDates.length}</strong> dia(s) &times; <strong>{selectedTimes.length}</strong> horário(s) =
                    <strong className="ml-1">{selectedDates.length * selectedTimes.length}</strong> vagas
                  </p>
                </div>
              )}

              <button
                onClick={handlePublishSlots}
                disabled={selectedDates.length === 0 || selectedTimes.length === 0}
                className="btn btn-admin-primary btn-md w-full"
              >
                <Plus size={20} />
                Publicar {activeConfig.label}
              </button>

              {publishResult && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium mt-3 ${
                  publishResult.created > 0 ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-amber-50 border border-amber-200 text-amber-700'
                }`}>
                  {publishResult.created > 0 ? <CheckCircle size={16} className="flex-shrink-0" /> : <AlertTriangle size={16} className="flex-shrink-0" />}
                  <span>
                    {publishResult.created > 0
                      ? `${publishResult.created} vaga${publishResult.created !== 1 ? 's' : ''} publicada${publishResult.created !== 1 ? 's' : ''}`
                      : 'Nenhuma vaga nova criada'}
                    {publishResult.skipped > 0 && ` · ${publishResult.skipped} já existia${publishResult.skipped !== 1 ? 'm' : ''}`}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Lista de Slots Publicados */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-4">
            {slotTypes.map(type => {
              const cfg = agendaConfig[type]
              const typeSlots = slots.filter(s => s.type === type).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
              const selectedInType = typeSlots.filter(s => selectedSlots.has(s.id))
              const allSelected = typeSlots.length > 0 && typeSlots.every(s => selectedSlots.has(s.id))
              const isActive = selectedType === type

              return (
                <div key={type} className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${isActive ? cfg.borderColor + ' border-2' : 'border-gray-200'}`}>
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.bgBadge}`} />
                    <h3 className="font-semibold text-gray-800 flex-1">{cfg.label}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${cfg.bgBadge} ${cfg.color}`}>{typeSlots.length}</span>
                  </div>

                  {typeSlots.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <p className="text-sm">Nenhuma vaga</p>
                    </div>
                  ) : (
                    <>
                      {/* Bulk actions */}
                      <div className="flex items-center gap-2 mb-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => toggleSelectAll(typeSlots)}
                            className="w-3.5 h-3.5 rounded accent-indigo-600"
                          />
                          <span className="text-xs text-gray-500">Selecionar tudo</span>
                        </label>
                        {selectedInType.length > 0 && (
                          <button
                            onClick={() => handleBulkDelete(typeSlots)}
                            disabled={isDeletingBulk}
                            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            Excluir ({selectedInType.length})
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                        {typeSlots.map(slot => {
                          const isChecked = selectedSlots.has(slot.id)
                          return (
                            <div
                              key={slot.id}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                                isChecked
                                  ? 'bg-indigo-50 border-indigo-200'
                                  : `${cfg.bgLight}/50 ${cfg.borderColor}/50`
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSlotSelection(slot.id)}
                                className="w-3.5 h-3.5 rounded accent-indigo-600 flex-shrink-0"
                              />
                              <div className={`w-9 h-9 rounded-lg ${cfg.bgBadge} flex flex-col items-center justify-center flex-shrink-0`}>
                                <span className={`${cfg.color} text-xs font-bold leading-none`}>
                                  {format(parseISO(slot.date), 'd')}
                                </span>
                                <span className={`${cfg.color} text-[9px] uppercase opacity-70`}>
                                  {format(parseISO(slot.date), 'EEE', { locale: ptBR })}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-800 text-sm font-medium">{slot.time}</p>
                                {slot.bookingId ? (
                                  <span className="text-[11px] text-red-500">Reservado</span>
                                ) : (
                                  <span className="text-[11px] text-emerald-600">Disponível</span>
                                )}
                              </div>
                              <button
                                onClick={() => removeSlot(slot.id)}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>

      {/* Modal Agendar Sessão */}
      <AnimatePresence>
        {showSessionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={closeSessionModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                    <Clock size={20} className="text-cyan-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Agendar Sessão</h2>
                    <p className="text-sm text-gray-500">Para cliente específico</p>
                  </div>
                </div>
                <button onClick={closeSessionModal} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
                {sessionSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-cyan-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Sessão Agendada!</h3>
                    <p className="text-gray-500">A sessão foi agendada com sucesso.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                      {selectedClient ? (
                        <div className="flex items-center gap-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                          <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center">
                            <span className="text-white font-semibold">{selectedClient.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{selectedClient.name}</p>
                            <p className="text-sm text-gray-500">{formatPhone(selectedClient.phone)}</p>
                          </div>
                          <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-cyan-100 rounded-lg transition-colors">
                            <X size={16} className="text-cyan-600" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Buscar por nome, telefone ou CPF..."
                              value={clientSearch}
                              onChange={e => setClientSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                            {isLoadingClients ? (
                              <div className="p-6 text-center">
                                <div className="w-8 h-8 border-2 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Carregando...</p>
                              </div>
                            ) : filteredClients.length === 0 ? (
                              <div className="p-6 text-center text-gray-500">
                                <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="font-medium text-sm">{clients.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}</p>
                              </div>
                            ) : (
                              filteredClients.slice(0, 10).map(client => (
                                <button
                                  key={client.id}
                                  onClick={() => setSelectedClient(client)}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-cyan-50 transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-medium text-sm">{client.name.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-800 text-sm">{client.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <Phone className="w-3 h-3" />
                                      {formatPhone(client.phone)}
                                    </div>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data *</label>
                        <input
                          type="date"
                          value={sessionDate}
                          onChange={e => setSessionDate(e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Horário *</label>
                        <select
                          value={sessionTime}
                          onChange={e => setSessionTime(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="">Selecione...</option>
                          {agendaConfig.sessao.timeSlots.map((time: string) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-amber-700 text-sm">
                        <strong>Nota:</strong> O cliente receberá uma notificação automática por WhatsApp.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {!sessionSuccess && (
                <div className="p-5 border-t border-gray-100 bg-gray-50">
                  {sessionError && (
                    <p className="text-red-600 text-sm mb-3 text-center">{sessionError}</p>
                  )}
                  <button
                    onClick={handleCreateSession}
                    disabled={!selectedClient || !sessionDate || !sessionTime || isCreatingSession}
                    className="btn btn-admin-primary btn-md w-full"
                  >
                    {isCreatingSession ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Agendando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Plus size={20} />
                        Agendar Sessão
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
  )
}
