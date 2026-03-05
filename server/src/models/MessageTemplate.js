/**
 * Model de Templates de Mensagem
 * Kevin Hussein Tattoo Studio
 */

import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// Templates padrão
const DEFAULT_TEMPLATES = [
  {
    type: 'confirmation',
    name: 'Confirmação de Agendamento',
    template: `Olá {nome}! 🎨

Seu agendamento foi confirmado:

📅 Data: {data}
⏰ Horário: {horario}
📍 Local: Rua das Tatuagens, 123

Preparação:
• Durma bem na noite anterior
• Alimente-se antes de vir
• Traga documento com foto
• Evite álcool 24h antes

Dúvidas? Responda esta mensagem.

Kevin Hussein Tattoo Studio`,
    enabled: true,
  },
  {
    type: 'reminder',
    name: 'Lembrete (1 dia antes)',
    template: `Oi {nome}! 👋

Lembrete: sua sessão é AMANHÃ!

📅 {data}
⏰ {horario}

Confirma presença? Responda SIM

Se precisar reagendar, avise com antecedência.

Kevin Hussein Tattoo Studio`,
    enabled: true,
  },
  {
    type: 'followup',
    name: 'Pós-Sessão',
    template: `Oi {nome}! ✨

Como está a tatuagem? 

Cuidados importantes:
• Lave 3x ao dia com sabonete neutro
• Aplique pomada cicatrizante em camada fina
• Não coce, não arranque casquinhas
• Evite sol direto por 30 dias

Qualquer dúvida, só chamar!

Kevin Hussein Tattoo Studio`,
    enabled: true,
  },
  {
    type: 'reschedule',
    name: 'Reagendamento',
    template: `Olá {nome}!

Seu agendamento foi reagendado:

📅 Nova data: {data}
⏰ Novo horário: {horario}

O horário anterior foi liberado.

Confirma? Responda SIM.

Kevin Hussein Tattoo Studio`,
    enabled: true,
  },
  {
    type: 'cancellation',
    name: 'Cancelamento',
    template: `Olá {nome},

Seu agendamento de {data} às {horario} foi cancelado.

Caso queira reagendar, acesse nosso site ou entre em contato.

Kevin Hussein Tattoo Studio`,
    enabled: true,
  },
];

export const MessageTemplateModel = {
  /**
   * Inicializa templates padrão
   */
  initializeDefaults() {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO message_templates (id, type, name, template, enabled, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction(() => {
      const now = new Date().toISOString();
      for (const tmpl of DEFAULT_TEMPLATES) {
        stmt.run(uuidv4(), tmpl.type, tmpl.name, tmpl.template, tmpl.enabled ? 1 : 0, now);
      }
    });

    insertMany();
    console.log('✅ Templates de mensagem inicializados');
  },

  /**
   * Busca template por tipo
   */
  findByType(type) {
    const stmt = db.prepare('SELECT * FROM message_templates WHERE type = ?');
    const result = stmt.get(type);
    if (result) {
      result.enabled = result.enabled === 1;
    }
    return result;
  },

  /**
   * Busca template por ID
   */
  findById(id) {
    const stmt = db.prepare('SELECT * FROM message_templates WHERE id = ?');
    const result = stmt.get(id);
    if (result) {
      result.enabled = result.enabled === 1;
    }
    return result;
  },

  /**
   * Lista todos templates
   */
  findAll() {
    const stmt = db.prepare('SELECT * FROM message_templates ORDER BY type');
    return stmt.all().map(t => ({ ...t, enabled: t.enabled === 1 }));
  },

  /**
   * Atualiza template
   */
  update(type, { name, template, enabled }) {
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (template !== undefined) {
      updates.push('template = ?');
      values.push(template);
    }

    if (enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(enabled ? 1 : 0);
    }

    if (updates.length === 0) return this.findByType(type);

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(type);

    const stmt = db.prepare(`
      UPDATE message_templates SET ${updates.join(', ')} WHERE type = ?
    `);
    stmt.run(...values);

    return this.findByType(type);
  },

  /**
   * Processa template com dados
   */
  processTemplate(type, data) {
    const template = this.findByType(type);
    if (!template) return null;

    let message = template.template;

    // Substituir variáveis (todas as variáveis disponíveis na interface)
    const variables = {
      '{nome}': data.clientName || data.name || '',
      '{data}': data.date || '',
      '{horario}': data.time || '',
      '{hora}': data.time || '',  // Alias para {horario}
      '{telefone}': data.phone || data.clientPhone || '',
      '{email}': data.email || data.clientEmail || '',
      '{tipo}': data.type || '',
      '{mensagem}': data.message || data.clientMessage || '',
      '{id}': data.id || '',
    };

    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(key, 'g'), value);
    }

    return {
      template: template,
      message: message,
      enabled: template.enabled,
    };
  },
};

export default MessageTemplateModel;
