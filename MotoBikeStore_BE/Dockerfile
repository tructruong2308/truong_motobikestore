# ---- PHP + Apache ----
FROM php:8.2-apache

# Cài extension cần cho Laravel + MySQL
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpng-dev libonig-dev libxml2-dev libpq-dev \
  && docker-php-ext-install pdo pdo_mysql zip gd

# Bật mod_rewrite để route Laravel chạy đúng
RUN a2enmod rewrite

# Tải Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy code vào container
WORKDIR /var/www/html
COPY . /var/www/html

# Cấp quyền storage + cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Cấu hình VirtualHost cho Apache
RUN printf "<VirtualHost *:8080>\n\
    DocumentRoot /var/www/html/public\n\
    <Directory /var/www/html/public>\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
    ErrorLog /proc/self/fd/2\n\
    CustomLog /proc/self/fd/1 combined\n\
</VirtualHost>\n" > /etc/apache2/sites-available/000-default.conf

# Render sẽ cung cấp biến PORT, ánh xạ sang 8080
ENV PORT=8080
EXPOSE 8080

# Entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
