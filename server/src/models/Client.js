/**
 * Model de Cliente
 * Kevin Hussein Tattoo Studio
 */

import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const ClientModel = {
  /**
   * Cria um novo cliente
   */
  create({ name, email, phone, cpf, notes }) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO clients (id, name, email, phone, cpf, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(id, name, email || null, phone, cpf || null, notes || null, now, now);
      return this.findById(id);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        // Retornar cliente existente se CPF já existe
        if (cpf) {
          return this.findByCpf(cpf);
        }
      }
      throw error;
    }
  },

  /**
   * Busca ou cria cliente
   */
  findOrCreate({ name, email, phone, cpf }) {
    // Tentar encontrar por CPF primeiro
    if (cpf) {
      const existing = this.findByCpf(cpf);
      if (existing) {
        // Atualizar dados se necessário
        return this.update(existing.id, { name, email, phone });
      }
    }

    // Tentar encontrar por telefone
    const byPhone = this.findByPhone(phone);
    if (byPhone) {
      return this.update(byPhone.id, { name, email, cpf });
    }

    // Criar novo cliente
    return this.create({ name, email, phone, cpf });
  },

  /**
   * Busca cliente por ID
   */
  findById(id) {
    const stmt = db.prepare('SELECT * FROM clients WHERE id = ?');
    return stmt.get(id);
  },

  /**
   * Busca cliente por CPF
   */
  findByCpf(cpf) {
    const stmt = db.prepare('SELECT * FROM clients WHERE cpf = ?');
    return stmt.get(cpf);
  },

  /**
   * Busca cliente por telefone
   */
  findByPhone(phone) {
    // Normalizar telefone (remover caracteres especiais)
    const normalizedPhone = phone.replace(/\D/g, '');
    const stmt = db.prepare("SELECT * FROM clients WHERE REPLACE(REPLACE(REPLACE(phone, '-', ''), '(', ''), ')', '') LIKE ?");
    return stmt.get(`%${normalizedPhone}%`);
  },

  /**
   * Atualiza cliente
   */
  update(id, data) {
    const allowedFields = ['name', 'email', 'phone', 'cpf', 'reputation', 'notes'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE clients SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    return this.findById(id);
  },

  /**
   * Incrementa contador de agendamentos
   */
  incrementBookingCount(id) {
    const stmt = db.prepare(`
      UPDATE clients 
      SET total_bookings = total_bookings + 1, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), id);
    return this.findById(id);
  },

  /**
   * Registra conclusão de agendamento
   */
  recordCompletion(id) {
    const stmt = db.prepare(`
      UPDATE clients 
      SET completed_bookings = completed_bookings + 1, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), id);
    this.updateReputation(id);
    return this.findById(id);
  },

  /**
   * Registra no-show
   */
  recordNoShow(id) {
    const stmt = db.prepare(`
      UPDATE clients 
      SET no_show_count = no_show_count + 1, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), id);
    this.updateReputation(id);
    return this.findById(id);
  },

  /**
   * Atualiza reputação baseado no histórico
   */
  updateReputation(id) {
    const client = this.findById(id);
    if (!client) return;

    let reputation = 'neutro';
    
    if (client.no_show_count >= 2) {
      reputation = 'baixa';
    } else if (client.completed_bookings >= 3 && client.no_show_count === 0) {
      reputation = 'alta';
    } else if (client.completed_bookings >= 1) {
      reputation = 'boa';
    }

    const stmt = db.prepare('UPDATE clients SET reputation = ? WHERE id = ?');
    stmt.run(reputation, id);
  },

  /**
   * Lista todos clientes
   */
  findAll({ limit = 100, offset = 0, search } = {}) {
    let query = 'SELECT * FROM clients';
    const params = [];

    if (search) {
      query += ' WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  /**
   * Conta total de clientes
   */
  count(search) {
    let query = 'SELECT COUNT(*) as count FROM clients';
    const params = [];

    if (search) {
      query += ' WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params).count;
  },

  /**
   * Deleta cliente
   */
  delete(id) {
    const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
    return stmt.run(id);
  },
};

export default ClientModel;
