/**
 * Rotas de Agendamentos
 * Kevin Hussein Tattoo Studio
 */

import { Router } from 'express';
import { BookingModel, ClientModel, SlotModel, MessageTemplateModel } from '../models/index.js';
import { schedulerService } from '../services/index.js';
import { 
  authenticate, 
  optionalAuth,
  validate,
  bookingSchemas,
  asyncHandler,
  ApiError 
} from '../middleware/index.js';

const router = Router();

/**
 * GET /api/bookings
 * Lista agendamentos (autenticado = todos, público = apenas do cliente)
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
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

  const total = BookingModel.count({ status, type });

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
router.get('/date/:date', optionalAuth, (req, res) => {
  const { date } = req.params;
  const bookings = BookingModel.findByDate(date);

  res.json({
    success: true,
    data: bookings,
  });
});

/**
 * GET /api/bookings/cpf/:cpf
 * Buscar agendamentos por CPF (público)
 */
router.get('/cpf/:cpf', asyncHandler(async (req, res) => {
  const { cpf } = req.params;
  const cleanCpf = cpf.replace(/\D/g, '');

  if (cleanCpf.length !== 11) {
    throw ApiError.badRequest('CPF inválido');
  }

  // Usar método específico para buscar por CPF
  const bookings = BookingModel.findByCpf(cleanCpf);

  // Buscar cliente para informações de reputação
  const client = ClientModel.findByCpf(cleanCpf);

  res.json({
    success: true,
    data: {
      bookings,
      client: client || null,
    },
  });
}));

/**
 * GET /api/bookings/:id
 * Detalhes de um agendamento
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
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

  console.log('📝 Criando agendamento:', { type, date, time, clientName, clientPhone, clientCpf });

  // Verificar se slot está disponível (se existir)
  const slot = SlotModel.findByDateTimeType(date, time, type);
  if (slot && !slot.is_available) {
    throw ApiError.conflict('Horário não disponível');
  }

  // Buscar ou criar cliente
  console.log('👤 Buscando/criando cliente...');
  const client = ClientModel.findOrCreate({
    name: clientName,
    email: clientEmail,
    phone: clientPhone,
    cpf: clientCpf,
  });
  console.log('👤 Cliente:', client);

  if (!client || !client.id) {
    throw ApiError.internal('Erro ao criar cliente');
  }

  // Incrementar contador de agendamentos do cliente
  ClientModel.incrementBookingCount(client.id);

  // Criar agendamento
  const booking = BookingModel.create({
    clientId: client.id,
    type,
    date,
    time,
    duration,
    clientName,
    clientEmail,
    clientPhone,
    clientCpf,
    clientMessage,
    clientReputation: client.reputation,
  });

  // Marcar slot como ocupado
  if (slot) {
    SlotModel.markAsBooked(slot.id, booking.id);
  }

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
