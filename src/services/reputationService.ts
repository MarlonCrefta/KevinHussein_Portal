// Serviço de Reputação de Clientes
// Utilitários de formatação e exibição de reputação
// Valores de reputação do backend: 'neutro' | 'boa' | 'alta' | 'baixa'

// Formata CPF para exibição (XXX.XXX.XXX-XX)
export function formatCPF(cpf: string): string {
  if (!cpf) return ''
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return cpf
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// Retorna label legível da reputação
export function getReputationLabel(reputation?: string): string {
  const labels: Record<string, string> = {
    neutro: 'Cliente Novo',
    boa: 'Cliente Regular',
    alta: 'Cliente VIP',
    baixa: 'Atenção',
  }
  return labels[reputation || 'neutro'] || 'Cliente Novo'
}

// Retorna classe de cor Tailwind para a reputação
export function getReputationColor(reputation?: string): string {
  const colors: Record<string, string> = {
    neutro: 'text-blue-600',
    boa: 'text-emerald-600',
    alta: 'text-amber-600',
    baixa: 'text-red-600',
  }
  return colors[reputation || 'neutro'] || 'text-blue-600'
}

// Retorna classe de cor de fundo para badge
export function getReputationBgColor(reputation?: string): string {
  const colors: Record<string, string> = {
    neutro: 'bg-blue-50 border-blue-200',
    boa: 'bg-emerald-50 border-emerald-200',
    alta: 'bg-amber-50 border-amber-200',
    baixa: 'bg-red-50 border-red-200',
  }
  return colors[reputation || 'neutro'] || 'bg-blue-50 border-blue-200'
}

const reputationService = {
  formatCPF,
  getReputationLabel,
  getReputationColor,
  getReputationBgColor,
}

export default reputationService
