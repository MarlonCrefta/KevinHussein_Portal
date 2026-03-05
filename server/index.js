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

// Configuração
import config from './src/config/env.js';
import { initializeDatabase } from './src/config/database.js';

// Models (para inicialização)
import { UserModel, MessageTemplateModel } from './src/models/index.js';

// Middleware
import { errorHandler, notFoundHandler } from './src/middleware/index.js';

// Rotas
import routes, { setWhatsAppService } from './src/routes/index.js';

// Serviços
import { whatsappService, schedulerService } from './src/services/index.js';

// ============================================
// INICIALIZAÇÃO
// ============================================

const app = express();

console.log('\n');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║       KEVIN HUSSEIN TATTOO STUDIO - API SERVER          ║');
console.log('║                     Versão 2.0.0                        ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('\n');

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

// Rate Limiting (mais permissivo para desenvolvimento)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 1000, // Aumentado para desenvolvimento
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
  },
});
app.use('/api/', limiter);

// Rate limiting para login (mais permissivo para desenvolvimento)
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 50, // 50 tentativas por minuto
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 1 minuto.',
  },
});
app.use('/api/auth/login', loginLimiter);

// Log de requisições (desenvolvimento)
if (config.env === 'development') {
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
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
    console.log('📦 Configurando banco de dados...');
    initializeDatabase();

    // 2. Criar admin padrão se não existir
    const adminCount = UserModel.count();
    if (adminCount === 0) {
      console.log('👤 Criando usuário admin padrão...');
      await UserModel.create({
        username: config.defaultAdmin.username,
        password: config.defaultAdmin.password,
        name: config.defaultAdmin.name,
        role: 'admin',
      });
      console.log(`   ✅ Admin criado: ${config.defaultAdmin.username}`);
    }

    // 3. Inicializar templates de mensagem
    console.log('📝 Configurando templates de mensagem...');
    MessageTemplateModel.initializeDefaults();

    // 4. Configurar serviço WhatsApp nas rotas
    setWhatsAppService(whatsappService);

    // 5. Iniciar scheduler
    console.log('⏰ Iniciando scheduler de mensagens...');
    schedulerService.start();

    // 6. Iniciar servidor
    app.listen(config.port, () => {
      console.log('\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`🚀 Servidor rodando em http://${config.host}:${config.port}`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('\n📌 Endpoints principais:');
      console.log(`   - API:        http://localhost:${config.port}/api`);
      console.log(`   - Health:     http://localhost:${config.port}/api/health`);
      console.log(`   - Auth:       http://localhost:${config.port}/api/auth/login`);
      console.log(`   - Bookings:   http://localhost:${config.port}/api/bookings`);
      console.log(`   - Clients:    http://localhost:${config.port}/api/clients`);
      console.log(`   - Slots:      http://localhost:${config.port}/api/slots`);
      console.log(`   - WhatsApp:   http://localhost:${config.port}/api/whatsapp/status`);
      console.log('\n');
      console.log(`📱 Para conectar WhatsApp: POST /api/whatsapp/connect`);
      console.log(`📊 Frontend esperado em: ${config.frontendUrl}`);
      console.log('\n');
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGINT', () => {
  console.log('\n\n🛑 Encerrando servidor...');
  schedulerService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Encerrando servidor...');
  schedulerService.stop();
  process.exit(0);
});

// Iniciar
startServer();
