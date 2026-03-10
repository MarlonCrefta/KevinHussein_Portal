/**
 * Kevin Hussein Tattoo Studio - API Server
 * Versão 2.0.0 - Refatorado
 * 
 * Servidor Express com:
 * - API RESTful
 * - Banco de dados SQLite
 * - Autenticação JWT
 * - Integração WhatsApp (Baileys)
 * - Scheduler de mensagens automáticas
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

// Configuração
import config from './src/config/env.js';
import { initializeDatabase, closeDatabase } from './src/config/database.js';

// Models (para inicialização)
import { UserModel, MessageTemplateModel } from './src/models/index.js';

// Middleware
import { errorHandler, notFoundHandler } from './src/middleware/index.js';

// Rotas
import routes, { setWhatsAppService } from './src/routes/index.js';

// Serviços
import { whatsappService, schedulerService } from './src/services/index.js';

// Logger estruturado
import logger from './src/config/logger.js';

// ============================================
// INICIALIZAÇÃO
// ============================================

const app = express();

logger.info('╔══════════════════════════════════════════════════════════╗');
logger.info('║       KEVIN HUSSEIN TATTOO STUDIO - API SERVER          ║');
logger.info('║                     Versão 2.0.0                        ║');
logger.info('╚══════════════════════════════════════════════════════════╝');

// ============================================
// MIDDLEWARES GLOBAIS
// ============================================

// CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON
app.use(express.json({ limit: '10mb' }));

// Rate Limiting — adaptável por ambiente
const isProd = config.env === 'production';
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: isProd ? 100 : 1000, // Restritivo em produção
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Rate limiting para login (anti brute-force)
const loginLimiter = rateLimit({
  windowMs: isProd ? 15 * 60 * 1000 : 1 * 60 * 1000,
  max: isProd ? 5 : 50,
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente mais tarde.',
  },
});
app.use('/api/auth/login', loginLimiter);

// Rate limiting para WhatsApp (anti-spam)
const whatsappLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: isProd ? 10 : 50,
  message: {
    success: false,
    error: 'Limite de mensagens WhatsApp atingido. Aguarde.',
  },
});
app.use('/api/whatsapp/send', whatsappLimiter);
app.use('/api/messages/send-template', whatsappLimiter);

// Cache headers para recursos estáticos da API
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'private, max-age=30');
  }
  next();
});

// Log de requisições (apenas desenvolvimento)
if (!isProd) {
  app.use((req, res, next) => {
    logger.debug({ method: req.method, url: req.url }, 'request');
    next();
  });
}

// ============================================
// ROTAS
// ============================================

// API v1
app.use('/api', routes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'Kevin Hussein Tattoo Studio API',
    version: '2.0.0',
    status: 'running',
    docs: '/api/health',
  });
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================

// 404 - Rota não encontrada
app.use(notFoundHandler);

// Handler de erros global
app.use(errorHandler);

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

async function startServer() {
  try {
    // 1. Inicializar banco de dados
    logger.info('Configurando banco de dados...');
    initializeDatabase();

    // 2. Criar admin padrão se não existir
    const adminCount = UserModel.count();
    if (adminCount === 0) {
      logger.info('Criando usuário admin padrão...');
      await UserModel.create({
        username: config.defaultAdmin.username,
        password: config.defaultAdmin.password,
        name: config.defaultAdmin.name,
        role: 'admin',
      });
      logger.info({ username: config.defaultAdmin.username }, 'Admin criado');
    }

    // 3. Inicializar templates de mensagem
    logger.info('Configurando templates de mensagem...');
    MessageTemplateModel.initializeDefaults();

    // 4. Configurar serviço WhatsApp nas rotas
    setWhatsAppService(whatsappService);

    // 5. Iniciar scheduler
    logger.info('Iniciando scheduler de mensagens...');
    schedulerService.start();

    // 6. Iniciar servidor
    const server = app.listen(config.port, () => {
      logger.info({ host: config.host, port: config.port, env: config.env }, 'Servidor rodando');
      logger.info({ frontend: config.frontendUrl }, 'Frontend esperado');
    });

    // Timeout para conexões lentas (30s)
    server.keepAliveTimeout = 30000;

    // ============================================
    // GRACEFUL SHUTDOWN
    // ============================================
    function gracefulShutdown(signal) {
      logger.info({ signal }, 'Encerrando servidor...');
      
      // 1. Parar de aceitar novas conexões
      server.close(() => {
        logger.info('Servidor HTTP fechado');
        
        // 2. Parar scheduler
        schedulerService.stop();
        logger.info('Scheduler parado');
        
        // 3. Fechar banco de dados
        try {
          closeDatabase();
          logger.info('Banco de dados fechado');
        } catch (e) {
          logger.error({ err: e }, 'Erro ao fechar banco');
        }
        
        logger.info('Shutdown completo');
        process.exit(0);
      });

      // Forçar saída após 10s se graceful falhar
      setTimeout(() => {
        logger.error('Forçando encerramento após timeout');
        process.exit(1);
      }, 10000);
    }

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    logger.fatal({ err: error }, 'Erro ao iniciar servidor');
    process.exit(1);
  }
}

// Iniciar
startServer();
