/**
 * Kevin Hussein Tattoo Studio — Backup do SQLite (Node.js)
 * 
 * Alternativa ao backup.sh para ambientes sem shell (Windows/dev).
 * Uso: node scripts/backup.js
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH 
  ? join(__dirname, '..', process.env.DATABASE_PATH.replace('./', ''))
  : join(__dirname, '..', 'data', 'database.sqlite');

const BACKUP_DIR = process.env.BACKUP_DIR || join(__dirname, '..', 'backups');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '30', 10);

function backup() {
  if (!existsSync(DB_PATH)) {
    console.error(`❌ Banco não encontrado: ${DB_PATH}`);
    process.exit(1);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFile = join(BACKUP_DIR, `database_${timestamp}.sqlite`);

  try {
    copyFileSync(DB_PATH, backupFile);
    const size = statSync(backupFile).size;
    const sizeKB = (size / 1024).toFixed(1);
    console.log(`✅ Backup criado: ${backupFile} (${sizeKB} KB)`);
  } catch (err) {
    console.error(`❌ Falha no backup:`, err.message);
    process.exit(1);
  }

  // Rotação
  const backups = readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('database_') && f.endsWith('.sqlite'))
    .sort()
    .reverse();

  if (backups.length > MAX_BACKUPS) {
    const toRemove = backups.slice(MAX_BACKUPS);
    toRemove.forEach(f => {
      unlinkSync(join(BACKUP_DIR, f));
    });
    console.log(`🗑️  Removidos ${toRemove.length} backups antigos (mantidos: ${MAX_BACKUPS})`);
  }
}

backup();
