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

  const count = SlotModel.createMany(slots);

  res.status(201).json({
    success: true,
    message: `${count} slots criados`,
    count,
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

  const result = SlotModel.deleteByDate(date);

  res.json({
    success: true,
    message: `${result.changes} slots removidos`,
  });
}));

export default router;
