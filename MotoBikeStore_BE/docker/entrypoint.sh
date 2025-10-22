#!/usr/bin/env bash
set -e

# Cài vendor nếu thiếu
if [ ! -d "vendor" ]; then
  composer install --no-dev --optimize-autoloader
fi

# Tạo APP_KEY nếu chưa có (Render không cho shell free, nên làm tự động)
php artisan key:generate --force || true

# Link storage
php artisan storage:link || true

# Clear & cache config/route/view
php artisan config:clear  || true
php artisan route:clear   || true
php artisan view:clear    || true

php artisan config:cache  || true
php artisan route:cache   || true
php artisan view:cache    || true

# Chạy migrate nếu có DB (không dừng nếu lỗi khi DB chưa sẵn sàng)
php artisan migrate --force --no-interaction || true

# Start Apache
apache2-foreground
