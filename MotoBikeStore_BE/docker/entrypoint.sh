#!/usr/bin/env bash
set -euo pipefail

# Chuẩn bị app (không để fail cứng)
php artisan key:generate --force || true
php artisan storage:link       || true
php artisan config:cache       || true

# (tuỳ) chờ DB rồi migrate – không bắt buộc
if [[ -n "${DB_HOST:-}" ]]; then
  echo "⏳ Waiting for database..."
  for i in {1..30}; do
    php -r 'try{$pdo=new PDO("mysql:host=".getenv("DB_HOST").";port=".getenv("DB_PORT").";dbname=".getenv("DB_DATABASE"),
                             getenv("DB_USERNAME"),getenv("DB_PASSWORD"));exit(0);}catch(Exception $e){exit(1);}'; \
    && break || sleep 2
  done || true
  php artisan migrate --force || true
fi

php artisan route:cache || true
php artisan view:cache  || true

# QUAN TRỌNG: chạy ở foreground và nghe đúng $PORT
PORT="${PORT:-8080}"
echo "✅ Starting PHP on 0.0.0.0:${PORT}"
exec php -d variables_order=EGPCS -S 0.0.0.0:"${PORT}" -t public
