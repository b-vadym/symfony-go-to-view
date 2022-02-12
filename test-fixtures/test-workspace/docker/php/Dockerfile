FROM php:8.1-fpm

# Arguments defined in docker-compose.yml
ARG uid

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nano && \
#    clear
    apt-get clean &&  \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/pear && \
#    add user
    useradd -G www-data,root -u $uid -d /home/app app && \
    mkdir -p /home/app && \
    chown -R app:app /home/app

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

USER app

RUN mkdir /home/app/.composer
