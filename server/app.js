/**
 * Express App — configuração isolada para testes e produção
 * 
 * Este módulo exporta o app Express configurado SEM iniciar o servidor,
 * banco de dados, WhatsApp ou scheduler. Isso permite importar o app
 * em testes de integração sem side effects.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import config from './src/config/env.js';
import { errorHandler, notFoundHandler } from './src/middleware/index.js';
import routes, { setWhatsAppService } from './src/routes/index.js';

const app = express();

// Trust proxy — necessário para rate limiting pegar IP real atrás do nginx
app.set('trust proxy', 1);

// Helmet — headers de segurança no Express (proteção mesmo sem nginx)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

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
  max: isProd ? 100 : 1000,
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
  windowMs: 1 * 60 * 1000,
  max: isProd ? 10 : 50,
  message: {
    success: false,
    error: 'Limite de mensagens WhatsApp atingido. Aguarde.',
  },
});
app.use('/api/whatsapp/send', whatsappLimiter);
app.use('/api/messages/send-template', whatsappLimiter);

// Rate limiting para criação de agendamentos (anti slot-exhaustion)
const bookingLimiter = rateLimit({
  windowMs: isProd ? 15 * 60 * 1000 : 1 * 60 * 1000,
  max: isProd ? 5 : 50,
  message: {
    success: false,
    error: 'Muitas tentativas de agendamento. Aguarde alguns minutos.',
  },
});
app.use('/api/bookings', (req, res, next) => {
  if (req.method === 'POST') return bookingLimiter(req, res, next);
  next();
});

// Cache headers para recursos estáticos da API
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'private, max-age=30');
  }
  next();
});

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

// 404 - Rota não encontrada
app.use(notFoundHandler);

// Handler de erros global
app.use(errorHandler);

export { setWhatsAppService };
export default app;
