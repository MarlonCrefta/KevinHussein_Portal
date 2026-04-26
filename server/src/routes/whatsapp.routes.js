/**
 * Rotas do WhatsApp
 * Kevin Hussein Tattoo Studio
 */

import { Router } from 'express';
import { authenticate, asyncHandler, ApiError } from '../middleware/index.js';
import db from '../config/database.js';

const router = Router();

// Referência ao serviço de WhatsApp (será injetada)
let whatsappService = null;

export function setWhatsAppService(service) {
  whatsappService = service;
}

/**
 * GET /api/whatsapp/status
 * Status da conexão WhatsApp
 */
router.get('/status', authenticate, (req, res) => {
  if (!whatsappService) {
    return res.json({
      success: true,
      data: {
        isReady: false,
        qrCode: null,
        clientInfo: null,
      },
    });
  }

  res.json({
    success: true,
    data: whatsappService.getStatus(),
  });
});

/**
 * POST /api/whatsapp/connect
 * Iniciar conexão WhatsApp
 */
router.post('/connect', authenticate, asyncHandler(async (req, res) => {
  if (!whatsappService) {
    throw ApiError.internal('Serviço WhatsApp não inicializado');
  }

  if (whatsappService.isReady()) {
    return res.json({
      success: true,
      message: 'WhatsApp já está conectado',
    });
  }

  try {
    await whatsappService.connect();
    
    res.json({
      success: true,
      message: 'Conexão iniciada. Aguarde o QR Code.',
    });
  } catch (error) {
    throw ApiError.internal(`Erro ao conectar: ${error.message}`);
  }
}));

/**
 * POST /api/whatsapp/disconnect
 * Desconectar WhatsApp
 */
router.post('/disconnect', authenticate, asyncHandler(async (req, res) => {
  if (!whatsappService) {
    throw ApiError.internal('Serviço WhatsApp não inicializado');
  }

  try {
    await whatsappService.disconnect();
    
    res.json({
      success: true,
      message: 'WhatsApp desconectado',
    });
  } catch (error) {
    throw ApiError.internal(`Erro ao desconectar: ${error.message}`);
  }
}));

/**
 * POST /api/whatsapp/send
 * Enviar mensagem
 */
router.post('/send', authenticate, asyncHandler(async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    throw ApiError.badRequest('Telefone e mensagem são obrigatórios');
  }

  if (!whatsappService || !whatsappService.isReady()) {
    throw ApiError.badRequest('WhatsApp não está conectado');
  }

  try {
    const result = await whatsappService.sendMessage(phone, message);

    res.json({
      success: true,
      message: 'Mensagem enviada',
      data: result,
    });
  } catch (error) {
    throw ApiError.internal(`Erro ao enviar: ${error.message}`);
  }
}));

/**
 * POST /api/whatsapp/send-test
 * Enviar mensagem de teste com template preenchido com dados fictícios
 */
router.post('/send-test', authenticate, asyncHandler(async (req, res) => {
  const { templateType, phone } = req.body;

  if (!templateType || !phone) {
    throw ApiError.badRequest('Tipo de template e telefone são obrigatórios');
  }

  if (!whatsappService || !whatsappService.isReady()) {
    throw ApiError.badRequest('WhatsApp não está conectado. Conecte primeiro para enviar teste.');
  }

  // Buscar template do banco
  const apiType = templateType === 'completion' ? 'followup' : templateType;
  const row = db.prepare('SELECT template FROM message_templates WHERE type = ?').get(apiType);

  if (!row) {
    throw ApiError.badRequest('Template não encontrado');
  }

  // Preencher placeholders com dados fictícios
  const sampleData = {
    nome: 'João Silva (TESTE)',
    telefone: phone,
    email: 'joao@email.com',
    tipo: 'Reunião de Criação',
    data: 'segunda-feira, 6 de janeiro',
    hora: '14:00',
    horario: '14:00',
    id: 'TEST-001',
  };

  let message = row.template;
  Object.entries(sampleData).forEach(([key, value]) => {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });

  try {
    const result = await whatsappService.sendMessage(phone, message);
    res.json({
      success: true,
      message: `Mensagem de teste enviada para ${phone}`,
      data: result,
    });
  } catch (error) {
    throw ApiError.internal(`Erro ao enviar teste: ${error.message}`);
  }
}));

export default router;
