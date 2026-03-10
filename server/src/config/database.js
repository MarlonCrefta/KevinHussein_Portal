/**
 * Configuração do Banco de Dados SQLite
 * Kevin Hussein Tattoo Studio
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import config from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Garantir que a pasta data existe
const dataDir = join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Caminho do banco
const dbPath = join(__dirname, '..', '..', config.databasePath.replace('./', ''));

// Criar conexão
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Inicializa o banco de dados com as tabelas necessárias
 */
export function initializeDatabase() {
  console.log('📦 Inicializando banco de dados...');
  
  // Tabela de Usuários (Admin)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de Clientes
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      cpf TEXT UNIQUE,
      reputation TEXT DEFAULT 'neutro',
      total_bookings INTEGER DEFAULT 0,
      completed_bookings INTEGER DEFAULT 0,
      no_show_count INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Adicionar campos de termos se não existirem (migração)
  try {
    db.exec(`ALTER TABLE clients ADD COLUMN terms_accepted INTEGER DEFAULT 0`);
  } catch (e) { /* coluna já existe */ }
  try {
    db.exec(`ALTER TABLE clients ADD COLUMN terms_accepted_at TEXT`);
  } catch (e) { /* coluna já existe */ }
  try {
    db.exec(`ALTER TABLE clients ADD COLUMN image_rights_accepted INTEGER DEFAULT 0`);
  } catch (e) { /* coluna já existe */ }
  try {
    db.exec(`ALTER TABLE clients ADD COLUMN image_rights_accepted_at TEXT`);
  } catch (e) { /* coluna já existe */ }

  // Tabela de Documentos do Cliente (termos assinados, anamnese, etc)
  db.exec(`
    CREATE TABLE IF NOT EXISTS client_documents (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      type TEXT NOT NULL,
      file_path TEXT,
      file_name TEXT,
      signed_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id)`);

  // Índice para busca rápida por telefone e CPF
  db.exec(`CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf)`);

  // Tabela de Agendamentos
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pendente',
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration INTEGER DEFAULT 60,
      client_name TEXT NOT NULL,
      client_email TEXT,
      client_phone TEXT NOT NULL,
      client_cpf TEXT,
      client_message TEXT,
      client_reputation TEXT,
      admin_notes TEXT,
      confirmation_sent INTEGER DEFAULT 0,
      confirmation_sent_at TEXT,
      reminder_sent INTEGER DEFAULT 0,
      reminder_sent_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // Índices para busca rápida
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_cpf ON bookings(client_cpf)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date, status)`);

  // Tabela de Slots (Vagas disponíveis)
  db.exec(`
    CREATE TABLE IF NOT EXISTS slots (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      type TEXT NOT NULL,
      duration INTEGER DEFAULT 60,
      is_available INTEGER DEFAULT 1,
      booking_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date)`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_slots_unique ON slots(date, time, type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_slots_available ON slots(date, is_available)`);

  // Tabela de Templates de Mensagem
  db.exec(`
    CREATE TABLE IF NOT EXISTS message_templates (
      id TEXT PRIMARY KEY,
      type TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      template TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de Mensagens Enviadas (Log)
  db.exec(`
    CREATE TABLE IF NOT EXISTS message_logs (
      id TEXT PRIMARY KEY,
      booking_id TEXT,
      client_phone TEXT NOT NULL,
      message_type TEXT NOT NULL,
      message_content TEXT,
      status TEXT DEFAULT 'pending',
      sent_at TEXT,
      error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_message_logs_booking ON message_logs(booking_id)`);

  // Tabela de Configurações
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Banco de dados inicializado com sucesso!');
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
