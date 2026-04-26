/**
 * Rotas de Agendamentos
 * Kevin Hussein Tattoo Studio
 */

import { Router } from 'express';
import { BookingModel, ClientModel, SlotModel, MessageTemplateModel } from '../models/index.js';
import { schedulerService } from '../services/index.js';
import { runTransaction } from '../config/database.js';
import { 
  authenticate, 
  optionalAuth,
  validate,
  bookingSchemas,
  asyncHandler,
  ApiError 
} from '../middleware/index.js';
import logger from '../config/logger.js';

const router = Router();

/**
 * GET /api/bookings
 * Lista agendamentos (autenticado = todos, público = apenas do cliente)
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status, type, search, startDate, endDate, limit, offset } = req.query;

  const bookings = BookingModel.findAll({
    status,
    type,
    search,
    startDate,
    endDate,
    limit: parseInt(limit) || 50,
    offset: parseInt(offset) || 0,
  });

  const total = BookingModel.count({ status, type, search, startDate, endDate });

  res.json({
    success: true,
    data: {
      bookings,
      total,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    },
  });
}));

/**
 * GET /api/bookings/stats
 * Estatísticas de agendamentos
 */
router.get('/stats', authenticate, (req, res) => {
  const stats = BookingModel.getStats();

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * GET /api/bookings/upcoming
 * Próximos agendamentos
 */
router.get('/upcoming', authenticate, (req, res) => {
  const { limit } = req.query;
  const bookings = BookingModel.findUpcoming(parseInt(limit) || 10);

  res.json({
    success: true,
    data: bookings,
  });
});

/**
 * GET /api/bookings/date/:date
 * Agendamentos por data
 */
router.get('/date/:date', authenticate, (req, res) => {
  const { date } = req.params;
  const bookings = BookingModel.findByDate(date);

  res.json({
    success: true,
    data: bookings,
  });
});

/**
 * GET /api/bookings/cpf/:cpf
 * Buscar agendamentos por CPF
 * - Autenticado (admin): retorna dados completos
 * - Público: retorna apenas tipo, status e datas (sem PII)
 */
router.get('/cpf/:cpf', optionalAuth, asyncHandler(async (req, res) => {
  const { cpf } = req.params;
  const cleanCpf = cpf.replace(/\D/g, '');

  if (cleanCpf.length !== 11) {
    throw ApiError.badRequest('CPF inválido');
  }

  const bookings = BookingModel.findByCpf(cleanCpf);
  const client = ClientModel.findByCpf(cleanCpf);

  // Admin autenticado: retorno completo
  if (req.user) {
    return res.json({
      success: true,
      data: { bookings, client: client || null },
    });
  }

  // Público: retorno mínimo sem PII
  const safeBookings = bookings.map(b => ({
    id: b.id,
    type: b.type,
    status: b.status,
    date: b.date,
    time: b.time,
  }));

  const safeClient = client ? {
    name: client.name,
    reputation: client.reputation,
  } : null;

  res.json({
    success: true,
    data: { bookings: safeBookings, client: safeClient },
  });
}));

/**
 * GET /api/bookings/:id
 * Detalhes de um agendamento
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = BookingModel.findById(id);

  if (!booking) {
    throw ApiError.notFound('Agendamento não encontrado');
  }

  res.json({
    success: true,
    data: booking,
  });
}));

/**
 * POST /api/bookings
 * Criar novo agendamento
 */
router.post('/', validate(bookingSchemas.create), asyncHandler(async (req, res) => {
  const { 
    type, date, time, duration,
    clientName, clientEmail, clientPhone, clientCpf, clientMessage 
  } = req.body;
  const normalizedCpf = clientCpf ? String(clientCpf).replace(/\D/g, '') : null;

  logger.info({ type, date, time, clientName }, 'Criando agendamento');

  // Transação atômica: cliente + booking + slot (tudo ou nada)
  const booking = runTransaction(() => {
    // Revalidar slot dentro da transação para evitar corrida em múltiplos cliques/requisições.
    const slot = SlotModel.findByDateTimeType(date, time, type);
    if (slot && !slot.is_available) {
      throw ApiError.conflict('Horário não disponível');
    }

    // Regras por etapa:
    // - Reunião: pode criar novo cliente
    // - Teste/Sessão: exige cliente já cadastrado (CPF existente)
    let client;
    if (type === 'reuniao') {
      client = ClientModel.findOrCreate({
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        cpf: normalizedCpf,
      });
    } else {
      if (!normalizedCpf) {
        throw ApiError.badRequest('CPF é obrigatório para este tipo de agendamento');
      }

      const hasCompletedMeeting = BookingModel.hasCompletedMeetingByCpf(normalizedCpf);
      if (!hasCompletedMeeting) {
        throw ApiError.badRequest('Acesso liberado somente para clientes com reunião concluída');
      }

      client = ClientModel.findByCpf(normalizedCpf);
      if (!client) {
        throw ApiError.badRequest('Para esta etapa, é necessário um cliente já cadastrado');
      }
    }

    if (!client || !client.id) {
      throw ApiError.internal('Erro ao criar cliente');
    }

    // Deduplicação: evita múltiplos cliques criando o mesmo agendamento ativo.
    const duplicate = BookingModel.findActiveDuplicate({
      type,
      date,
      time,
      clientCpf: normalizedCpf,
      clientPhone,
    });
    if (duplicate) {
      throw ApiError.conflict('Este agendamento já existe e está ativo');
    }

    // Incrementar contador de agendamentos do cliente
    ClientModel.incrementBookingCount(client.id);

    // Criar agendamento
    const newBooking = BookingModel.create({
      clientId: client.id,
      type,
      date,
      time,
      duration,
      clientName,
      clientEmail,
      clientPhone,
      clientCpf: normalizedCpf,
      clientMessage,
      clientReputation: client.reputation,
    });

    // Marcar slot como ocupado com guarda de concorrência
    if (slot) {
      const bookedSlot = SlotModel.markAsBooked(slot.id, newBooking.id);
      if (!bookedSlot) {
        throw ApiError.conflict('Horário acabou de ser reservado por outro cliente');
      }
    }

    return newBooking;
  });

  // Enviar confirmação via WhatsApp (assíncrono, não bloqueia resposta)
  schedulerService.sendConfirmation({
    id: booking.id,
    client_name: clientName,
    client_phone: clientPhone,
    date: date,
    time: time,
  }).catch(err => {
    console.error('Erro ao enviar confirmação WhatsApp:', err.message);
  });

  res.status(201).json({
    success: true,
    data: booking,
    message: 'Agendamento criado com sucesso',
  });
}));

/**
 * PUT /api/bookings/:id
 * Atualizar agendamento
 */
router.put('/:id', authenticate, validate(bookingSchemas.update), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existingBooking = BookingModel.findById(id);
  if (!existingBooking) {
    throw ApiError.notFound('Agendamento não encontrado');
  }

  const booking = BookingModel.update(id, req.body);

  res.json({
    success: true,
    data: booking,
    message: 'Agendamento atualizado',
  });
}));

/**
 * PATCH /api/bookings/:id/status
 * Atualizar apenas o status
 */
router.patch('/:id/status', authenticate, validate(bookingSchemas.updateStatus), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const existingBooking = BookingModel.findById(id);
  if (!existingBooking) {
    throw ApiError.notFound('Agendamento não encontrado');
  }

  // Atualizar reputação do cliente baseado no status
  if (status === 'concluido' && existingBooking.client_id) {
    ClientModel.recordCompletion(existingBooking.client_id);
  } else if (status === 'nao_compareceu' && existingBooking.client_id) {
    ClientModel.recordNoShow(existingBooking.client_id);
  }

  // Se cancelado, liberar slot
  if (status === 'cancelado') {
    const slot = SlotModel.findByDateTimeType(
      existingBooking.date, 
      existingBooking.time, 
      existingBooking.type
    );
    if (slot) {
      SlotModel.markAsAvailable(slot.id);
    }
  }

  const booking = BookingModel.updateStatus(id, status);

  res.json({
    success: true,
    data: booking,
    message: `Status atualizado para ${status}`,
  });
}));

/**
 * DELETE /api/bookings/:id
 * Deletar agendamento
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const booking = BookingModel.findById(id);
  if (!booking) {
    throw ApiError.notFound('Agendamento não encontrado');
  }

  // Liberar slot
  const slot = SlotModel.findByDateTimeType(booking.date, booking.time, booking.type);
  if (slot) {
    SlotModel.markAsAvailable(slot.id);
  }

  BookingModel.delete(id);

  res.json({
    success: true,
    message: 'Agendamento removido',
  });
}));

export default router;
