/**
 * Constantes do Sistema
 * Kevin Hussein Tattoo Studio
 * 
 * Centraliza valores fixos para evitar "magic strings" espalhadas pelo código.
 */

/** Status possíveis de um agendamento */
export const BOOKING_STATUS = {
  PENDENTE: 'pendente',
  CONFIRMADO: 'confirmado',
  CANCELADO: 'cancelado',
  CONCLUIDO: 'concluido',
  NAO_COMPARECEU: 'nao_compareceu',
};

/** Tipos de agendamento */
export const BOOKING_TYPE = {
  REUNIAO: 'reuniao',
  TESTE_ANATOMICO: 'teste_anatomico',
  SESSAO: 'sessao',
};

/** Níveis de reputação do cliente */
export const CLIENT_REPUTATION = {
  NEUTRO: 'neutro',
  BOA: 'boa',
  ALTA: 'alta',
  BAIXA: 'baixa',
};

/** Roles de usuário */
export const USER_ROLE = {
  ADMIN: 'admin',
};

/** Tipos de mensagem */
export const MESSAGE_TYPE = {
  CONFIRMATION: 'confirmacao',
  REMINDER: 'lembrete',
  CANCELLATION: 'cancelamento',
  FOLLOWUP: 'followup',
};

/** Dias da semana e suas atividades */
export const SCHEDULE = {
  MONDAY: { day: 1, activity: null }, // Folga
  TUESDAY: { day: 2, activity: BOOKING_TYPE.TESTE_ANATOMICO },
  WEDNESDAY: { day: 3, activity: BOOKING_TYPE.REUNIAO },
  THURSDAY: { day: 4, activity: BOOKING_TYPE.SESSAO },
  FRIDAY: { day: 5, activity: BOOKING_TYPE.SESSAO },
  SATURDAY: { day: 6, activity: BOOKING_TYPE.SESSAO },
  SUNDAY: { day: 0, activity: BOOKING_TYPE.SESSAO },
};

/** Horários padrão do estúdio */
export const DEFAULT_TIMES = ['10:00', '12:00', '14:00', '16:00', '18:00'];

/** Limites de paginação */
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 200,
  DEFAULT_OFFSET: 0,
};

export default {
  BOOKING_STATUS,
  BOOKING_TYPE,
  CLIENT_REPUTATION,
  USER_ROLE,
  MESSAGE_TYPE,
  SCHEDULE,
  DEFAULT_TIMES,
  PAGINATION,
};
