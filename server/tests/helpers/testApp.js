/**
 * Test Helper — cria app Express com banco in-memory para integration tests
 */

import Database from 'better-sqlite3';
import { runMigrations } from '../../src/config/migrator.js';

let testDb;

/**
 * Inicializa banco de dados in-memory para testes
 * e aplica migrations. Retorna a instância do banco.
 */
export async function setupTestDb() {
  testDb = new Database(':memory:');
  testDb.pragma('journal_mode = WAL');
  testDb.pragma('foreign_keys = ON');
  await runMigrations(testDb);
  return testDb;
}

/**
 * Fecha o banco de dados de teste
 */
export function teardownTestDb() {
  if (testDb) {
    testDb.close();
    testDb = null;
  }
}

/**
 * Retorna a instância do banco de teste
 */
export function getTestDb() {
  return testDb;
}
