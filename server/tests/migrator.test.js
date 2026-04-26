/**
 * Testes — Sistema de Migrations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations, migrationStatus, rollbackMigration } from '../src/config/migrator.js';

describe('Migrator', () => {
  let db;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  });

  afterEach(() => {
    db.close();
  });

  it('cria tabela _migrations automaticamente', async () => {
    await runMigrations(db);
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'").get();
    expect(table).toBeTruthy();
    expect(table.name).toBe('_migrations');
  });

  it('aplica migration 0001_initial_schema', async () => {
    const result = await runMigrations(db);
    expect(result.applied).toBeGreaterThanOrEqual(1);

    // Verificar que as tabelas foram criadas
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const tableNames = tables.map(t => t.name);

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('clients');
    expect(tableNames).toContain('bookings');
    expect(tableNames).toContain('slots');
    expect(tableNames).toContain('message_templates');
    expect(tableNames).toContain('message_logs');
    expect(tableNames).toContain('settings');
    expect(tableNames).toContain('_migrations');
  });

  it('não reaplica migrations já executadas', async () => {
    const first = await runMigrations(db);
    const second = await runMigrations(db);

    expect(first.applied).toBeGreaterThanOrEqual(1);
    expect(second.applied).toBe(0);
  });

  it('reporta status correto', async () => {
    await runMigrations(db);
    const status = migrationStatus(db);

    expect(status.total).toBeGreaterThanOrEqual(1);
    expect(status.pending).toBe(0);
    expect(status.applied).toBe(status.total);
  });

  it('reverte última migration', async () => {
    await runMigrations(db);

    const reverted = await rollbackMigration(db);
    expect(reverted).toBeTruthy();

    // Verificar que tabelas foram removidas
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    expect(tables).toBeFalsy();
  });

  it('retorna null ao reverter sem migrations aplicadas', async () => {
    // Criar tabela _migrations vazia
    db.exec('CREATE TABLE _migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE, applied_at TEXT)');
    const result = await rollbackMigration(db);
    expect(result).toBeNull();
  });
});
