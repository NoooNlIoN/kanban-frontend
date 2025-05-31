# Многоэтапная сборка для React приложения

# Этап 1: Сборка приложения
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Отключаем линтинг для продакшен сборки
ENV DISABLE_ESLINT_PLUGIN=true
ENV CI=true

# Копируем package.json и package-lock.json для кэширования слоев
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production=false --silent

# Копируем исходный код
COPY . .

# Собираем приложение для продакшена без линтинга
RUN npm run build:docker

# Этап 2: Настройка nginx для раздачи статических файлов
FROM nginx:alpine AS production

# Копируем кастомную конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Удаляем дефолтные файлы nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем собранное приложение из предыдущего этапа
COPY --from=builder /app/dist /usr/share/nginx/html

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Изменяем владельца файлов
RUN chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d

# Создаем директории для nginx с правильными правами
RUN touch /var/run/nginx.pid && \
    chown -R nextjs:nodejs /var/run/nginx.pid

# Переключаемся на непривилегированного пользователя
USER nextjs

# Открываем порт 8080 (непривилегированный порт)
EXPOSE 8080

# Добавляем проверку здоровья
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"] 