/**
 * Configuração de Variáveis de Ambiente
 * Kevin Hussein Tattoo Studio
 * 
 * Em produção, JWT_SECRET e ADMIN_PASSWORD são OBRIGATÓRIOS no .env.
 * O servidor NÃO inicia sem eles configurados.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env (tenta raiz do server/ e depois src/)
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

/**
 * Valida variáveis obrigatórias em produção.
 * Em desenvolvimento, gera valores temporários com aviso.
 */
function requireEnv(key, devFallback) {
  const value = process.env[key];
  if (value) return value;

  if (isProd) {
    console.error(`\n❌ ERRO FATAL: Variável de ambiente ${key} é obrigatória em produção.`);
    console.error(`   Configure no arquivo .env antes de iniciar o servidor.\n`);
    process.exit(1);
  }

  console.warn(`⚠️  ${key} não definida — usando fallback de desenvolvimento.`);
  return devFallback;
}

// Em dev sem JWT_SECRET, gera um aleatório por sessão (seguro, mas não persiste entre restarts)
const devJwtSecret = crypto.randomBytes(32).toString('hex');

export const config = {
  // Servidor
  env: NODE_ENV,
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || (isProd ? '0.0.0.0' : 'localhost'),
  
  // Frontend (CORS)
  frontendUrl: requireEnv('FRONTEND_URL', 'http://localhost:3000'),
  
  // Banco de Dados
  databasePath: process.env.DATABASE_PATH || './data/database.sqlite',
  
  // JWT — SEM fallback hardcoded em produção
  jwt: {
    secret: requireEnv('JWT_SECRET', devJwtSecret),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET', devJwtSecret + '_refresh'),
    expiresIn: process.env.JWT_EXPIRES_IN || (isProd ? '1d' : '7d'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  // WhatsApp
  whatsapp: {
    sessionPath: process.env.WHATSAPP_SESSION_PATH || './auth_info_baileys',
  },
  
  // Admin Padrão — SEM senha hardcoded em produção
  defaultAdmin: {
    username: requireEnv('ADMIN_USERNAME', 'kevin'),
    password: requireEnv('ADMIN_PASSWORD', 'dev_2026'),
    name: process.env.ADMIN_NAME || 'Kevin Hussein',
  },
  
  // Logs
  log: {
    level: process.env.LOG_LEVEL || (isProd ? 'warn' : 'info'),
    file: process.env.LOG_FILE || './logs/app.log',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  // Scheduler
  scheduler: {
    enabled: process.env.SCHEDULER_ENABLED === 'true',
    businessHours: {
      start: parseInt(process.env.BUSINESS_HOURS_START || '9', 10),
      end: parseInt(process.env.BUSINESS_HOURS_END || '20', 10),
    },
  },
};

export default config;
