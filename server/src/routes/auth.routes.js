/**
 * Rotas de Autenticação
 * Kevin Hussein Tattoo Studio
 */

import { Router } from 'express';
import { UserModel } from '../models/index.js';
import { 
  authenticate, 
  generateToken, 
  generateRefreshToken, 
  verifyToken,
  validate,
  authSchemas,
  asyncHandler,
  ApiError 
} from '../middleware/index.js';

const router = Router();

/**
 * POST /api/auth/login
 * Login do usuário
 */
router.post('/login', validate(authSchemas.login), asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await UserModel.verifyCredentials(username, password);

  if (!user) {
    throw ApiError.unauthorized('Usuário ou senha inválidos');
  }

  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      token,
      refreshToken,
    },
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh do token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw ApiError.badRequest('Refresh token é obrigatório');
  }

  const decoded = verifyToken(refreshToken);
  if (!decoded) {
    throw ApiError.unauthorized('Refresh token inválido ou expirado');
  }

  const user = UserModel.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('Usuário não encontrado');
  }

  const token = generateToken(user);
  const newRefreshToken = generateRefreshToken(user);

  res.json({
    success: true,
    data: {
      token,
      refreshToken: newRefreshToken,
    },
  });
}));

/**
 * GET /api/auth/me
 * Dados do usuário logado
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

/**
 * POST /api/auth/logout
 * Logout (client-side deve remover o token)
 */
router.post('/logout', authenticate, (req, res) => {
  // JWT é stateless, então o logout é feito no client removendo o token
  // Aqui podemos adicionar o token a uma blacklist se necessário
  res.json({
    success: true,
    message: 'Logout realizado com sucesso',
  });
});

/**
 * PUT /api/auth/password
 * Alterar senha
 */
router.put('/password', authenticate, validate(authSchemas.changePassword), asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Verificar senha atual
  const user = await UserModel.verifyCredentials(req.user.username, currentPassword);
  if (!user) {
    throw ApiError.badRequest('Senha atual incorreta');
  }

  // Atualizar senha
  await UserModel.updatePassword(req.user.id, newPassword);

  res.json({
    success: true,
    message: 'Senha alterada com sucesso',
  });
}));

export default router;
