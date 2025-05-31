# 🚀 Деплой React Kanban Frontend в продакшен

## 📋 Требования

- Docker 20.10+
- Docker Compose 2.0+
- 2GB свободной оперативной памяти
- 10GB свободного места на диске

## 🔧 Настройка переменных окружения

Перед деплоем убедитесь, что настроены правильные API endpoints в вашем приложении.

## 🚀 Быстрый запуск

### Сборка и запуск одной командой

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### Пошаговый запуск

1. **Сборка образа:**
```bash
docker build -t kanban-frontend:latest .
```

2. **Запуск контейнера:**
```bash
docker run -d \
  --name kanban-frontend \
  -p 80:8080 \
  --restart unless-stopped \
  kanban-frontend:latest
```

## 🐳 Docker команды

### Сборка образа
```bash
# Обычная сборка
docker build -t kanban-frontend:latest .

# Сборка без кэша
docker build --no-cache -t kanban-frontend:latest .

# Сборка с тегом версии
docker build -t kanban-frontend:v1.0.0 .
```

### Управление контейнерами
```bash
# Запуск
docker-compose -f docker-compose.prod.yml up -d

# Остановка
docker-compose -f docker-compose.prod.yml down

# Перезапуск
docker-compose -f docker-compose.prod.yml restart

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f frontend

# Обновление (пересборка и перезапуск)
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🔍 Мониторинг

### Проверка статуса
```bash
# Статус контейнера
docker ps

# Использование ресурсов
docker stats kanban-frontend-prod

# Логи в реальном времени
docker logs -f kanban-frontend-prod
```

### Health Check
```bash
# Проверка работоспособности
curl http://localhost/health

# Должен вернуть: healthy
```

## 🛠 Настройка nginx

Если нужно изменить конфигурацию nginx:

1. Отредактируйте `nginx.conf`
2. Пересоберите образ:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### Настройка API проксирования

Если ваш API работает на другом сервере, раскомментируйте и настройте секцию в `nginx.conf`:

```nginx
location /api/ {
    proxy_pass http://your-api-server:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 🔐 Настройка HTTPS (с Traefik)

Если используете Traefik для SSL:

1. Убедитесь, что Traefik запущен
2. Измените `yourdomain.com` в `docker-compose.prod.yml` на ваш домен
3. Запустите с labels для Traefik:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Оптимизация производительности

### Настройки для высокой нагрузки

Для высоконагруженных сайтов измените в `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 1G
    reservations:
      cpus: '1.0'
      memory: 512M
  replicas: 3
```

### Кэширование

Nginx настроен на агрессивное кэширование статических ресурсов:
- CSS/JS файлы: 1 месяц
- Изображения: 1 месяц
- index.html: без кэширования

## 🐛 Решение проблем

### Контейнер не запускается
```bash
# Проверьте логи
docker logs kanban-frontend-prod

# Проверьте конфигурацию
docker exec -it kanban-frontend-prod nginx -t
```

### Проблемы с роутингом
Убедитесь, что nginx настроен для SPA:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Проблемы с CORS
Если API на другом домене, настройте CORS на бэкенде или используйте прокси в nginx.

## 📈 Масштабирование

### Горизонтальное масштабирование
```bash
# Запуск нескольких реплик
docker-compose -f docker-compose.prod.yml up -d --scale frontend=3
```

### Использование с Load Balancer
Для production рекомендуется использовать:
- Nginx/HAProxy как load balancer
- Docker Swarm или Kubernetes
- CDN для статических ресурсов

## 🔄 CI/CD

Пример GitHub Actions для автоматического деплоя:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        run: |
          ssh user@your-server "
            cd /path/to/app &&
            git pull &&
            docker-compose -f docker-compose.prod.yml up --build -d
          "
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи контейнера
2. Убедитесь в корректности конфигурации nginx
3. Проверьте доступность API endpoints
4. Проверьте использование ресурсов системы 