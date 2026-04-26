/**
 * Integration Tests — Health & Root endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { initializeDatabase } from '../../src/config/database.js';
import app from '../../app.js';

describe('API Health', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  it('GET / retorna info do servidor', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Kevin Hussein Tattoo Studio API');
    expect(res.body.version).toBe('2.0.0');
    expect(res.body.status).toBe('running');
  });

  it('GET /api/health retorna status healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.version).toBe('2.0.0');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/rota-inexistente retorna 404', async () => {
    const res = await request(app).get('/api/rota-inexistente');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
