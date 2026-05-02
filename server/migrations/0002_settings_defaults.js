/**
 * Migration 0002 — Valores padrão de settings do estúdio
 *
 * Garante que novas instalações (VPS limpo ou banco zerado)
 * partam com todas as chaves de configuração populadas.
 */

export function up(db) {
  const defaults = [
    ['studio_name', 'Kevin Hussein Tattoo'],
    ['studio_address', ''],
    ['studio_hours', 'Seg–Sex: 10h–19h | Sáb: 10h–17h'],
    ['studio_instagram', '@kevinhussein.tattoo'],
    ['studio_whatsapp', ''],
    ['welcome_message', 'Olá! Bem-vindo ao estúdio Kevin Hussein Tattoo. Como posso ajudar?'],
    ['wa_send_confirmation', 'true'],
    ['wa_send_reminder', 'true'],
    ['wa_send_completion', 'true'],
  ];

  const stmt = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
  );

  for (const [key, value] of defaults) {
    stmt.run(key, value);
  }
}

export function down(db) {
  const keys = [
    'studio_name', 'studio_address', 'studio_hours', 'studio_instagram',
    'studio_whatsapp', 'welcome_message', 'wa_send_confirmation',
    'wa_send_reminder', 'wa_send_completion',
  ];
  const placeholders = keys.map(() => '?').join(', ');
  db.prepare(`DELETE FROM settings WHERE key IN (${placeholders})`).run(...keys);
}
