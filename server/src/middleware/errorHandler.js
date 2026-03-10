/**
 * Middleware de Tratamento de Erros
 * Kevin Hussein Tattoo Studio
 */

import logger from '../config/logger.js';

/**
 * Classe de erro customizada para erros da API
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Não autorizado') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Acesso negado') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Recurso não encontrado') {
    return new ApiError(404, message);
  }

  static conflict(message, details = null) {
    return new ApiError(409, message, details);
  }

  static internal(message = 'Erro interno do servidor') {
    return new ApiError(500, message);
  }
}

/**
 * Middleware de tratamento de erros
 */
export function errorHandler(err, req, res, next) {
  // Log do erro
  logger.error({ err, url: req.originalUrl, method: req.method }, err.message);

  // Erro operacional (esperado)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
    });
  }

  // Erros do SQLite
  if (err.code?.startsWith('SQLITE_')) {
    logger.error({ code: err.code }, 'Erro SQLite: %s', err.message);
    
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        success: false,
        error: 'Registro já existe',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro no banco de dados',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // Erros de validação do JSON
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({
      success: false,
      error: 'JSON inválido no corpo da requisição',
    });
  }

  // Erro genérico (não esperado)
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Erro interno do servidor',
  });
}

/**
 * Middleware para rotas não encontradas
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Wrapper para async handlers (captura erros automaticamente)
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  ApiError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
