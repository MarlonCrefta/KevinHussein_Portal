import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, XCircle, RefreshCw, Power, Smartphone,
  CheckCircle, Clock, PartyPopper, Save, RotateCcw,
  Eye, EyeOff, Copy, Check
} from 'lucide-react'
import { useWhatsApp } from '../../hooks'
import { messagesApi } from '../../services/api'

// Helper para templates de mensagem
const messageConfigService = {
  renderTemplate: (templateMessage: string, data: Record<string, string>) => {
    let result = templateMessage
    result = result.replace(/{nome}/g, data.clientName || '')
    result = result.replace(/{telefone}/g, data.clientPhone || '')
    result = result.replace(/{email}/g, data.clientEmail || '')
    result = result.replace(/{tipo}/g, data.bookingType || '')
    result = result.replace(/{data}/g, data.bookingDate || '')
    result = result.replace(/{hora}/g, data.bookingTime || '')
    result = result.replace(/{id}/g, data.bookingId || '')
    return result
  },
  getAvailableVariables: () => [
    { name: 'nome', description: 'Nome do cliente' },
    { name: 'telefone', description: 'Telefone do cliente' },
    { name: 'email', description: 'Email do cliente' },
    { name: 'tipo', description: 'Tipo do agendamento' },
    { name: 'data', description: 'Data do agendamento' },
    { name: 'hora', description: 'Hora do agendamento' },
    { name: 'id', description: 'ID do agendamento' },
  ]
}

interface MessageTemplate {
  enabled: boolean
  message: string
}

interface TemplateConfig {
  type: 'confirmation' | 'completion' | 'reminder'
  subject: string
  description: string
}

const templateConfigs: Record<string, TemplateConfig> = {
  confirmation: {
    type: 'confirmation',
    subject: 'Confirmação de Agendamento',
    description: 'Enviada automaticamente após confirmação de agendamento'
  },
  completion: {
    type: 'completion',
    subject: 'Sessão Concluída',
    description: 'Enviada automaticamente após conclusão da sessão'
  },
  reminder: {
    type: 'reminder',
    subject: 'Lembrete de Agendamento',
    description: 'Enviada automaticamente 24h antes do agendamento'
  }
}

type TabType = 'connection' | 'confirmation' | 'completion' | 'reminder'

export default function AdminWhatsApp() {
  const { isConnected, isConnecting, qrCode, clientInfo, connect, disconnect } = useWhatsApp()
  const [activeTab, setActiveTab] = useState<TabType>('connection')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Message templates
  const [confirmationTemplate, setConfirmationTemplate] = useState<MessageTemplate>({
    enabled: true,
    message: `🎨 Kevin Hussein Tattoo Studio

Olá, {nome}!

✅ Seu agendamento foi confirmado com sucesso!

📋 Detalhes do Agendamento:
* Tipo: {tipo}
* Data: {data}
* Horário: {hora}

📍 Localização:
Rua João Batista Palu 91

📞 Contato:
(41) 99648-1275

⚠️ Importante:
Em caso de imprevistos, avise com antecedência.
Não comparecimentos sem aviso podem resultar em cobrança antecipada no próximo agendamento.

Nos vemos em breve! 🖤`
  })
  const [completionTemplate, setCompletionTemplate] = useState<MessageTemplate>({
    enabled: true,
    message: `🎨 Kevin Hussein Tattoo Studio

Olá, {nome}!

✨ Obrigado por sua visita!

Foi um prazer te atender. Esperamos que tenha gostado do resultado!

📸 Se puder, compartilhe uma foto da sua nova tattoo nas redes sociais e nos marque!

📅 Para novos agendamentos, acesse nosso site ou entre em contato.

Até a próxima! 🖤`
  })
  const [reminderTemplate, setReminderTemplate] = useState<MessageTemplate>({
    enabled: true,
    message: `🎨 Kevin Hussein Tattoo Studio

Olá, {nome}!

⏰ Lembrete: Seu agendamento é amanhã!

📋 Detalhes:
* Tipo: {tipo}
* Data: {data}
* Horário: {hora}

📍 Endereço:
Rua João Batista Palu 91

⚠️ Lembre-se:
- Chegue com 10 minutos de antecedência
- Em caso de imprevisto, avise o quanto antes

Até amanhã! 🖤`
  })
  
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copiedVar, setCopiedVar] = useState<string | null>(null)

  // Carregar templates do servidor
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await messagesApi.getTemplates()
        if (response.success && response.data && response.data.length > 0) {
          response.data.forEach((t: any) => {
            // Só atualiza se tiver conteúdo válido
            const content = t.template || t.content
            const isEnabled = t.enabled !== undefined ? t.enabled : (t.active !== false)
            if (content && content.trim()) {
              if (t.type === 'confirmation') {
                setConfirmationTemplate({ enabled: isEnabled, message: content })
              } else if (t.type === 'followup') {
                // followup no backend = completion no frontend (Pós-Sessão)
                setCompletionTemplate({ enabled: isEnabled, message: content })
              } else if (t.type === 'reminder') {
                setReminderTemplate({ enabled: isEnabled, message: content })
              }
            }
          })
        }
      } catch (err) {
        console.error('Erro ao carregar templates:', err)
        // Mantém os padrões em caso de erro
      }
    }
    loadTemplates()
  }, [])

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await connect()
    } catch (err) {
      setError('Erro ao conectar com o servidor WhatsApp')
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await disconnect()
    } catch (err) {
      setError('Erro ao desconectar WhatsApp')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTemplate = async (type: 'confirmation' | 'completion' | 'reminder') => {
    const templateMap = {
      confirmation: confirmationTemplate,
      completion: completionTemplate,
      reminder: reminderTemplate
    }
    const current = templateMap[type]
    const newEnabled = !current.enabled
    
    // Atualizar estado local
    if (type === 'confirmation') setConfirmationTemplate({ ...current, enabled: newEnabled })
    if (type === 'completion') setCompletionTemplate({ ...current, enabled: newEnabled })
    if (type === 'reminder') setReminderTemplate({ ...current, enabled: newEnabled })
    
    // Salvar no backend
    try {
      const apiType = type === 'completion' ? 'followup' : type
      await messagesApi.updateTemplate(apiType, { enabled: newEnabled })
    } catch (err) {
      console.error('Erro ao salvar estado do template:', err)
    }
  }

  const handleSaveTemplate = async (type: 'confirmation' | 'completion' | 'reminder', templateContent: string) => {
    try {
      // Mapear tipo do frontend para o backend
      // completion no frontend = followup no backend (Pós-Sessão)
      const apiType = type === 'completion' ? 'followup' : type
      
      // Salvar via API com o nome correto do campo
      await messagesApi.updateTemplate(apiType, { template: templateContent })
      
      if (type === 'confirmation') setConfirmationTemplate(prev => ({ ...prev, message: templateContent }))
      if (type === 'completion') setCompletionTemplate(prev => ({ ...prev, message: templateContent }))
      if (type === 'reminder') setReminderTemplate(prev => ({ ...prev, message: templateContent }))
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      console.error('Erro ao salvar template:', err)
    }
  }

  const handleResetTemplate = async (type: 'confirmation' | 'completion' | 'reminder') => {
    const defaults: Record<string, string> = {
      confirmation: `🎨 Kevin Hussein Tattoo Studio

Olá, {nome}!

✅ Seu agendamento foi confirmado com sucesso!

📋 Detalhes do Agendamento:
* Tipo: {tipo}
* Data: {data}
* Horário: {hora}

📍 Localização:
Rua João Batista Palu 91

📞 Contato:
(41) 99648-1275

⚠️ Importante:
Em caso de imprevistos, avise com antecedência.
Não comparecimentos sem aviso podem resultar em cobrança antecipada no próximo agendamento.

Nos vemos em breve! 🖤`,
      completion: `🎨 Kevin Hussein Tattoo Studio

Olá, {nome}!

✨ Obrigado por sua visita!

Foi um prazer te atender. Esperamos que tenha gostado do resultado!

📸 Se puder, compartilhe uma foto da sua nova tattoo nas redes sociais e nos marque!

📅 Para novos agendamentos, acesse nosso site ou entre em contato.

Até a próxima! 🖤`,
      reminder: `🎨 Kevin Hussein Tattoo Studio

Olá, {nome}!

⏰ Lembrete: Seu agendamento é amanhã!

📋 Detalhes:
* Tipo: {tipo}
* Data: {data}
* Horário: {hora}

📍 Endereço:
Rua João Batista Palu 91

⚠️ Lembre-se:
- Chegue com 10 minutos de antecedência
- Em caso de imprevisto, avise o quanto antes

Até amanhã! 🖤`
    }
    
    // Atualizar estado local
    if (type === 'confirmation') setConfirmationTemplate({ enabled: true, message: defaults[type] })
    if (type === 'completion') setCompletionTemplate({ enabled: true, message: defaults[type] })
    if (type === 'reminder') setReminderTemplate({ enabled: true, message: defaults[type] })
    
    // Salvar no backend
    try {
      const apiType = type === 'completion' ? 'followup' : type
      await messagesApi.updateTemplate(apiType, { template: defaults[type], enabled: true })
    } catch (err) {
      console.error('Erro ao resetar template:', err)
    }
  }

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{${variable}}`)
    setCopiedVar(variable)
    setTimeout(() => setCopiedVar(null), 2000)
  }

  const renderPreview = (template: MessageTemplate) => {
    const sampleData = {
      clientName: 'João Silva',
      clientPhone: '(41) 99999-9999',
      clientEmail: 'joao@email.com',
      bookingType: 'Reunião de Criação',
      bookingDate: 'segunda-feira, 6 de janeiro de 2026',
      bookingTime: '14:00',
      bookingId: 'booking_123'
    }
    return messageConfigService.renderTemplate(template.message, sampleData)
  }

  const tabs = [
    { id: 'connection' as TabType, label: 'Conexão', icon: Smartphone },
    { id: 'confirmation' as TabType, label: 'Agendamentos', icon: CheckCircle },
    { id: 'completion' as TabType, label: 'Realizações', icon: PartyPopper },
    { id: 'reminder' as TabType, label: 'Lembretes', icon: Clock },
  ]

  const availableVariables = messageConfigService.getAvailableVariables()

  return (
    <div className="min-h-screen bg-slate-50 pt-20 lg:pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">WhatsApp</h1>
          <p className="text-gray-500">Configure a conexão e mensagens automáticas</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3"
          >
            <XCircle size={20} className="text-error" />
            <div>
              <p className="text-error font-medium">Erro de Conexão</p>
              <p className="text-error/80 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Connection Tab */}
          {activeTab === 'connection' && (
            <motion.div
              key="connection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <ConnectionPanel
                isConnected={isConnected}
                qrCode={qrCode}
                clientInfo={clientInfo}
                loading={loading || isConnecting}
                handleStart={handleStart}
                handleDisconnect={handleDisconnect}
              />
            </motion.div>
          )}

          {/* Confirmation Tab */}
          {activeTab === 'confirmation' && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TemplateEditor
                template={confirmationTemplate}
                config={templateConfigs.confirmation}
                saveSuccess={saveSuccess}
                copiedVar={copiedVar}
                availableVariables={availableVariables}
                onToggle={() => handleToggleTemplate('confirmation')}
                onSave={(template: string) => handleSaveTemplate('confirmation', template)}
                onReset={() => handleResetTemplate('confirmation')}
                onCopyVariable={copyVariable}
                renderPreview={renderPreview}
              />
            </motion.div>
          )}

          {/* Completion Tab */}
          {activeTab === 'completion' && (
            <motion.div
              key="completion"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TemplateEditor
                template={completionTemplate}
                config={templateConfigs.completion}
                saveSuccess={saveSuccess}
                copiedVar={copiedVar}
                availableVariables={availableVariables}
                onToggle={() => handleToggleTemplate('completion')}
                onSave={(template: string) => handleSaveTemplate('completion', template)}
                onReset={() => handleResetTemplate('completion')}
                onCopyVariable={copyVariable}
                renderPreview={renderPreview}
              />
            </motion.div>
          )}

          {/* Reminder Tab */}
          {activeTab === 'reminder' && (
            <motion.div
              key="reminder"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TemplateEditor
                template={reminderTemplate}
                config={templateConfigs.reminder}
                saveSuccess={saveSuccess}
                copiedVar={copiedVar}
                availableVariables={availableVariables}
                onToggle={() => handleToggleTemplate('reminder')}
                onSave={(template: string) => handleSaveTemplate('reminder', template)}
                onReset={() => handleResetTemplate('reminder')}
                onCopyVariable={copyVariable}
                renderPreview={renderPreview}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Connection Panel Component
function ConnectionPanel({ isConnected, qrCode, clientInfo, loading, handleStart, handleDisconnect }: any) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isConnected ? 'bg-emerald-100' : 'bg-indigo-100'
          }`}>
            <MessageSquare size={20} className={isConnected ? 'text-emerald-600' : 'text-indigo-600'} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Status da Conexão</h2>
            <p className="text-gray-500 text-sm">
              {isConnected ? 'Conectado e pronto para enviar mensagens' : 'Aguardando conexão'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600 text-sm font-medium">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-slate-500 text-sm font-medium">Offline</span>
            </div>
          )}
        </div>
      </div>

      {isConnected && clientInfo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 rounded-xl bg-gray-50 border border-gray-200 mb-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <Smartphone size={18} className="text-indigo-600" />
            <span className="text-gray-800 font-medium">Conta Conectada</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nome:</span>
              <span className="text-gray-800 font-medium">{clientInfo.name || clientInfo.pushname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Número:</span>
              <span className="text-gray-800 font-medium">{clientInfo.phone || clientInfo.wid}</span>
            </div>
          </div>
        </motion.div>
      )}

      {!isConnected && qrCode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-8"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Escaneie o QR Code
              </h2>
              <p className="text-gray-600 text-sm">
                Use o WhatsApp do seu celular para escanear
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-4 mb-6 border-2 border-gray-200 flex justify-center">
              <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
                  1
                </div>
                <p>Abra o WhatsApp no seu celular</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
                  2
                </div>
                <p>Toque em <strong className="text-gray-900">Mais opções</strong> ou <strong className="text-gray-900">Configurações</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
                  3
                </div>
                <p>Toque em <strong className="text-gray-900">Dispositivos conectados</strong> e depois em <strong className="text-gray-900">Conectar dispositivo</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
                  4
                </div>
                <p>Aponte seu celular para esta tela para escanear o código</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
            <RefreshCw size={16} className="animate-spin" />
            <span>Aguardando conexão...</span>
          </div>
        </motion.div>
      )}

      {!isConnected && !qrCode && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <MessageSquare size={64} className="mx-auto mb-6 text-gray-400" />
            <h3 className="text-gray-800 text-xl font-semibold mb-3">WhatsApp não está conectado</h3>
            <p className="text-gray-500 mb-8">Clique no botão abaixo para gerar o QR Code</p>
            
            <button
              onClick={handleStart}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Gerando QR Code...
                </>
              ) : (
                <>
                  <Power size={20} />
                  Conectar WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {isConnected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle size={48} className="text-white" />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                WhatsApp Conectado!
              </h2>
              <p className="text-gray-600 text-sm">
                Sua conta está conectada e pronta para enviar mensagens
              </p>
            </div>

            {/* User Info */}
            {clientInfo && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageSquare size={24} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{clientInfo.name || clientInfo.pushname}</p>
                    <p className="text-sm text-gray-600">+{clientInfo.phone || clientInfo.wid}</p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
            )}

            {/* Info Cards */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Sessão Salva</p>
                  <p className="text-xs text-gray-600">Não precisa reconectar ao reiniciar</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <MessageSquare size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Mensagens Automáticas</p>
                  <p className="text-xs text-gray-600">Configure nas abas acima</p>
                </div>
              </div>
            </div>

            {/* Disconnect Button */}
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Desconectando...' : 'Desconectar WhatsApp'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Template Editor Component
interface TemplateEditorProps {
  template: MessageTemplate
  config: TemplateConfig
  saveSuccess: boolean
  copiedVar: string | null
  availableVariables: Array<{ name: string; description: string }>
  onToggle: () => void
  onSave: (template: string) => void
  onReset: () => void
  onCopyVariable: (variable: string) => void
  renderPreview: (template: MessageTemplate) => string
}

function TemplateEditor({ 
  template, 
  config,
  saveSuccess,
  copiedVar,
  availableVariables,
  onToggle, 
  onSave, 
  onReset,
  onCopyVariable,
  renderPreview
}: TemplateEditorProps) {
  const [localTemplate, setLocalTemplate] = useState(template.message)
  const [hasChanges, setHasChanges] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    setLocalTemplate(template.message)
    setHasChanges(false)
  }, [template])

  const handleChange = (value: string) => {
    setLocalTemplate(value)
    setHasChanges(value !== template.message)
  }

  const handleSave = () => {
    onSave(localTemplate)
    setHasChanges(false)
  }

  const handleReset = () => {
    onReset()
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">{config.subject}</h2>
            <p className="text-gray-500 text-sm">
              {config.description}
            </p>
          </div>
          <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              template.enabled
                ? 'bg-emerald-100 border-emerald-200 text-emerald-600'
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
          >
            {template.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
            <span className="font-medium">{template.enabled ? 'Ativado' : 'Desativado'}</span>
          </button>
        </div>

        {!template.enabled && (
          <div className="p-3 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 text-sm">
            ⚠️ Esta mensagem está desativada e não será enviada automaticamente
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Editor */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Editor de Mensagem</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-indigo-200 text-sm transition-all"
              >
                {showPreview ? 'Editar' : 'Visualizar'}
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
                {renderPreview(template)}
              </div>
            </div>
          ) : (
            <textarea
              value={localTemplate}
              onChange={(e) => handleChange(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-mono text-sm resize-none transition-all"
              placeholder="Digite a mensagem..."
            />
          )}

          <div className="flex items-center justify-end mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-indigo-200 transition-all"
              >
                <RotateCcw size={16} />
                Restaurar Padrão
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveSuccess ? (
                  <>
                    <Check size={16} />
                    Salvo!
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Variables */}
        <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Variáveis Disponíveis</h3>
          <p className="text-gray-500 text-sm mb-4">
            Clique para copiar e cole no template
          </p>
          <div className="space-y-2">
            {availableVariables.map((variable) => (
              <button
                key={variable.name}
                onClick={() => onCopyVariable(variable.name)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-indigo-200 hover:bg-gray-100 text-left transition-all group"
              >
                <div>
                  <div className="text-gray-800 text-sm font-mono">{`{${variable.name}}`}</div>
                  <div className="text-gray-400 text-xs">{variable.description}</div>
                </div>
                {copiedVar === variable.name ? (
                  <Check size={16} className="text-emerald-500" />
                ) : (
                  <Copy size={16} className="text-gray-500 group-hover:text-indigo-600 transition-colors" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
