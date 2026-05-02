import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Clock,
  DollarSign,
  AlertTriangle,
  Save,
  Check,
  RefreshCw,
  Store,
  MapPin,
  Instagram,
  Phone,
  MessageSquare,
  Bell,
} from 'lucide-react'
import { settingsApi, Settings as SettingsType } from '../../services/api'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
    </label>
  )
}

export default function AdminSettings() {
  const [, setSettings] = useState<SettingsType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Regras de agendamento
  const [lateTolerance, setLateTolerance] = useState('20')
  const [noShowChargeEnabled, setNoShowChargeEnabled] = useState(false)
  const [noShowChargeAmount, setNoShowChargeAmount] = useState('0')
  const [sessionDepositAmount, setSessionDepositAmount] = useState('270')
  const [sessionDepositRequired, setSessionDepositRequired] = useState(true)

  // Info do estúdio
  const [studioName, setStudioName] = useState('')
  const [studioAddress, setStudioAddress] = useState('')
  const [studioHours, setStudioHours] = useState('')
  const [studioInstagram, setStudioInstagram] = useState('')
  const [studioWhatsapp, setStudioWhatsapp] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')

  // Notificações WhatsApp
  const [waSendConfirmation, setWaSendConfirmation] = useState(true)
  const [waSendReminder, setWaSendReminder] = useState(true)
  const [waSendCompletion, setWaSendCompletion] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await settingsApi.getAll()
      if (response.success && response.data) {
        const d = response.data
        setSettings(d)
        setLateTolerance(d.late_tolerance_minutes || '20')
        setNoShowChargeEnabled(d.no_show_charge_enabled === 'true')
        setNoShowChargeAmount(d.no_show_charge_amount || '0')
        setSessionDepositAmount(d.session_deposit_amount || '270')
        setSessionDepositRequired(d.session_deposit_required !== 'false')
        setStudioName(d.studio_name || '')
        setStudioAddress(d.studio_address || '')
        setStudioHours(d.studio_hours || '')
        setStudioInstagram(d.studio_instagram || '')
        setStudioWhatsapp(d.studio_whatsapp || '')
        setWelcomeMessage(d.welcome_message || '')
        setWaSendConfirmation(d.wa_send_confirmation !== 'false')
        setWaSendReminder(d.wa_send_reminder !== 'false')
        setWaSendCompletion(d.wa_send_completion !== 'false')
      }
    } catch {
      setError('Erro ao carregar configurações')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    setError(null)
    try {
      const response = await settingsApi.updateMany({
        late_tolerance_minutes: lateTolerance,
        no_show_charge_enabled: String(noShowChargeEnabled),
        no_show_charge_amount: noShowChargeAmount,
        session_deposit_amount: sessionDepositAmount,
        session_deposit_required: String(sessionDepositRequired),
        studio_name: studioName,
        studio_address: studioAddress,
        studio_hours: studioHours,
        studio_instagram: studioInstagram,
        studio_whatsapp: studioWhatsapp,
        welcome_message: welcomeMessage,
        wa_send_confirmation: String(waSendConfirmation),
        wa_send_reminder: String(waSendReminder),
        wa_send_completion: String(waSendCompletion),
      })
      if (response.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch {
      setError('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] pt-20 lg:pt-8 pb-16 px-4 sm:px-6 bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] pt-20 lg:pt-8 pb-16 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Settings size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Configurações</h1>
              <p className="text-gray-500 text-sm">Estúdio, agendamento e notificações</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        {saveSuccess && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
            <Check size={18} />
            Configurações salvas com sucesso!
          </motion.div>
        )}

        <div className="space-y-6">

          {/* ── Informações do Estúdio ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Store size={20} className="text-violet-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Informações do Estúdio</h2>
                <p className="text-sm text-gray-500">Dados exibidos no site público</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do estúdio</label>
                <input
                  type="text"
                  value={studioName}
                  onChange={e => setStudioName(e.target.value)}
                  placeholder="Kevin Hussein Tattoo"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin size={14} className="text-gray-400" /> Endereço / Bairro
                  </label>
                  <input
                    type="text"
                    value={studioAddress}
                    onChange={e => setStudioAddress(e.target.value)}
                    placeholder="Centro, São Paulo - SP"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Clock size={14} className="text-gray-400" /> Horário de funcionamento
                  </label>
                  <input
                    type="text"
                    value={studioHours}
                    onChange={e => setStudioHours(e.target.value)}
                    placeholder="Ter–Dom, 10h às 20h"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Instagram size={14} className="text-gray-400" /> Instagram
                  </label>
                  <input
                    type="text"
                    value={studioInstagram}
                    onChange={e => setStudioInstagram(e.target.value)}
                    placeholder="@kevinhussein.tattoo"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Phone size={14} className="text-gray-400" /> WhatsApp de contato
                  </label>
                  <input
                    type="text"
                    value={studioWhatsapp}
                    onChange={e => setStudioWhatsapp(e.target.value)}
                    placeholder="5541999998888"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">Somente dígitos: DDI + DDD + número (ex: 5541999998888)</p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <MessageSquare size={14} className="text-gray-400" /> Mensagem de boas-vindas
                </label>
                <textarea
                  value={welcomeMessage}
                  onChange={e => setWelcomeMessage(e.target.value)}
                  placeholder="Bem-vindo ao Kevin Hussein Tattoo Studio. Agende sua sessão abaixo."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
            </div>
          </motion.div>

          {/* ── Notificações WhatsApp ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Bell size={20} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Notificações WhatsApp</h2>
                <p className="text-sm text-gray-500">Envios automáticos para clientes</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Confirmação de agendamento', sub: 'Enviada ao confirmar uma sessão', value: waSendConfirmation, onChange: setWaSendConfirmation },
                { label: 'Lembrete 24h antes', sub: 'Lembrete automático no dia anterior', value: waSendReminder, onChange: setWaSendReminder },
                { label: 'Mensagem de conclusão', sub: 'Enviada após concluir a sessão', value: waSendCompletion, onChange: setWaSendCompletion },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                  </div>
                  <Toggle checked={item.value} onChange={item.onChange} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Tolerância de Atraso ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Tolerância de Atraso</h2>
                <p className="text-sm text-gray-500">Tempo máximo de espera após o horário marcado</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="60"
                value={lateTolerance}
                onChange={e => setLateTolerance(e.target.value)}
                className="w-24 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-600">minutos</span>
            </div>
            <p className="mt-3 text-xs text-gray-400">Após esse tempo, o cliente pode ser marcado como "não compareceu"</p>
          </motion.div>

          {/* ── Cobrança por Falta ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800">Cobrança por Falta</h2>
                  <Toggle checked={noShowChargeEnabled} onChange={setNoShowChargeEnabled} />
                </div>
                <p className="text-sm text-gray-500">Cobrar valor em caso de não comparecimento</p>
              </div>
            </div>
            {noShowChargeEnabled && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <span className="text-gray-600">Valor:</span>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">R$</span>
                  <input
                    type="number"
                    min="0"
                    value={noShowChargeAmount}
                    onChange={e => setNoShowChargeAmount(e.target.value)}
                    className="w-28 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Sinal por Sessão ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <DollarSign size={20} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800">Sinal por Sessão</h2>
                  <Toggle checked={sessionDepositRequired} onChange={setSessionDepositRequired} />
                </div>
                <p className="text-sm text-gray-500">Exigir sinal para confirmar sessão de tatuagem</p>
              </div>
            </div>
            {sessionDepositRequired && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <span className="text-gray-600">Valor do sinal:</span>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">R$</span>
                  <input
                    type="number"
                    min="0"
                    value={sessionDepositAmount}
                    onChange={e => setSessionDepositAmount(e.target.value)}
                    className="w-28 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
            <p className="mt-3 text-xs text-gray-400">O sinal será solicitado ao cliente antes de confirmar a sessão</p>
          </motion.div>
        </div>

        {/* Salvar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
          <button
            onClick={handleSave}
            disabled={isSaving || saveSuccess}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <><RefreshCw size={20} className="animate-spin" /> Salvando...</>
            ) : (
              <><Save size={20} /> Salvar Configurações</>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
