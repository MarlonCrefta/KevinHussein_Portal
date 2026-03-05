/**
 * Model de Usuário (Admin)
 * Kevin Hussein Tattoo Studio
 */

import db from '../config/database.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 10;

export const UserModel = {
  /**
   * Cria um novo usuário
   */
  async create({ username, password, name, role = 'admin' }) {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (id, username, password, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(id, username.toLowerCase(), hashedPassword, name, role, now, now);
      return this.findById(id);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Usuário já existe');
      }
      throw error;
    }
  },

  /**
   * Busca usuário por ID
   */
  findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  /**
   * Busca usuário por username
   */
  findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username.toLowerCase());
  },

  /**
   * Verifica credenciais do usuário
   */
  async verifyCredentials(username, password) {
    const user = this.findByUsername(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    // Retornar sem a senha
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Atualiza usuário
   */
  update(id, data) {
    const allowedFields = ['name', 'role'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    return this.findById(id);
  },

  /**
   * Atualiza senha do usuário
   */
  async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE users SET password = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(hashedPassword, now, id);

    return this.findById(id);
  },

  /**
   * Lista todos usuários
   */
  findAll() {
    const stmt = db.prepare('SELECT id, username, name, role, created_at, updated_at FROM users');
    return stmt.all();
  },

  /**
   * Deleta usuário
   */
  delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  },

  /**
   * Conta total de usuários
   */
  count() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    return stmt.get().count;
  },
};

export default UserModel;
