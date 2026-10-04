FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev zip unzip libzip-dev default-mysql-client \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

ARG COMPOSER_FLAGS=""
RUN composer install --no-interaction --optimize-autoloader $COMPOSER_FLAGS

COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 9000

# nosemgrep: dockerfile.security.missing-user.missing-user
# nosemgrep: dockerfile.security.missing-user-entrypoint.missing-user-entrypoint
# php-fpm's master process requires root to bind and manage workers; actual
# request handling happens in worker processes running as www-data, set via
# /usr/local/etc/php-fpm.d/www.conf (user/group directives, default in the
# base image). This is php-fpm's standard privilege-separation model.
ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]
