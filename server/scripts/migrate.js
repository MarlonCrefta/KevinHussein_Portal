/**
 * CLI de Migrations — Kevin Hussein Tattoo Studio
 * 
 * Uso:
 *   node scripts/migrate.js          # aplica pendentes
 *   node scripts/migrate.js status   # mostra status
 *   node scripts/migrate.js rollback # reverte última
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';
import { runMigrations, rollbackMigration, migrationStatus } from '../src/config/migrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
dotenv.config({ path: join(__dirname, '..', '.env') });

// Conectar ao banco
const dbPath = process.env.DATABASE_PATH
  ? join(__dirname, '..', process.env.DATABASE_PATH.replace('./', ''))
  : join(__dirname, '..', 'data', 'database.sqlite');

console.log(`📦 Banco: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const command = process.argv[2] || 'up';

try {
  switch (command) {
    case 'up':
    case 'migrate':
      await runMigrations(db);
      break;
    case 'status':
      migrationStatus(db);
      break;
    case 'rollback':
      await rollbackMigration(db);
      break;
    default:
      console.log('Comandos: up | status | rollback');
  }
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
} finally {
  db.close();
}
