<div align="center">

# Развёртывание CyberLab v2

### Руководство по запуску платформы для других пользователей

</div>

---

## Содержание

- [Таблица быстрого выбора платформы](#таблица-быстрого-выбора-платформы)
- [Все переменные окружения](#все-переменные-окружения)
- [SQLite vs PostgreSQL — когда что использовать](#sqlite-vs-postgresql--когда-что-использовать)
- [Пошаговые гайды](#пошаговые-гайды)
  - [1. Vercel + Supabase — 5 мин](#1-vercel--supabase--5-мин)
  - [2. Railway (с SQLite) — 3 мин](#2-railway-с-sqlite--3-мин)
  - [3. Render — 10 мин](#3-render--10-мин)
  - [4. VPS + Docker — 30 мин](#4-vps--docker--30-мин)
  - [5. Docker Swarm — 1–2 часа](#5-docker-swarm--12-часа)
  - [6. Netlify — 5 мин](#6-netlify--5-мин)
  - [7. Yandex Cloud — 20 мин](#7-yandex-cloud--20-мин)
- [Бэкапы](#бэкапы)
- [Мониторинг (Prometheus + Grafana)](#мониторинг-prometheus--grafana)
- [CI/CD через GitHub Actions](#cicd-через-github-actions)
- [Чеклист деплоя](#чеклист-деплоя)
- [Troubleshooting и rollback](#troubleshooting-и-rollback)

---

## Таблица быстрого выбора платформы

| Платформа | Сложность | Время | Бесплатно? | RAM | База данных | Трафик | Домен |
|-----------|-----------|-------|------------|-----|-------------|--------|-------|
| **Vercel + Supabase** | ★☆☆ | 5 мин | Да (Hobby) | 1 GB (Serverless) | PostgreSQL через Supabase | 100 GB/мес | `<project>.vercel.app` |
| **Railway** | ★☆☆ | 3 мин | Да ($5 кредит) | 512 MB | SQLite (файл) | 1 TB/мес | `<project>.railway.app` |
| **Render** | ★★☆ | 10 мин | Да (Free) | 512 MB | PostgreSQL | 100 GB/мес | `<project>.onrender.com` |
| **VPS + Docker** | ★★☆ | 30 мин | Нет (от $5) | ∞ | Любая | ∞ | Свой |
| **Docker Swarm** | ★★★ | 1–2 ч | Нет (от $15) | ∞ | Любая (кластер) | ∞ | Свой (балансировка) |
| **Netlify** | ★☆☆ | 5 мин | Да (Free) | 512 MB (Serverless) | Supabase / Atlas | 100 GB/мес | `<project>.netlify.app` |
| **Yandex Cloud** | ★★☆ | 20 мин | 4000 ₽ на старте | 1+ GB | PostgreSQL Managed | 5+ GB/мес | Свой (YMQ) |

---

## Все переменные окружения

### Обязательные (хотя бы одна из БД-строк)

```env
# ==========================================
# База данных (укажите одну)
# ==========================================

# SQLite (по умолчанию)
# DATABASE_URL=file:./db/custom.db

# PostgreSQL
# DATABASE_URL=postgresql://user:pass@host:5432/dbname?schema=public

# MongoDB
# MONGODB_URI=mongodb://user:pass@host:27017/dbname?authSource=admin
```

### Опциональные

```env
# ==========================================
# Принудительный выбор типа БД
# (если не указать — автоопределение по DATABASE_URL)
# ==========================================
# DB_TYPE=sqlite
# DB_TYPE=postgresql
# DB_TYPE=mongodb

# ==========================================
# Порт (автоопределение: сканирует с 3000 вверх)
# ==========================================
# PORT=3000

# ==========================================
# Окружение
# ==========================================
# NODE_ENV=development
# NODE_ENV=production

# ==========================================
# PostgreSQL (маппинг в DATABASE_URL)
# ==========================================
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=postgres
# POSTGRES_DB=cyberlab
# POSTGRES_PORT=5432
# POSTGRES_HOST=localhost

# ==========================================
# MongoDB (маппинг в MONGODB_URI)
# ==========================================
# MONGODB_USER=root
# MONGODB_PASSWORD=root
# MONGODB_PORT=27017
# MONGODB_HOST=localhost

# ==========================================
# Supabase (только для Vercel/Supabase)
# ==========================================
# SUPABASE_URL=https://project.supabase.co
# SUPABASE_KEY=anon-public-key
# NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-public-key
```

### Для Yandex Cloud

```env
YC_FOLDER_ID=b1gxxxxxxxxxx
YC_ZONE=ru-central1-a
YC_SUBNET_ID=e9bxxxxxxxxxx
YC_SERVICE_ACCOUNT_ID=ajexxxxxxxxxx
YC_IMAGE_ID=fd8xxxxxxxxxx
```

---

## SQLite vs PostgreSQL — когда что использовать

| Критерий | SQLite | PostgreSQL |
|----------|--------|------------|
| **Пользователей** | 1–10 | 10+ |
| **Одновременных записей** | 1 (блокировка на запись) | Много (MVCC) |
| **Надёжность** | Низкая (файл) | Высокая (WAL, PITR) |
| **Бэкапы** | Копировать файл | `pg_dump` |
| **Размер** | Малый (встроенная) | Требует сервер |
| **Простота** | ★★★★★ (нулевая настройка) | ★★★ (установка + настройка) |
| **Где использовать** | Разработка, 1–2 студента | Продакшен, группа >10 |

### Миграция с SQLite на PostgreSQL

```bash
# 1. Установить pgloader
sudo apt install pgloader                          # Linux
brew install pgloader                               # macOS

# 2. Выгрузить SQLite
sqlite3 db/custom.db ".dump" > dump.sql

# 3. Импорт в PostgreSQL
pgloader db/custom.db postgresql://user:pass@localhost/cyberlab

# 4. Сменить DATABASE_URL в .env
# DATABASE_URL=postgresql://user:pass@localhost:5432/cyberlab?schema=public

# 5. Пересоздать схему Prisma
npx prisma db push

# 6. Пересеять данные (если pgloader не сработал)
npm run db:seed

# 7. Проверить
npm run dev
```

### Миграция с SQLite на MongoDB

```bash
# 1. Установить mongoimport
# https://www.mongodb.com/try/download/database-tools

# 2. Экспорт SQLite в JSON
sqlite3 db/custom.db "SELECT * FROM Lab;" -json > labs.json
sqlite3 db/custom.db "SELECT * FROM Student;" -json > students.json
# ... остальные таблицы

# 3. Импорт в MongoDB
mongoimport --uri="mongodb://localhost:27017/cyberlab" --collection=labs --file=labs.json
mongoimport --uri="mongodb://localhost:27017/cyberlab" --collection=students --file=students.json

# 4. Пересеять флаги
npm run db:seed:mongo
```

---

## Пошаговые гайды

---

### 1. Vercel + Supabase — 5 мин

Бесплатная связка: фронтенд на Vercel, база на Supabase (PostgreSQL).

#### Шаги

**Supabase:**

```bash
# 1. Зарегистрироваться на https://supabase.com
# 2. Нажать "New project"
# 3. Запомнить Database Password
# 4. После создания открыть "Project Settings" → "Database"
#    — скопировать Connection string (URI)
```

**Vercel:**

```bash
# 5. Зарегистрироваться на https://vercel.com
# 6. Нажать "Add New" → "Project"
# 7. Импортировать GitHub-репозиторий QuadDarv1ne/cyberlab-mtusi
```

**Настройка переменных:**

В Vercel → Project Settings → Environment Variables добавить:

```env
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?schema=public
```

**Build & Deploy:**

```bash
# Vercel определит Next.js автоматически.
# Настройки по умолчанию:
#   Build Command:   next build
#   Output Directory: .next
```

После деплоя открыть Shell проекта Vercel и выполнить:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

#### Результат

`https://cyberlab.vercel.app` — работает, HTTPS, PostgreSQL.

> **Важно:** Prisma + PostgreSQL — миграции применяйте вручную через Shell.
> На бесплатном тире Vercel — 100 GB трафика/мес, 6000 минут сборки.

---

### 2. Railway (с SQLite) — 3 мин

Railway поддерживает персистентные volume'ы — SQLite работает.

#### Шаги

```bash
# 1. Зарегистрироваться на https://railway.app (GitHub OAuth)
# 2. Нажать "New Project" → "Deploy from GitHub"
# 3. Выбрать репозиторий QuadDarv1ne/cyberlab-mtusi
```

**Настройка:**

Railway проекты → Variables:

```env
NODE_ENV=production
DATABASE_URL=file:./db/custom.db
PORT=3000
```

Настройки деплоя (Railway → Settings → Deploy):

| Параметр | Значение |
|----------|----------|
| Build Command | `npm install && npx prisma generate && npx prisma db push && npm run db:seed && npm run build` |
| Start Command | `node scripts/start-server.js` |
| Root Directory | `/` |
| Healthcheck Path | `/` |

**Persistent Volume (чтобы SQLite не сбрасывался при редеплое):**

Railway → Volumes → Add Volume:
- Mount Path: `/app/prisma/db`
- Размер: 1 GB (бесплатно)

Railway автоматически смонтирует volume к `/app/prisma/db`.

> **Внимание:** Railway даёт $5 бесплатного кредита. SQLite на volume
> считается как storage ($0.2/GB/мес). Этого хватит на годы.

#### Результат

`https://cyberlab.up.railway.app` — работает через 3 минуты.

---

### 3. Render — 10 мин

Render — облачный хостинг с бесплатным тиром (спит после 15 мин простоя).

#### Шаги

```bash
# 1. Зарегистрироваться на https://render.com (GitHub OAuth)
```

**Web Service:**

Render Dashboard → New + → Web Service → Connect GitHub repo.

Настройки:

| Параметр | Значение |
|----------|----------|
| Name | `cyberlab` |
| Region | `Frankfurt (EU)` — ближайший к РФ |
| Runtime | `Node` |
| Branch | `main` |
| Build Command | `npm install && npx prisma generate && npx prisma db push && npm run db:seed && npm run build` |
| Start Command | `node scripts/start-server.js` |
| Plan | **Free** (512 MB RAM, 0.1 CPU) |

**PostgreSQL:**

Render Dashboard → New + → PostgreSQL → Create.

После создания скопировать `Internal Database URL` и добавить в переменные Web Service:

```env
DATABASE_URL=<Internal Database URL>
NODE_ENV=production
```

#### Результат

`https://cyberlab.onrender.com` — PostgreSQL, авто-деплой из GitHub.

> Render автоматически пересобирает при пуше в main.
> Бесплатный Web Service "засыпает" — первый запрос после простоя
> выполняется 10–30 секунд (холодный старт).

---

### 4. VPS + Docker — 30 мин

Полноценный продакшен на собственном сервере.

#### Шаги

```bash
# 1. Купить VPS (Ubuntu 22.04 / Debian 12)
#    Рекомендации: Timeweb Cloud, Reg.ru, Hetzner, DigitalOcean
#    Минимум: 1 vCPU, 1 GB RAM, 20 GB SSD

# 2. Подключиться по SSH
ssh root@<IP-сервера>

# 3. Установить Docker и Compose
apt-get update && apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 4. Клонировать проект
git clone https://github.com/QuadDarv1ne/cyberlab-mtusi.git /opt/cyberlab
cd /opt/cyberlab

# 5. Создать .env
cp .env.example .env
```

Отредактировать `.env`:

```env
DATABASE_URL=postgresql://postgres:my_strong_password@cyberlab-postgres:5432/cyberlab?schema=public
POSTGRES_USER=postgres
POSTGRES_PASSWORD=my_strong_password
POSTGRES_DB=cyberlab
NODE_ENV=production
PORT=3000
```

```bash
# 6. Собрать и запустить
docker compose build app
docker compose --profile postgres up -d

# 7. Применить схему и посеять данные
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed

# 8. Настроить Caddy (HTTPS)
```

Создать `/opt/cyberlab/Caddyfile`:

```
cyberlab.example.com {
    reverse_proxy app:3000
}
```

Обновить `docker-compose.yml` — добавить сервис Caddy:

```yaml
services:
  caddy:
    image: caddy:2-alpine
    container_name: cyberlab-caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    networks:
      - cyberlab-net
    depends_on:
      - app

volumes:
  caddy_data:
```

```bash
# 9. Перезапустить с Caddy
docker compose up -d
```

#### Обновление (pull + rebuild)

```bash
cd /opt/cyberlab
git pull
docker compose build app
docker compose up -d
docker compose exec app npx prisma db push
```

#### Результат

`https://cyberlab.example.com` — HTTPS, PostgreSQL, автостарт, логи.

---

### 5. Docker Swarm — 1–2 часа

Кластеризация для высокой доступности. Подходит, если платформой
пользуется вся кафедра и нужна отказоустойчивость.

#### Архитектура

```
          ┌──────────┐
          │  Caddy    │  ← балансировщик (manager node)
          │  (VIP)    │
          └────┬─────┘
       ┌───────┼───────┐
       ▼       ▼       ▼
   ┌──────┐ ┌──────┐ ┌──────┐
   │ App 1 │ │ App 2 │ │ App 3 │  ← 3 реплики (worker nodes)
   └──┬───┘ └──┬───┘ └──┬───┘
      └────────┼────────┘
               ▼
          ┌──────────┐
          │PostgreSQL│  ← внешний или Replication Set
          │ MongoDB  │
          └──────────┘
```

#### Шаги

```bash
# 1. Подготовить 3+ сервера (Ubuntu 22.04)
#    manager1 (4 GB RAM, 2 vCPU)
#    worker1  (2 GB RAM, 1 vCPU)
#    worker2  (2 GB RAM, 1 vCPU)

# 2. Установить Docker на всех
curl -fsSL https://get.docker.com | bash

# 3. Инициализировать Swarm на manager
docker swarm init --advertise-addr <MANAGER_IP>

# 4. Добавить worker'ов (вывод из шага 3)
docker swarm join --token <TOKEN> <MANAGER_IP>:2377

# 5. На manager: создать стек
git clone https://github.com/QuadDarv1ne/cyberlab-mtusi.git /opt/cyberlab
cd /opt/cyberlab
```

Создать `docker-stack.yml`:

```yaml
version: '3.8'

services:
  app:
    image: cyberlab-app:latest
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:pass@postgres:5432/cyberlab?schema=public
      NODE_ENV: production
    ports:
      - "3000"
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    networks:
      - cyberlab-net

  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: cyberlab
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      placement:
        constraints: [node.role == manager]
    networks:
      - cyberlab-net

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    deploy:
      replicas: 2
      placement:
        constraints: [node.role == manager]
    networks:
      - cyberlab-net

networks:
  cyberlab-net:
    driver: overlay

volumes:
  postgres_data:
  caddy_data:
```

```bash
# 6. Собрать образ
docker build -t cyberlab-app:latest .

# 7. Развернуть стек
docker stack deploy -c docker-stack.yml cyberlab

# 8. Проверить
docker stack services cyberlab
docker service ps cyberlab_app

# 9. Масштабировать
docker service scale cyberlab_app=5
```

#### Роллбек

```bash
# Откатить последнее обновление сервиса
docker service update --rollback cyberlab_app

# Переключиться на конкретный образ
docker service update --image cyberlab-app:previous-tag cyberlab_app
```

#### Результат

Кластер из 3+ нод. При падении любого worker'а трафик идёт на живые.
При падении manager'а — Caddy на втором manager перехватывает.

---

### 6. Netlify — 5 мин

Netlify — как Vercel, но для статики + serverless-функции.

#### Важно

Netlify работает только с **Next.js статической генерацией (SSG)**.
API-роуты (`/api/*`) превращаются в Netlify Functions.
Это накладывает ограничения: Prisma в serverless = холодный старт.

#### Шаги

```bash
# 1. Зарегистрироваться на https://netlify.com
# 2. Нажать "Add new site" → "Import an existing project"
# 3. Подключить GitHub-репозиторий
```

Настройки сборки:

| Параметр | Значение |
|----------|----------|
| Base directory | `/` |
| Build command | `npm install && npx prisma generate && next build` |
| Publish directory | `.next` |
| Functions directory | `netlify/functions` |

**Переменные окружения:**

```env
DATABASE_URL=postgresql://postgres:pass@db.xxxxx.supabase.co:5432/postgres?schema=public
NEXT_PUBLIC_NETLIFY=true
```

**Netlify TOML** — создать `netlify.toml` в корне:

```toml
[build]
  command = "npm install && npx prisma generate && npx prisma db push && npm run db:seed && next build"
  publish = ".next"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

> Netlify Functions имеют лимит 10秒 / 10 MB.
> Для API-тяжёлых операций (dashboard) может не хватить.

#### Результат

`https://cyberlab.netlify.app` — SSG + Netlify Functions + Supabase.

---

### 7. Yandex Cloud — 20 мин

Для развёртывания внутри РФ без риска блокировок.

#### Шаги

```bash
# 1. Зарегистрироваться на https://cloud.yandex.ru
# 2. Получить 4000 ₽ на старте (первые 60 дней)

# 3. Установить YC CLI
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
yc init
```

**Создание ВМ:**

```bash
# 4. Создать виртуальную машину
yc compute instance create \
  --name cyberlab \
  --zone ru-central1-a \
  --cores 2 \
  --memory 2 \
  --create-boot-disk size=20GB,image-folder-id=standard-images,image-family=ubuntu-2204-lts \
  --network-interface subnet-name=default-ru-central1-a,nat-ip-version=ipv4 \
  --ssh-key ~/.ssh/id_rsa.pub

# 5. Получить публичный IP
yc compute instance get cyberlab --format json | jq -r '.network_interfaces[0].primary_v4_address.one_to_one_nat.address'
```

**Управляемый PostgreSQL:**

```bash
# 6. Создать кластер PostgreSQL
yc managed-postgresql cluster create \
  --name cyberlab-db \
  --environment production \
  --network-id <network-id> \
  --host zone-id=ru-central1-a,subnet-id=<subnet-id> \
  --user name=cyberlab,password=strong_password \
  --database name=cyberlab

# 7. Получить хост
yc managed-postgresql cluster list-hosts cyberlab-db --format json | jq -r '.[0].name'
```

**Настройка ВМ:**

```bash
# 8. Подключиться по SSH
ssh ubuntu@<PUBLIC_IP>

# 9. Установить Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER

# 10. Клонировать и запустить
git clone https://github.com/QuadDarv1ne/cyberlab-mtusi.git /opt/cyberlab
cd /opt/cyberlab

# 11. .env — указать хост из шага 7
cat > .env << EOF
DATABASE_URL=postgresql://cyberlab:strong_password@rc1a-xxxxx.mdb.yandexcloud.net:6432/cyberlab?schema=public&ssl=true&sslmode=require
NODE_ENV=production
PORT=3000
EOF

# 12. Установить Node.js и запустить
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run build

# 13. PM2
npm install -g pm2
pm2 start scripts/start-server.js --name cyberlab
pm2 save
pm2 startup
```

**HTTPS (Certbot или Caddy):**

```bash
sudo apt-get install -y caddy
```

Создать `/etc/caddy/Caddyfile`:
```
cyberlab.example.com {
    reverse_proxy localhost:3000
}
```

Если домена нет — Caddy на IP не выдаст сертификат.
Используйте Yandex Certificate Manager для своего домена.

#### Результат

`https://cyberlab.example.com` — управляемый PostgreSQL, ВМ под полным контролем.

---

## Бэкапы

### Ручные

```bash
# PostgreSQL
pg_dump "postgresql://user:pass@localhost:5432/cyberlab?schema=public" \
  --no-owner --no-acl \
  | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Восстановление
gunzip -c backup_20260527_120000.sql.gz | psql "postgresql://user:pass@localhost:5432/cyberlab?schema=public"

# MongoDB
mongodump --uri="mongodb://user:pass@localhost:27017/cyberlab" \
  --gzip --archive=backup_$(date +%Y%m%d_%H%M%S).gz

# Восстановление
mongorestore --gzip --archive=backup_20260527_120000.gz

# SQLite (просто копировать файл)
cp db/custom.db backup/backup_$(date +%Y%m%d_%H%M%S).db
```

### Автоматические (cron)

Создать скрипт `/opt/cyberlab/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/cyberlab"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)

cd /opt/cyberlab

# Определить тип БД
if grep -q "postgresql" .env 2>/dev/null; then
  pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"
elif grep -q "mongodb" .env 2>/dev/null; then
  mongodump --uri="$MONGODB_URI" --gzip --archive="$BACKUP_DIR/db_$DATE.gz"
else
  cp db/custom.db "$BACKUP_DIR/db_$DATE.db"
fi

# Хранить 30 дней
find "$BACKUP_DIR" -name "db_*" -mtime +30 -delete

echo "[$(date)] Backup created: $BACKUP_DIR/db_$DATE" >> "$BACKUP_DIR/backup.log"
```

```bash
chmod +x /opt/cyberlab/scripts/backup.sh
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/cyberlab/scripts/backup.sh") | crontab -
```

> Каждый день в 3:00 ночи — автоматический бэкап.
> Хранятся 30 дней, старые удаляются.

---

## Мониторинг (Prometheus + Grafana)

### Docker Compose мониторинг

Добавить в `docker-compose.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: cyberlab-prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - cyberlab-net

  grafana:
    image: grafana/grafana:latest
    container_name: cyberlab-grafana
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - cyberlab-net

  node-exporter:
    image: prom/node-exporter:latest
    container_name: cyberlab-node-exporter
    ports:
      - "9100:9100"
    networks:
      - cyberlab-net
```

Создать `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'app'
    metrics_path: '/api/health'
    static_configs:
      - targets: ['app:3000']
```

Добавить эндпоинт `/api/health` в `src/app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  })
}
```

### Метрики для мониторинга

| Метрика | Описание | Источник |
|---------|----------|----------|
| CPU / RAM / Disk | Загрузка сервера | node-exporter |
| Uptime | Время работы приложения | `/api/health` |
| DB connection | Статус подключения к БД | `/api/health` |
| HTTP 5xx | Ошибки сервера | Caddy / Nginx logs |
| Response time (p50/p95/p99) | Задержка ответов | Caddy logs |

### Grafana Dashboard

1. Открыть `http://<сервер>:3001` (логин: admin / admin)
2. Добавить Data Source → Prometheus (`http://prometheus:9090`)
3. Импортировать Dashboard ID `1860` (Node Exporter Full)
4. Настроить алерты: Telegram / Email

---

## CI/CD через GitHub Actions

Создать `.github/workflows/deploy.yml`:

```yaml
name: Deploy CyberLab

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm run build

  deploy-vps:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/cyberlab
            git pull
            docker compose build app
            docker compose up -d
            docker compose exec app npx prisma db push

  deploy-railway:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: npx railway up --service cyberlab
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Настройка Secrets

В GitHub → Settings → Secrets and variables → Actions:

| Secret | Описание |
|--------|----------|
| `VPS_HOST` | IP-адрес VPS |
| `VPS_USER` | Пользователь SSH (обычно `root` или `ubuntu`) |
| `VPS_SSH_KEY` | Приватный SSH-ключ |
| `RAILWAY_TOKEN` | Railway API токен (настройки → Tokens) |

---

## Чеклист деплоя

### Перед деплоем

- [ ] Создан `.env` с правильными переменными
- [ ] `DATABASE_URL` указывает на существующую БД
- [ ] Пароли БД изменены (не default)
- [ ] `prisma generate` выполнен без ошибок
- [ ] `prisma db push` применил схему
- [ ] `npm run db:seed` заполнил данные
- [ ] `npm run lint` — 0 errors
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npm run build` — compiled successfully
- [ ] Приложение открывается на `http://localhost:3000`
- [ ] API-роуты отвечают (`/api/labs`, `/api/students`, etc.)
- [ ] Отправка флага работает (POST `/api/flags`)
- [ ] Дашборд показывает данные (GET `/api/dashboard`)

### После деплоя

- [ ] HTTPS работает (Caddy / Certbot)
- [ ] Домен привязан (DNS A-запись на IP сервера)
- [ ] Порты 80/443 открыты в файрволе
- [ ] Порт 22 (SSH) доступен только по ключу
- [ ] Настроены автоматические бэкапы (cron)
- [ ] Настроен мониторинг (PM2 / Grafana)
- [ ] CI/CD пайплайн проходит
- [ ] Студенты могут подключиться и отправлять флаги

---

## Troubleshooting и rollback

### Приложение не запускается

```
Error: Cannot find module 'prisma/client'
```

```bash
npm install
npx prisma generate
```

```
Error: Can't reach database server
```

Проверьте:
- `DATABASE_URL` в `.env` (синтаксис, хост, порт)
- БД запущена: `docker ps` / `systemctl status postgresql`
- Файрвол: `sudo ufw status`

```
Error: Port 3000 is already in use
```

```bash
# Найти процесс
lsof -i :3000
# или Windows
netstat -ano | findstr :3000

# Убить
kill -9 <PID>
# или Windows
taskkill /PID <PID> /F
```

### База данных

```
PrismaClientInitializationError: Invalid `prisma.lab.findMany()`
```

Причина: схема Prisma не применена к БД.
Решение:
```bash
npx prisma db push
```

```
Error: relation "Lab" does not exist
```

Причина: PostgreSQL, миграция не выполнена.
Решение:
```bash
npx prisma db push
```

### Docker / Docker Swarm

```
docker: 'compose' is not a docker command.
```

```bash
sudo apt-get install docker-compose-plugin
# или используйте docker-compose (с дефисом)
```

```
Service replicas are failing to start
```

```bash
docker service logs cyberlab_app
docker service ps cyberlab_app --no-trunc
```

### Откат (rollback)

**Docker Compose:**
```bash
# Откатить до предыдущего коммита
cd /opt/cyberlab
git revert HEAD
# или
git reset --hard HEAD~1
# Пересобрать
docker compose build app
docker compose up -d
```

**Docker Swarm:**
```bash
# Откатить последнее обновление сервиса
docker service update --rollback cyberlab_app
```

**VPS (без Docker):**
```bash
# Переключиться на предыдущую сборку
cd /opt/cyberlab
git stash
git checkout <предыдущий-коммит>
npm ci
npm run build
pm2 restart cyberlab
```

**Vercel:**
```bash
# В дашборде Vercel → Deployments → три точки → Promote to Production
# Или CLI:
vercel rollback
```

**Railway:**
```bash
# Railway → Deployments → выбрать предыдущий → "Deploy"
# Или CLI:
railway rollback
```

---

<div align="center">

**CyberLab v2** — © 2025–2026 Дуплей Максим Игоревич. Все права защищены.

</div>
