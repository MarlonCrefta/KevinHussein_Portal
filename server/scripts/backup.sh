#!/bin/sh
# =====================================================
# Kevin Hussein Tattoo Studio — Backup do SQLite
# =====================================================
# Uso: ./scripts/backup.sh [caminho_do_banco] [pasta_de_backups]
#
# Padrões:
#   banco:   /app/data/database.sqlite
#   backups: /app/backups
#
# Rotação: mantém os últimos 30 backups

DB_PATH="${1:-/app/data/database.sqlite}"
BACKUP_DIR="${2:-/app/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/database_${TIMESTAMP}.sqlite"
MAX_BACKUPS=30

# Verificar se banco existe
if [ ! -f "$DB_PATH" ]; then
  echo "❌ Banco não encontrado: $DB_PATH"
  exit 1
fi

# Criar pasta de backups
mkdir -p "$BACKUP_DIR"

# Backup usando SQLite .backup (seguro mesmo com banco em uso)
sqlite3 "$DB_PATH" ".backup '${BACKUP_FILE}'"

if [ $? -eq 0 ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Backup criado: ${BACKUP_FILE} (${SIZE})"
else
  # Fallback: cópia direta (WAL mode garante consistência em leitura)
  cp "$DB_PATH" "$BACKUP_FILE"
  if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "⚠️  Backup via cópia: ${BACKUP_FILE} (${SIZE})"
  else
    echo "❌ Falha no backup"
    exit 1
  fi
fi

# Rotação: remover backups antigos (manter últimos MAX_BACKUPS)
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/database_*.sqlite 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
  REMOVE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
  ls -1t "$BACKUP_DIR"/database_*.sqlite | tail -n "$REMOVE_COUNT" | xargs rm -f
  echo "🗑️  Removidos $REMOVE_COUNT backups antigos (mantidos: $MAX_BACKUPS)"
fi
