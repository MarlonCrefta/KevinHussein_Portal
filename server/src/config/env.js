/**
 * Configuração de Variáveis de Ambiente
 * Kevin Hussein Tattoo Studio
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
dotenv.config({ path: join(__dirname, '..', '.env') });

export const config = {
  // Servidor
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',
  
  // Frontend (CORS)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Banco de Dados
  databasePath: process.env.DATABASE_PATH || './data/database.sqlite',
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  // WhatsApp
  whatsapp: {
    sessionPath: process.env.WHATSAPP_SESSION_PATH || './auth_info_baileys',
  },
  
  // Admin Padrão
  defaultAdmin: {
    username: process.env.ADMIN_USERNAME || 'kevin',
    password: process.env.ADMIN_PASSWORD || '2026',
    name: process.env.ADMIN_NAME || 'Kevin Hussein',
  },
  
  // Logs
  log: {
    level: process.env.LOG_LEVEL || 'info',
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
