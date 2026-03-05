/**
 * Schemas de Validação com Zod
 * Kevin Hussein Tattoo Studio
 */

import { z } from 'zod';

// Regex para telefone brasileiro - aceita formato limpo (só dígitos) ou formatado
// Exemplos válidos: 41999308946, (41)99930-8946, (41) 99930-8946
const phoneRegex = /^(\d{10,11}|\(?[1-9]{2}\)?\s?9?[0-9]{4}-?[0-9]{4})$/;

// Regex para CPF - aceita formato limpo ou formatado
const cpfRegex = /^\d{11}$|^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

/**
 * Schemas de Autenticação
 */
export const authSchemas = {
  login: z.object({
    username: z.string().min(3, 'Usuário deve ter no mínimo 3 caracteres'),
    password: z.string().min(4, 'Senha deve ter no mínimo 4 caracteres'),
  }),

  register: z.object({
    username: z.string().min(3, 'Usuário deve ter no mínimo 3 caracteres'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    role: z.enum(['admin', 'user']).optional(),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
  }),
};

/**
 * Schemas de Cliente
 */
export const clientSchemas = {
  create: z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().regex(phoneRegex, 'Telefone inválido'),
    cpf: z.string().regex(cpfRegex, 'CPF inválido').optional().or(z.literal('')),
    notes: z.string().optional(),
  }),

  update: z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().regex(phoneRegex, 'Telefone inválido').optional(),
    cpf: z.string().regex(cpfRegex, 'CPF inválido').optional().or(z.literal('')),
    notes: z.string().optional(),
    reputation: z.enum(['alta', 'boa', 'neutro', 'baixa']).optional(),
  }),
};

/**
 * Schemas de Agendamento
 */
export const bookingSchemas = {
  create: z.object({
    type: z.enum(['reuniao', 'teste_anatomico', 'sessao', 'retoque']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (formato: HH:MM)'),
    duration: z.number().min(15).max(480).optional(),
    clientName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
    clientPhone: z.string().regex(phoneRegex, 'Telefone inválido'),
    clientCpf: z.string().regex(cpfRegex, 'CPF inválido').optional().or(z.literal('')),
    clientMessage: z.string().max(500, 'Mensagem muito longa').optional(),
  }),

  update: z.object({
    status: z.enum(['pendente', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu']).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido').optional(),
    duration: z.number().min(15).max(480).optional(),
    adminNotes: z.string().max(1000).optional(),
  }),

  updateStatus: z.object({
    status: z.enum(['pendente', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu']),
  }),
};

/**
 * Schemas de Slots
 */
export const slotSchemas = {
  create: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
    type: z.enum(['reuniao', 'teste_anatomico', 'sessao', 'retoque']),
    duration: z.number().min(15).max(480).optional(),
  }),

  createMany: z.object({
    slots: z.array(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      time: z.string().regex(/^\d{2}:\d{2}$/),
      type: z.enum(['reuniao', 'teste_anatomico', 'sessao', 'retoque']),
      duration: z.number().min(15).max(480).optional(),
    })).min(1, 'Deve ter pelo menos 1 slot'),
  }),
};

/**
 * Schemas de Mensagens
 */
export const messageSchemas = {
  send: z.object({
    phone: z.string().min(10, 'Telefone inválido'),
    message: z.string().min(1, 'Mensagem não pode ser vazia').max(4096, 'Mensagem muito longa'),
  }),

  updateTemplate: z.object({
    name: z.string().min(2).optional(),
    template: z.string().min(10).max(2000).optional(),
    enabled: z.boolean().optional(),
  }),
};

/**
 * Middleware de validação
 */
export function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: errors,
        });
      }

      // Substituir body pelos dados validados (com transformações se houver)
      req.body = result.data;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
      });
    }
  };
}

export default {
  authSchemas,
  clientSchemas,
  bookingSchemas,
  slotSchemas,
  messageSchemas,
  validate,
};
