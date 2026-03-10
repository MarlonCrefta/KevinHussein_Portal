/**
 * Logger Estruturado com Pino
 * Kevin Hussein Tattoo Studio
 * 
 * Substitui console.log por logger com níveis, timestamps e formato JSON.
 * Em desenvolvimento: output formatado e colorido.
 * Em produção: JSON puro (ideal para log aggregators).
 */

import pino from 'pino';
import config from './env.js';

const logger = pino({
  level: config.log.level,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
