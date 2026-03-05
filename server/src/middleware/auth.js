/**
 * Middleware de Autenticação JWT
 * Kevin Hussein Tattoo Studio
 */

import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { UserModel } from '../models/index.js';

/**
 * Gera token JWT
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Gera refresh token
 */
export function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

/**
 * Verifica token JWT
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware de autenticação
 * Requer token válido para acessar a rota
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Token não fornecido',
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: 'Formato de token inválido',
    });
  }

  const token = parts[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado',
    });
  }

  // Verificar se usuário ainda existe
  const user = UserModel.findById(decoded.id);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Usuário não encontrado',
    });
  }

  // Adicionar usuário ao request
  req.user = decoded;
  next();
}

/**
 * Middleware de autorização por role
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado',
      });
    }

    next();
  };
}

/**
 * Middleware opcional de autenticação
 * Não bloqueia se não tiver token, mas adiciona user se tiver
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    const decoded = verifyToken(parts[1]);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  authenticate,
  authorize,
  optionalAuth,
};
