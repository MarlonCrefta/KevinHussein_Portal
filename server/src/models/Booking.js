/**
 * Model de Agendamento
 * Kevin Hussein Tattoo Studio
 */

import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const BookingModel = {
  /**
   * Cria um novo agendamento
   */
  create({
    clientId,
    type,
    date,
    time,
    duration = 60,
    clientName,
    clientEmail,
    clientPhone,
    clientCpf,
    clientMessage,
    clientReputation,
  }) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO bookings (
        id, client_id, type, status, date, time, duration,
        client_name, client_email, client_phone, client_cpf,
        client_message, client_reputation, created_at, updated_at
      ) VALUES (?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      clientId || null,
      type,
      date,
      time,
      duration,
      clientName,
      clientEmail || null,
      clientPhone,
      clientCpf || null,
      clientMessage || null,
      clientReputation || 'neutro',
      now,
      now
    );

    return this.findById(id);
  },

  /**
   * Busca agendamento por ID
   */
  findById(id) {
    const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
    return stmt.get(id);
  },

  /**
   * Atualiza agendamento
   */
  update(id, data) {
    const allowedFields = [
      'status', 'date', 'time', 'duration', 'admin_notes',
      'confirmation_sent', 'confirmation_sent_at',
      'reminder_sent', 'reminder_sent_at'
    ];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      // Converter camelCase para snake_case
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      
      if (allowedFields.includes(snakeKey) && value !== undefined) {
        updates.push(`${snakeKey} = ?`);
        values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE bookings SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    return this.findById(id);
  },

  /**
   * Atualiza status do agendamento
   */
  updateStatus(id, status) {
    return this.update(id, { status });
  },

  /**
   * Busca agendamentos por data
   */
  findByDate(date) {
    const stmt = db.prepare(`
      SELECT * FROM bookings 
      WHERE date = ? 
      ORDER BY time ASC
    `);
    return stmt.all(date);
  },

  /**
   * Busca agendamentos por status
   */
  findByStatus(status) {
    const stmt = db.prepare(`
      SELECT * FROM bookings 
      WHERE status = ? 
      ORDER BY date ASC, time ASC
    `);
    return stmt.all(status);
  },

  /**
   * Busca próximos agendamentos
   */
  findUpcoming(limit = 10) {
    const today = new Date().toISOString().split('T')[0];
    const stmt = db.prepare(`
      SELECT * FROM bookings 
      WHERE date >= ? AND status IN ('pendente', 'confirmado')
      ORDER BY date ASC, time ASC
      LIMIT ?
    `);
    return stmt.all(today, limit);
  },

  /**
   * Busca agendamentos de amanhã (para lembretes)
   */
  findTomorrowBookings() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const stmt = db.prepare(`
      SELECT * FROM bookings 
      WHERE date = ? AND status IN ('pendente', 'confirmado')
      ORDER BY time ASC
    `);
    return stmt.all(tomorrowDate);
  },

  /**
   * Busca agendamentos por CPF do cliente
   */
  findByCpf(cpf) {
    const cleanCpf = cpf.replace(/\D/g, '');
    const stmt = db.prepare(`
      SELECT * FROM bookings 
      WHERE client_cpf = ?
      ORDER BY date DESC, time DESC
    `);
    return stmt.all(cleanCpf);
  },

  /**
   * Busca agendamentos que precisam de lembrete
   */
  findPendingReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const stmt = db.prepare(`
      SELECT * FROM bookings 
      WHERE date = ? 
        AND status IN ('pendente', 'confirmado')
        AND reminder_sent = 0
      ORDER BY time ASC
    `);
    return stmt.all(tomorrowDate);
  },

  /**
   * Lista todos agendamentos com filtros
   */
  findAll({ limit = 50, offset = 0, status, type, search, startDate, endDate } = {}) {
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (search) {
      query += ' AND (client_name LIKE ? OR client_phone LIKE ? OR client_email LIKE ? OR client_cpf LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC, time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  /**
   * Estatísticas de agendamentos
   */
  getStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Início da semana (domingo)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartDate = weekStart.toISOString().split('T')[0];
    
    // Início do mês
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartDate = monthStart.toISOString().split('T')[0];

    const total = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const pendentes = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pendente'").get().count;
    const confirmados = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmado'").get().count;
    const hoje = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE date = ?').get(today).count;
    const semana = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE date >= ?').get(weekStartDate).count;
    const mes = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE date >= ?').get(monthStartDate).count;

    return {
      total,
      pendentes,
      confirmados,
      hoje,
      semana,
      mes,
    };
  },

  /**
   * Conta total de agendamentos
   */
  count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM bookings WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params).count;
  },

  /**
   * Deleta agendamento
   */
  delete(id) {
    const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
    return stmt.run(id);
  },
};

export default BookingModel;
