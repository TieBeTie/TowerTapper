FROM postgres:latest

# Устанавливаем точный UID/GID 1001 для postgres
RUN usermod -u 1001 postgres && groupmod -g 1001 postgres

# Обновляем права на директории
RUN chown -R 1001:1001 /var/lib/postgresql /var/run/postgresql

# Явно указываем пользователя postgres для запуска контейнера
USER 1001 