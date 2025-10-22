FROM php:8.2-cli

# System deps
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libonig-dev \
 && docker-php-ext-install pdo_mysql zip

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . /app

# Build app
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist \
 && php -r "file_exists('.env') || copy('.env.example', '.env');" \
 && php artisan key:generate --force

# Entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
CMD ["/entrypoint.sh"]
