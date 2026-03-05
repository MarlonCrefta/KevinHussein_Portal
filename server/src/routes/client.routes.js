/**
 * Rotas de Clientes
 * Kevin Hussein Tattoo Studio
 */

import { Router } from 'express';
import { ClientModel, BookingModel } from '../models/index.js';
import { 
  authenticate, 
  validate,
  clientSchemas,
  asyncHandler,
  ApiError 
} from '../middleware/index.js';

const router = Router();

/**
 * GET /api/clients
 * Lista todos clientes
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { search, limit, offset } = req.query;

  const clients = ClientModel.findAll({
    search,
    limit: parseInt(limit) || 100,
    offset: parseInt(offset) || 0,
  });

  const total = ClientModel.count(search);

  res.json({
    success: true,
    data: {
      clients,
      total,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
    },
  });
}));

/**
 * GET /api/clients/:id
 * Detalhes de um cliente
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = ClientModel.findById(id);

  if (!client) {
    throw ApiError.notFound('Cliente não encontrado');
  }

  // Buscar agendamentos do cliente
  const bookings = BookingModel.findAll({ search: client.phone });

  res.json({
    success: true,
    data: {
      ...client,
      bookings,
    },
  });
}));

/**
 * POST /api/clients
 * Criar novo cliente
 */
router.post('/', authenticate, validate(clientSchemas.create), asyncHandler(async (req, res) => {
  const { name, email, phone, cpf, notes } = req.body;

  // Verificar se já existe
  if (cpf) {
    const existingByCpf = ClientModel.findByCpf(cpf);
    if (existingByCpf) {
      throw ApiError.conflict('CPF já cadastrado');
    }
  }

  const existingByPhone = ClientModel.findByPhone(phone);
  if (existingByPhone) {
    throw ApiError.conflict('Telefone já cadastrado');
  }

  const client = ClientModel.create({ name, email, phone, cpf, notes });

  res.status(201).json({
    success: true,
    data: client,
    message: 'Cliente criado com sucesso',
  });
}));

/**
 * PUT /api/clients/:id
 * Atualizar cliente
 */
router.put('/:id', authenticate, validate(clientSchemas.update), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const existingClient = ClientModel.findById(id);
  if (!existingClient) {
    throw ApiError.notFound('Cliente não encontrado');
  }

  const client = ClientModel.update(id, req.body);

  res.json({
    success: true,
    data: client,
    message: 'Cliente atualizado',
  });
}));

/**
 * DELETE /api/clients/:id
 * Deletar cliente
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = ClientModel.findById(id);
  if (!client) {
    throw ApiError.notFound('Cliente não encontrado');
  }

  ClientModel.delete(id);

  res.json({
    success: true,
    message: 'Cliente removido',
  });
}));

/**
 * GET /api/clients/phone/:phone
 * Buscar cliente por telefone
 */
router.get('/phone/:phone', asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const client = ClientModel.findByPhone(phone);

  if (!client) {
    throw ApiError.notFound('Cliente não encontrado');
  }

  res.json({
    success: true,
    data: client,
  });
}));

/**
 * GET /api/clients/cpf/:cpf
 * Buscar cliente por CPF
 */
router.get('/cpf/:cpf', asyncHandler(async (req, res) => {
  const { cpf } = req.params;
  const client = ClientModel.findByCpf(cpf);

  if (!client) {
    throw ApiError.notFound('Cliente não encontrado');
  }

  res.json({
    success: true,
    data: client,
  });
}));

export default router;
