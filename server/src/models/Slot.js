/**
 * Model de Slots (Vagas)
 * Kevin Hussein Tattoo Studio
 */

import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const SlotModel = {
  /**
   * Cria um novo slot
   */
  create({ date, time, type, duration = 60 }) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO slots (id, date, time, type, duration, is_available, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);

    try {
      stmt.run(id, date, time, type, duration, now);
      return this.findById(id);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        // Slot já existe, retornar existente
        return this.findByDateTimeType(date, time, type);
      }
      throw error;
    }
  },

  /**
   * Cria múltiplos slots de uma vez
   */
  createMany(slots) {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO slots (id, date, time, type, duration, is_available, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);

    const insertMany = db.transaction((slots) => {
      const now = new Date().toISOString();
      for (const slot of slots) {
        insert.run(uuidv4(), slot.date, slot.time, slot.type, slot.duration || 60, now);
      }
    });

    insertMany(slots);
    return slots.length;
  },

  /**
   * Busca slot por ID
   */
  findById(id) {
    const stmt = db.prepare('SELECT * FROM slots WHERE id = ?');
    return stmt.get(id);
  },

  /**
   * Busca slot por data, hora e tipo
   */
  findByDateTimeType(date, time, type) {
    const stmt = db.prepare('SELECT * FROM slots WHERE date = ? AND time = ? AND type = ?');
    return stmt.get(date, time, type);
  },

  /**
   * Busca slots disponíveis por data
   */
  findAvailableByDate(date, type = null) {
    let query = 'SELECT * FROM slots WHERE date = ? AND is_available = 1';
    const params = [date];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY time ASC';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  /**
   * Busca todos slots por data
   */
  findByDate(date) {
    const stmt = db.prepare(`
      SELECT * FROM slots 
      WHERE date = ? 
      ORDER BY time ASC
    `);
    return stmt.all(date);
  },

  /**
   * Marca slot como ocupado
   */
  markAsBooked(id, bookingId) {
    const stmt = db.prepare(`
      UPDATE slots 
      SET is_available = 0, booking_id = ?
      WHERE id = ?
    `);
    stmt.run(bookingId, id);
    return this.findById(id);
  },

  /**
   * Libera slot
   */
  markAsAvailable(id) {
    const stmt = db.prepare(`
      UPDATE slots 
      SET is_available = 1, booking_id = NULL
      WHERE id = ?
    `);
    stmt.run(id);
    return this.findById(id);
  },

  /**
   * Lista slots com filtros
   */
  findAll({ startDate, endDate, type, available } = {}) {
    let query = 'SELECT * FROM slots WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (available !== undefined) {
      query += ' AND is_available = ?';
      params.push(available ? 1 : 0);
    }

    query += ' ORDER BY date ASC, time ASC';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  /**
   * Deleta slot
   */
  delete(id) {
    const stmt = db.prepare('DELETE FROM slots WHERE id = ?');
    return stmt.run(id);
  },

  /**
   * Deleta slots por data
   */
  deleteByDate(date) {
    const stmt = db.prepare('DELETE FROM slots WHERE date = ? AND is_available = 1');
    return stmt.run(date);
  },

  /**
   * Conta slots disponíveis
   */
  countAvailable(date = null) {
    let query = 'SELECT COUNT(*) as count FROM slots WHERE is_available = 1';
    const params = [];

    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params).count;
  },
};

export default SlotModel;
