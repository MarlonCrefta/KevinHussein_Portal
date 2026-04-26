/**
 * Sistema de Migrations — Kevin Hussein Tattoo Studio
 * 
 * Gerencia versões do schema do banco SQLite.
 * Cada migration é um arquivo em server/migrations/ com formato:
 *   NNNN_descricao.js (ex: 0001_initial_schema.js)
 * 
 * Cada arquivo exporta: { up(db), down(db) }
 * 
 * Uso:
 *   import { runMigrations } from './config/migrator.js';
 *   runMigrations(db);  // aplica todas as pendentes
 */

import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, '..', '..', 'migrations');

/**
 * Garante que a tabela de controle de migrations existe
 */
function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Retorna lista de migrations já aplicadas
 */
function getAppliedMigrations(db) {
  const rows = db.prepare('SELECT name FROM _migrations ORDER BY name').all();
  return new Set(rows.map(r => r.name));
}

/**
 * Retorna lista de arquivos de migration disponíveis (ordenados)
 */
function getAvailableMigrations() {
  try {
    return readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.js') && /^\d{4}_/.test(f))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Executa todas as migrations pendentes (em ordem)
 */
export async function runMigrations(db) {
  ensureMigrationsTable(db);

  const applied = getAppliedMigrations(db);
  const available = getAvailableMigrations();
  const pending = available.filter(f => !applied.has(f));

  if (pending.length === 0) {
    console.log('📦 Migrations: banco atualizado (nenhuma pendente)');
    return { applied: 0, total: available.length };
  }

  console.log(`📦 Migrations: ${pending.length} pendente(s) de ${available.length} total`);

  let count = 0;
  for (const file of pending) {
    const filePath = pathToFileURL(join(MIGRATIONS_DIR, file)).href;
    try {
      const migration = await import(filePath);

      if (typeof migration.up !== 'function') {
        throw new Error(`Migration ${file} não exporta função 'up'`);
      }

      // Executar dentro de transação
      const runInTransaction = db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
      });
      runInTransaction();

      count++;
      console.log(`  ✅ ${file}`);
    } catch (err) {
      console.error(`  ❌ ${file}: ${err.message}`);
      throw new Error(`Migration falhou em ${file}: ${err.message}`);
    }
  }

  console.log(`📦 Migrations: ${count} aplicada(s) com sucesso`);
  return { applied: count, total: available.length };
}

/**
 * Reverte a última migration aplicada
 */
export async function rollbackMigration(db) {
  ensureMigrationsTable(db);

  const lastRow = db.prepare('SELECT name FROM _migrations ORDER BY id DESC LIMIT 1').get();
  if (!lastRow) {
    console.log('📦 Nenhuma migration para reverter');
    return null;
  }

  const file = lastRow.name;
  const filePath = pathToFileURL(join(MIGRATIONS_DIR, file)).href;
  const migration = await import(filePath);

  if (typeof migration.down !== 'function') {
    throw new Error(`Migration ${file} não exporta função 'down' — rollback manual necessário`);
  }

  const runInTransaction = db.transaction(() => {
    migration.down(db);
    db.prepare('DELETE FROM _migrations WHERE name = ?').run(file);
  });
  runInTransaction();

  console.log(`  ↩️  Revertida: ${file}`);
  return file;
}

/**
 * Mostra status das migrations
 */
export function migrationStatus(db) {
  ensureMigrationsTable(db);

  const applied = getAppliedMigrations(db);
  const available = getAvailableMigrations();

  console.log('\n📦 Status das Migrations:');
  console.log('─'.repeat(50));

  for (const file of available) {
    const status = applied.has(file) ? '✅' : '⏳';
    console.log(`  ${status} ${file}`);
  }

  const pending = available.filter(f => !applied.has(f));
  console.log('─'.repeat(50));
  console.log(`  Total: ${available.length} | Aplicadas: ${applied.size} | Pendentes: ${pending.length}\n`);

  return { total: available.length, applied: applied.size, pending: pending.length };
}
