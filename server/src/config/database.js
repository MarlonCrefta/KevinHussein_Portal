/**
 * Configuração do Banco de Dados SQLite
 * Kevin Hussein Tattoo Studio
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join, isAbsolute } from 'path';
import fs from 'fs';
import config from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho do banco (suporta absoluto no Docker e relativo em dev)
const dbPath = isAbsolute(config.databasePath)
  ? config.databasePath
  : join(__dirname, '..', '..', config.databasePath.replace('./', ''));

// Garantir que a pasta do banco existe
const dataDir = dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Criar conexão
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Inicializa o banco de dados executando migrations pendentes
 */
export async function initializeDatabase() {
  const { runMigrations } = await import('./migrator.js');
  await runMigrations(db);
}

/**
 * Executa uma função dentro de uma transação SQLite.
 * Se a função lançar erro, a transação é revertida automaticamente.
 * @param {Function} fn - Função a ser executada dentro da transação
 * @returns {*} Resultado da função
 */
export function runTransaction(fn) {
  const transaction = db.transaction(fn);
  return transaction();
}

/**
 * Fecha a conexão com o banco
 */
export function closeDatabase() {
  db.close();
}

export default db;
