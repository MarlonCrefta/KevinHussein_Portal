/**
 * Rotas de Configurações
 * Kevin Hussein Tattoo Studio
 */

import { Router } from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Configurações padrão
const defaultSettings = {
  late_tolerance_minutes: '20',
  no_show_charge_enabled: 'false',
  no_show_charge_amount: '0',
  session_deposit_amount: '270',
  session_deposit_required: 'true',
};

/**
 * GET /api/settings
 * Retorna todas as configurações
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    
    // Merge com defaults
    const settings = { ...defaultSettings };
    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar configurações',
    });
  }
});

/**
 * GET /api/settings/:key
 * Retorna uma configuração específica
 */
router.get('/:key', authenticateToken, (req, res) => {
  try {
    const { key } = req.params;
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    
    const value = row?.value || defaultSettings[key] || null;

    res.json({
      success: true,
      data: { key, value },
    });
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar configuração',
    });
  }
});

/**
 * PUT /api/settings/:key
 * Atualiza uma configuração
 */
router.put('/:key', authenticateToken, (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        error: 'Valor é obrigatório',
      });
    }

    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `);

    stmt.run(key, String(value));

    res.json({
      success: true,
      data: { key, value: String(value) },
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar configuração',
    });
  }
});

/**
 * PUT /api/settings
 * Atualiza múltiplas configurações
 */
router.put('/', authenticateToken, (req, res) => {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Configurações inválidas',
      });
    }

    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `);

    const updateMany = db.transaction((entries) => {
      for (const [key, value] of entries) {
        stmt.run(key, String(value));
      }
    });

    updateMany(Object.entries(settings));

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar configurações',
    });
  }
});

export default router;
