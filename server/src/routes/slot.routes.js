/**
 * Rotas de Slots (Vagas)
 * Kevin Hussein Tattoo Studio
 */

import { Router } from 'express';
import { SlotModel } from '../models/index.js';
import { 
  authenticate, 
  optionalAuth,
  validate,
  slotSchemas,
  asyncHandler,
  ApiError 
} from '../middleware/index.js';

const router = Router();

/**
 * GET /api/slots
 * Lista slots com filtros
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { startDate, endDate, type, available } = req.query;

  const slots = SlotModel.findAll({
    startDate,
    endDate,
    type,
    available: available === 'true' ? true : available === 'false' ? false : undefined,
  });

  res.json({
    success: true,
    data: slots,
  });
}));

/**
 * GET /api/slots/available/:date
 * Lista slots disponíveis por data
 */
router.get('/available/:date', asyncHandler(async (req, res) => {
  const { date } = req.params;
  const { type } = req.query;

  const slots = SlotModel.findAvailableByDate(date, type);

  res.json({
    success: true,
    data: slots,
  });
}));

/**
 * GET /api/slots/date/:date
 * Lista todos slots por data (admin)
 */
router.get('/date/:date', authenticate, asyncHandler(async (req, res) => {
  const { date } = req.params;
  const slots = SlotModel.findByDate(date);

  res.json({
    success: true,
    data: slots,
  });
}));

/**
 * POST /api/slots
 * Criar um slot
 */
router.post('/', authenticate, validate(slotSchemas.create), asyncHandler(async (req, res) => {
  const { date, time, type, duration } = req.body;

  // Verificar se já existe
  const existing = SlotModel.findByDateTimeType(date, time, type);
  if (existing) {
    throw ApiError.conflict('Slot já existe para esta data, hora e tipo');
  }

  const slot = SlotModel.create({ date, time, type, duration });

  res.status(201).json({
    success: true,
    data: slot,
    message: 'Slot criado com sucesso',
  });
}));

/**
 * POST /api/slots/bulk
 * Criar múltiplos slots de uma vez
 */
router.post('/bulk', authenticate, validate(slotSchemas.createMany), asyncHandler(async (req, res) => {
  const { slots } = req.body;

  const { created, skipped } = SlotModel.createMany(slots);

  const parts = [`${created} slot${created !== 1 ? 's' : ''} criado${created !== 1 ? 's' : ''}`];
  if (skipped > 0) parts.push(`${skipped} já existia${skipped !== 1 ? 'm' : ''}`);

  res.status(201).json({
    success: true,
    message: parts.join(', '),
    count: created,
    skipped,
  });
}));

/**
 * DELETE /api/slots/:id
 * Deletar slot
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const slot = SlotModel.findById(id);
  if (!slot) {
    throw ApiError.notFound('Slot não encontrado');
  }

  if (!slot.is_available) {
    throw ApiError.conflict('Não é possível deletar um slot ocupado');
  }

  SlotModel.delete(id);

  res.json({
    success: true,
    message: 'Slot removido',
  });
}));

/**
 * DELETE /api/slots/date/:date
 * Deletar todos slots disponíveis de uma data
 */
router.delete('/date/:date', authenticate, asyncHandler(async (req, res) => {
  const { date } = req.params;

  const allSlots = SlotModel.findByDate(date);
  const occupiedCount = allSlots.filter(s => !s.is_available).length;
  const result = SlotModel.deleteByDate(date);

  const message = result.changes === 0 && occupiedCount > 0
    ? `Nenhum slot disponível removido (${occupiedCount} slot${occupiedCount > 1 ? 's' : ''} ocupado${occupiedCount > 1 ? 's' : ''} foram preservados)`
    : `${result.changes} slot${result.changes !== 1 ? 's' : ''} removido${result.changes !== 1 ? 's' : ''}${occupiedCount > 0 ? ` (${occupiedCount} ocupado${occupiedCount > 1 ? 's' : ''} preservado${occupiedCount > 1 ? 's' : ''})` : ''}`;

  res.json({
    success: true,
    message,
  });
}));

export default router;
