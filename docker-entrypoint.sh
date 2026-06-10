#!/bin/sh
set -e

DATA_DIR="/data"
DB_FILE="$DATA_DIR/dev.db"

echo "════════════════════════════════════════"
echo "  AppNoteDams — Démarrage"
echo "════════════════════════════════════════"

# ─── Backup de la base de données ────────────────────────────────────────────
if [ -f "$DB_FILE" ]; then
    BACKUP="$DB_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$DB_FILE" "$BACKUP"
    echo "✅ Backup créé : $BACKUP"

    # Conserver seulement les 5 derniers backups
    ls -t "$DATA_DIR"/dev.db.backup.* 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
else
    echo "ℹ️  Première initialisation — pas de backup nécessaire"
fi

# ─── Migrations Prisma (JAMAIS de reset — uniquement apply) ──────────────────
echo "🔄 Application des migrations en attente..."
npx prisma migrate deploy
echo "✅ Migrations terminées"

# ─── Démarrage du serveur ─────────────────────────────────────────────────────
echo "🚀 Démarrage du serveur sur le port $PORT..."
exec node server/index.js
