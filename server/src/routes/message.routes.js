/**
 * Rotas de Mensagens e Templates
 * Kevin Hussein Tattoo Studio
 */

import { Router } from 'express';
import { MessageTemplateModel } from '../models/index.js';
import { 
  authenticate, 
  validate,
  messageSchemas,
  asyncHandler,
  ApiError 
} from '../middleware/index.js';

const router = Router();

// Referência ao serviço de WhatsApp (será injetada)
let whatsappService = null;

export function setWhatsAppService(service) {
  whatsappService = service;
}

/**
 * GET /api/messages/templates
 * Lista todos templates
 */
router.get('/templates', authenticate, (req, res) => {
  const templates = MessageTemplateModel.findAll();

  res.json({
    success: true,
    data: templates,
  });
});

/**
 * GET /api/messages/templates/:type
 * Busca template por tipo
 */
router.get('/templates/:type', authenticate, asyncHandler(async (req, res) => {
  const { type } = req.params;
  const template = MessageTemplateModel.findByType(type);

  if (!template) {
    throw ApiError.notFound('Template não encontrado');
  }

  res.json({
    success: true,
    data: template,
  });
}));

/**
 * PUT /api/messages/templates/:type
 * Atualizar template
 */
router.put('/templates/:type', authenticate, validate(messageSchemas.updateTemplate), asyncHandler(async (req, res) => {
  const { type } = req.params;
  
  const existing = MessageTemplateModel.findByType(type);
  if (!existing) {
    throw ApiError.notFound('Template não encontrado');
  }

  const template = MessageTemplateModel.update(type, req.body);

  res.json({
    success: true,
    data: template,
    message: 'Template atualizado',
  });
}));

/**
 * POST /api/messages/preview
 * Preview de mensagem com template
 */
router.post('/preview', authenticate, asyncHandler(async (req, res) => {
  const { type, data } = req.body;

  if (!type || !data) {
    throw ApiError.badRequest('Tipo e dados são obrigatórios');
  }

  const result = MessageTemplateModel.processTemplate(type, data);

  if (!result) {
    throw ApiError.notFound('Template não encontrado');
  }

  res.json({
    success: true,
    data: {
      message: result.message,
      template: result.template,
    },
  });
}));

/**
 * POST /api/messages/send
 * Enviar mensagem via WhatsApp
 */
router.post('/send', authenticate, validate(messageSchemas.send), asyncHandler(async (req, res) => {
  const { phone, message } = req.body;

  if (!whatsappService || !whatsappService.isReady()) {
    throw ApiError.badRequest('WhatsApp não está conectado');
  }

  try {
    await whatsappService.sendMessage(phone, message);

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
    });
  } catch (error) {
    throw ApiError.internal(`Erro ao enviar mensagem: ${error.message}`);
  }
}));

/**
 * POST /api/messages/send-template
 * Enviar mensagem usando template
 */
router.post('/send-template', authenticate, asyncHandler(async (req, res) => {
  const { type, phone, data } = req.body;

  if (!type || !phone || !data) {
    throw ApiError.badRequest('Tipo, telefone e dados são obrigatórios');
  }

  const result = MessageTemplateModel.processTemplate(type, data);
  if (!result) {
    throw ApiError.notFound('Template não encontrado');
  }

  if (!result.enabled) {
    throw ApiError.badRequest('Template está desabilitado');
  }

  if (!whatsappService || !whatsappService.isReady()) {
    throw ApiError.badRequest('WhatsApp não está conectado');
  }

  try {
    await whatsappService.sendMessage(phone, result.message);

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: {
        template: type,
        preview: result.message.substring(0, 100) + '...',
      },
    });
  } catch (error) {
    throw ApiError.internal(`Erro ao enviar mensagem: ${error.message}`);
  }
}));

export default router;
