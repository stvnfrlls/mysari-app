#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

COMPOSE_CMD="${COMPOSE_CMD:-docker compose --env-file .env.production -f docker-compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/mysari-backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
out="$BACKUP_DIR/sariapp-$(date +%F-%H%M).sql"

$COMPOSE_CMD exec -T db sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines "$MYSQL_DATABASE"' > "$out" || { rm -f "$out"; exit 1; }

gzip "$out"
find "$BACKUP_DIR" -name 'sariapp-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "Backup written: $out.gz"
