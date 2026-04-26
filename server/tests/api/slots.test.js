/**
 * Integration Tests — Slots endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { initializeDatabase } from '../../src/config/database.js';
import { UserModel } from '../../src/models/index.js';
import app from '../../app.js';

describe('API Slots', () => {
  let authToken;

  beforeAll(async () => {
    await initializeDatabase();

    // Criar admin se necessário
    const count = UserModel.count();
    if (count === 0) {
      await UserModel.create({
        username: 'testadmin',
        password: 'TestPassword123!',
        name: 'Test Admin',
        role: 'admin',
      });
    }

    // Login
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'TestPassword123!' });
    authToken = res.body.data.token;
  });

  describe('POST /api/slots', () => {
    it('cria slot com autenticação', async () => {
      const res = await request(app)
        .post('/api/slots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2026-05-01',
          time: '10:00',
          type: 'sessao',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('rejeita slot duplicado', async () => {
      const res = await request(app)
        .post('/api/slots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2026-05-01',
          time: '10:00',
          type: 'sessao',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejeita sem autenticação', async () => {
      const res = await request(app)
        .post('/api/slots')
        .send({
          date: '2026-05-02',
          time: '14:00',
          type: 'reuniao',
        });

      expect(res.status).toBe(401);
    });

    it('rejeita tipo inválido', async () => {
      const res = await request(app)
        .post('/api/slots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2026-05-02',
          time: '14:00',
          type: 'tipo_invalido',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/slots/bulk', () => {
    it('cria múltiplos slots', async () => {
      const res = await request(app)
        .post('/api/slots/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          slots: [
            { date: '2026-05-03', time: '09:00', type: 'reuniao' },
            { date: '2026-05-03', time: '10:00', type: 'sessao' },
            { date: '2026-05-03', time: '14:00', type: 'retoque' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
    });
  });

  describe('GET /api/slots', () => {
    it('lista todos os slots (público)', async () => {
      const res = await request(app).get('/api/slots');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('filtra slots por data', async () => {
      const res = await request(app).get('/api/slots?startDate=2026-05-03&endDate=2026-05-03');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });
  });

  describe('GET /api/slots/available/:date', () => {
    it('lista slots disponíveis por data', async () => {
      const res = await request(app).get('/api/slots/available/2026-05-01');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/slots/:id', () => {
    it('deleta slot existente', async () => {
      // Criar slot para deletar
      const createRes = await request(app)
        .post('/api/slots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ date: '2026-06-01', time: '10:00', type: 'reuniao' });

      const slotId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/slots/${slotId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('retorna 404 para slot inexistente', async () => {
      const res = await request(app)
        .delete('/api/slots/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    it('rejeita sem autenticação', async () => {
      const res = await request(app).delete('/api/slots/1');
      expect(res.status).toBe(401);
    });
  });
});
