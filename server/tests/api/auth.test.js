/**
 * Integration Tests — Auth endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { initializeDatabase } from '../../src/config/database.js';
import { UserModel } from '../../src/models/index.js';
import app from '../../app.js';

describe('API Auth', () => {
  let authToken;
  let refreshToken;

  beforeAll(async () => {
    await initializeDatabase();

    // Criar admin de teste se não existir
    const count = UserModel.count();
    if (count === 0) {
      await UserModel.create({
        username: 'testadmin',
        password: 'TestPassword123!',
        name: 'Test Admin',
        role: 'admin',
      });
    }
  });

  describe('POST /api/auth/login', () => {
    it('login com credenciais válidas retorna token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testadmin', password: 'TestPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.username).toBe('testadmin');
      expect(res.body.data.user.role).toBe('admin');

      // Guardar tokens para outros testes
      authToken = res.body.data.token;
      refreshToken = res.body.data.refreshToken;
    });

    it('login com senha errada retorna 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testadmin', password: 'SenhaErrada123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('login com username inexistente retorna 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'naoexiste', password: 'TestPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('login sem campos obrigatórios retorna 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('login com senha curta retorna 400 (validação Zod)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testadmin', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('retorna dados do usuário autenticado', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.username).toBe('testadmin');
      // Não deve retornar password hash
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('retorna 401 sem token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('retorna 401 com token inválido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-invalido-123');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('refresh token retorna novo par de tokens', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('refresh sem token retorna 400', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('refresh com token inválido retorna 401', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'token-invalido' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('logout com token válido retorna sucesso', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('logout sem token retorna 401', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/auth/password', () => {
    it('alterar senha com dados válidos retorna sucesso', async () => {
      // Login fresh para pegar token válido
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testadmin', password: 'TestPassword123!' });

      const token = loginRes.body.data.token;

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'TestPassword123!',
          newPassword: 'NovaSenha456!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Restaurar senha original para outros testes
      const loginRes2 = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testadmin', password: 'NovaSenha456!' });

      await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${loginRes2.body.data.token}`)
        .send({
          currentPassword: 'NovaSenha456!',
          newPassword: 'TestPassword123!',
        });
    });

    it('alterar senha com senha atual errada retorna 400', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testadmin', password: 'TestPassword123!' });

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${loginRes.body.data.token}`)
        .send({
          currentPassword: 'SenhaErrada123',
          newPassword: 'NovaSenha456!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
