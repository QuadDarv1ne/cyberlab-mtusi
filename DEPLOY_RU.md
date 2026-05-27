<div align="center">

# Развёртывание CyberLab v2

### Руководство по запуску платформы для других пользователей

</div>

---

## Содержание

- [1. Выбор платформы](#1-выбор-платформы)
- [2. Локальный сервер в LAN (ВУЗ)](#2-локальный-сервер-в-lan-вуз)
- [3. Docker Compose (VPS)](#3-docker-compose-vps)
- [4. VPS — ручная установка](#4-vps--ручная-установка)
- [5. Railway](#5-railway)
- [6. Render](#6-render)
- [7. Vercel + MongoDB Atlas](#7-vercel--mongodb-atlas)
- [8. Российские хостинги](#8-российские-хостинги)

---

## 1. Выбор платформы

| Платформа | Сложность | Бесплатно? | База данных | Подходит для |
|-----------|-----------|------------|-------------|--------------|
| **Локальный сервер (LAN)** | ★☆☆ | Да | SQLite | Внутривузовское использование |
| **Docker Compose** | ★★☆ | Нет (нужен VPS) | Любая | Продакшен на VPS |
| **VPS (ручная)** | ★★★ | Нет | Любая | Полный контроль |
| **Railway** | ★☆☆ | Есть лимиты | PostgreSQL | Быстрый старт |
| **Render** | ★★☆ | Есть лимиты | PostgreSQL | Быстрый старт |
| **Vercel + Atlas** | ★★☆ | Есть лимиты | MongoDB Atlas | Бесплатно (с ограничениями) |

### Требования к окружению

- **Node.js 18+** (рекомендуется 20+)
- **npm** или **bun**
- **512 MB RAM** минимум (рекомендуется 1+ GB)
- **1 vCPU** минимум

---

## 2. Локальный сервер в LAN (ВУЗ)

Самый простой способ — запустить на компьютере в локальной сети университета.

### Шаги

```bash
# 1. Клонировать репозиторий
git clone https://github.com/QuadDarv1ne/cyberlab-mtusi.git cyberlab
cd cyberlab

# 2. Установить зависимости
npm install

# 3. Настроить базу данных (SQLite — по умолчанию)
npx prisma generate
npx prisma db push
npm run db:seed

# 4. Запустить
npm run build
npm run start:auto
```

Сервер автоматически найдёт свободный порт (начиная с 3000).

### Подключение других пользователей

1. Узнайте IP-адрес сервера в локальной сети:
   ```bash
   # Windows
   ipconfig
   # Linux/macOS
   hostname -I
   ```

2. Откройте порт в брандмауэре:
   ```bash
   # Windows (от имени администратора)
   netsh advfirewall firewall add rule name="CyberLab" dir=in action=allow protocol=TCP localport=3000

   # Linux (Ubuntu/Debian)
   sudo ufw allow 3000
   ```

3. Сообщите студентам адрес: `http://192.168.x.x:3000`

> **Важно:** SQLite не поддерживает одновременные записи от многих пользователей. Для группы >10 человек используйте PostgreSQL или MongoDB.

### Запуск как служба (чтобы не закрывать терминал)

<details>
<summary>Windows (NSSM)</summary>

```bash
# Установить NSSM: https://nssm.cc/download
nssm install CyberLab "C:\Program Files\nodejs\node.exe" "C:\путь\к\проекту\scripts\start-server.js"
nssm set CyberLab AppDirectory "C:\путь\к\проекту"
nssm start CyberLab
```
</details>

<details>
<summary>Linux (systemd)</summary>

```ini
# /etc/systemd/system/cyberlab.service
[Unit]
Description=CyberLab MTUSI
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/cyberlab
ExecStart=/usr/bin/node scripts/start-server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cyberlab
```
</details>

---

## 3. Docker Compose (VPS)

Рекомендуемый способ для продакшена. Изолирует сервисы и упрощает обновление.

### Предварительные требования

- **Docker** и **Docker Compose** установлены на сервере
- **Git** для клонирования репозитория

### Шаги

```bash
# 1. Клонировать репозиторий на сервер
git clone https://github.com/QuadDarv1ne/cyberlab-mtusi.git cyberlab
cd cyberlab

# 2. Создать .env файл (скопировать из .env.example)
cp .env.example .env
```

### Вариант A: PostgreSQL (рекомендуется)

Отредактируйте `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@cyberlab-postgres:5432/cyberlab?schema=public
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=cyberlab
```

Обязательно смените пароль в production!

```bash
# Собрать образ и запустить
docker compose build app
docker compose --profile postgres up -d

# Применить схему БД
docker compose exec app npx prisma db push

# Заполнить начальными данными
docker compose exec app npm run db:seed

# Посмотреть логи
docker compose logs -f
```

### Вариант B: MongoDB

Отредактируйте `.env`:
```env
MONGODB_URI=mongodb://root:root@cyberlab-mongodb:27017/cyberlab?authSource=admin
MONGODB_USER=root
MONGODB_PASSWORD=root
```

```bash
docker compose build app
docker compose --profile mongodb up -d
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed:mongo
```

### Вариант C: SQLite (только для разработки)

```bash
docker compose up -d --profile ""
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed
```

### Подключение пользователей

Приложение будет доступно на порту 3000 вашего сервера:
`http://<IP-сервера>:3000`

### Настройка Caddy для HTTPS (рекомендуется)

Раскомментируйте/настройте `Caddyfile`:

```
your-domain.com {
    reverse_proxy localhost:3000 {
        header_up Host {host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Real-IP {remote_host}
    }
}
```

```bash
docker run -d \
  --name cyberlab-caddy \
  -p 80:80 -p 443:443 \
  -v ./Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  caddy:2-alpine
```

Caddy автоматически получит SSL-сертификат от Let's Encrypt.

---

## 4. VPS — ручная установка

Для полного контроля над окружением.

### Шаги (Ubuntu 22.04+/Debian 12)

```bash
# 1. Установить Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git

# 2. Клонировать проект
git clone https://github.com/QuadDarv1ne/cyberlab-mtusi.git /opt/cyberlab
cd /opt/cyberlab

# 3. Установить зависимости и собрать
npm install
npx prisma generate
npx prisma db push
npm run db:seed

# 4. Настроить PostgreSQL (рекомендуется) или MongoDB
apt-get install -y postgresql postgresql-contrib
sudo -u postgres createuser cyberlab -P
sudo -u postgres createdb cyberlab -O cyberlab
```
В `.env` укажите:
```env
DATABASE_URL=postgresql://cyberlab:пароль@localhost:5432/cyberlab?schema=public
NODE_ENV=production
PORT=3000
```

```bash
# 5. Собрать production-сборку
npm run build

# 6. Установить PM2 для управления процессом
npm install -g pm2
pm2 start scripts/start-server.js --name cyberlab
pm2 save
pm2 startup
```

### Настройка Caddy (HTTPS + reverse proxy)

```bash
# Установить Caddy
apt-get install -y debian-keyring debian-archive-keyring
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update && apt-get install caddy
```

Создайте `/etc/caddy/Caddyfile`:
```
cyberlab.example.com {
    reverse_proxy localhost:3000
}
```

```bash
systemctl enable --now caddy
```

### Подключение пользователей

`https://cyberlab.example.com` — Caddy сам выдаст SSL-сертификат.

---

## 5. Railway

Простейший облачный хостинг (до $5 кредита бесплатно).

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### Шаги

1. Создайте аккаунт на [railway.app](https://railway.app)
2. Нажмите **New Project** → **Deploy from GitHub repo**
3. Выберите репозиторий `QuadDarv1ne/cyberlab-mtusi`
4. Railway автоматически определит Next.js проект

### Настройка PostgreSQL (рекомендуется)

1. В проекте Railway нажмите **New** → **Database** → **Add PostgreSQL**
2. Railway автоматически добавит переменную окружения `DATABASE_URL_PUBLIC`
3. Добавьте в переменные окружения:
   ```
   DATABASE_URL = postgresql://...
   NODE_ENV = production
   PORT = 3000
   ```

4. В **Deploy** → **Shell** выполните:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

### Настройка MongoDB

1. Нажмите **New** → **Database** → **Add MongoDB**
2. Скопируйте `MONGODB_URI` из переменных окружения
3. Добавьте в переменные окружения:
   ```
   MONGODB_URI = mongodb://...
   DB_TYPE = mongodb
   ```

### Важно

- **Build Command:** `npm run build`
- **Start Command:** `node scripts/start-server.js`
- Бесплатный тир спит после 30 минут бездействия

---

## 6. Render

Облачный хостинг с бесплатным тиром (512 MB RAM, спит после 15 минут).

### Шаги

1. Создайте аккаунт на [render.com](https://render.com)
2. Нажмите **New +** → **Web Service**
3. Подключите GitHub-репозиторий `QuadDarv1ne/cyberlab-mtusi`
4. Настройки:

   | Параметр | Значение |
   |----------|----------|
   | Name | `cyberlab` |
   | Runtime | **Node** |
   | Build Command | `npm install && npx prisma generate && npx prisma db push && npm run db:seed && npm run build` |
   | Start Command | `node scripts/start-server.js` |

5. Добавьте переменные окружения:

   ```
   NODE_ENV = production
   ```

6. Создайте базу данных: **New +** → **PostgreSQL**
7. Скопируйте `DATABASE_URL` из PostgreSQL в переменные окружения Web Service

### Подключение пользователей

Render выдаст домен вида `https://cyberlab.onrender.com`.

### Регулярное обновление

При пуше в GitHub Render автоматически пересоберёт и перезапустит приложение.

---

## 7. Vercel + MongoDB Atlas

Vercel — бесплатный хостинг Next.js от Vercel. Ограничение: serverless-функции не поддерживают длительные соединения к SQLite. Необходима внешняя БД.

### Шаги

1. Создайте аккаунт на [vercel.com](https://vercel.com)
2. Установите Vercel CLI:
   ```bash
   npm i -g vercel
   ```

3. В корне проекта выполните:
   ```bash
   vercel login
   vercel --prod
   ```

4. Настройте MongoDB Atlas:
   - Создайте кластер на [mongodb.com/atlas](https://mongodb.com/atlas) (бесплатный M0)
   - Получите строку подключения: `mongodb+srv://user:pass@cluster.mongodb.net/cyberlab`
   - Добавьте IP `0.0.0.0/0` в Network Access (для доступа отовсюду)

5. В настройках Vercel проекта добавьте переменные окружения:
   ```
   MONGODB_URI = mongodb+srv://...
   DB_TYPE = mongodb
   NODE_ENV = production
   ```

6. Укажите скрипт сборки в `vercel.json` (создать в корне проекта):

```json
{
  "buildCommand": "npx prisma generate && next build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### Важно

- **Prisma + MongoDB**: укажите в `.env` для сборки `PRISMA_PROVIDER=mongodb`
- **Serverless-функции** имеют ограничение в 10 секунд на ответ и 50 MB памяти
- На бесплатном тире Vercel — 100 GB трафика и 6000 минут сборки в месяц

---

## 8. Российские хостинги

Для развёртывания в РФ (обходит проблемы с блокировками зарубежных сервисов).

### Timeweb Cloud

1. Создайте аккаунт на [timeweb.cloud](https://timeweb.cloud)
2. Создайте **VDS** (Linux Ubuntu 22.04, минимум 1 vCPU / 1 GB RAM)
3. Подключитесь по SSH и выполните шаги из раздела [4. VPS — ручная установка](#4-vps--ручная-установка)

Преимущества:
- Тарифы от 200 ₽/мес
- Встроенный файрвол
- Бесплатный домен 3-го уровня
- Поддержка российских карт

### Beget

1. Создайте аккаунт на [beget.com](https://beget.com)
2. Выберите тариф **VPS** (или **Dedicated**)
3. В панели управления закажите выделение IP-адреса
4- Установите Node.js через панель управления или SSH

Команды после подключения по SSH:
```bash
# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git

# Далее — шаги из раздела 4
```

### Reg.ru / 1cloud

1. Закажите VPS на [reg.ru](https://reg.ru) или [1cloud.ru](https://1cloud.ru)
2. Выберите образ с Ubuntu 22.04 или Debian 12
3. Повторите шаги из раздела [4. VPS — ручная установка](#4-vps--ручная-установка)

---

## Советы по безопасности

1. **Всегда меняйте пароли БД** перед продакшеном
2. **Используйте HTTPS** — Caddy выдаёт SSL бесплатно
3. **Настройте файрвол** — открывайте только порты 80, 443 (и 22 для SSH)
4. **Регулярно делайте бэкапы** БД:
   ```bash
   # PostgreSQL
   pg_dump cyberlab > backup-$(date +%Y%m%d).sql

   # MongoDB
   mongodump --uri="$MONGODB_URI"
   ```
5. **Мониторинг** через PM2:
   ```bash
   pm2 monit
   pm2 logs cyberlab
   ```

---

## Сравнение платформ

| Характеристика | LAN | Docker | VPS | Railway | Render | Vercel |
|----------------|-----|--------|-----|---------|--------|--------|
| Бесплатно | + | - | - | ± | ± | ± |
| HTTPS | - | + | + | + | + | + |
| Свой домен | - | + | + | + | + | + |
| SQLite | + | + | + | - | - | - |
| PostgreSQL | - | + | + | + | + | - |
| MongoDB | - | + | + | + | - | + |
| Простота | ★★★★★ | ★★★ | ★★ | ★★★★ | ★★★★ | ★★★★ |
| Контроль | ★★★ | ★★★★ | ★★★★★ | ★★ | ★★ | ★★ |

---

<div align="center">

**CyberLab v2** — © 2025–2026 Дуплей Максим Игоревич. Все права защищены.

</div>
