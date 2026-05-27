<div align="center">

# CyberLab v2 Deployment

### A guide to hosting the platform for other users

</div>

---

## Table of Contents

- [1. Platform Choice](#1-platform-choice)
- [2. Local LAN Server (University)](#2-local-lan-server-university)
- [3. Docker Compose (VPS)](#3-docker-compose-vps)
- [4. Manual VPS Setup](#4-manual-vps-setup)
- [5. Railway](#5-railway)
- [6. Render](#6-render)
- [7. Vercel + MongoDB Atlas](#7-vercel--mongodb-atlas)

---

## 1. Platform Choice

| Platform | Difficulty | Free? | Database | Best for |
|----------|-----------|-------|----------|----------|
| **Local LAN server** | ★☆☆ | Yes | SQLite | In-university use |
| **Docker Compose** | ★★☆ | No (needs VPS) | Any | Production on VPS |
| **Manual VPS** | ★★★ | No | Any | Full control |
| **Railway** | ★☆☆ | Has limits | PostgreSQL | Quick start |
| **Render** | ★★☆ | Has limits | PostgreSQL | Quick start |
| **Vercel + Atlas** | ★★☆ | Has limits | MongoDB Atlas | Free (limited) |

### Requirements

- **Node.js 18+** (20+ recommended)
- **npm** or **bun**
- **512 MB RAM** minimum (1+ GB recommended)
- **1 vCPU** minimum

---

## 2. Local LAN Server (University)

The simplest way — run on a machine in the university's local network.

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/QuadDarv1ne/cyberlab-mtusi.git cyberlab
cd cyberlab

# 2. Install dependencies
npm install

# 3. Set up the database (SQLite by default)
npx prisma generate
npx prisma db push
npm run db:seed

# 4. Build and start
npm run build
npm run start:auto
```

The server will auto-detect a free port (starting from 3000).

### Connecting other users

1. Find the server's IP in the local network:
   ```bash
   # Windows
   ipconfig
   # Linux/macOS
   hostname -I
   ```

2. Open the port in the firewall:
   ```bash
   # Windows (Run as Administrator)
   netsh advfirewall firewall add rule name="CyberLab" dir=in action=allow protocol=TCP localport=3000

   # Linux (Ubuntu/Debian)
   sudo ufw allow 3000
   ```

3. Tell students to open: `http://192.168.x.x:3000`

> **Important:** SQLite does not handle concurrent writes from many users well. For groups >10 people, use PostgreSQL or MongoDB.

### Running as a service

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

Recommended for production. Isolates services and simplifies updates.

### Prerequisites

- **Docker** and **Docker Compose** installed on the server
- **Git** to clone the repository

### Steps

```bash
# 1. Clone the repository to the server
git clone https://github.com/QuadDarv1ne/cyberlab-mtusi.git cyberlab
cd cyberlab

# 2. Create .env file
cp .env.example .env
```

### Option A: PostgreSQL (recommended)

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@cyberlab-postgres:5432/cyberlab?schema=public
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=cyberlab
```

Change the password in production!

```bash
# Build and start
docker compose build app
docker compose --profile postgres up -d

# Apply database schema
docker compose exec app npx prisma db push

# Seed data
docker compose exec app npm run db:seed

# View logs
docker compose logs -f
```

### Option B: MongoDB

Edit `.env`:
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

### Caddy for HTTPS (recommended)

Configure `Caddyfile`:
```
your-domain.com {
    reverse_proxy localhost:3000
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

Caddy automatically gets a free SSL certificate from Let's Encrypt.

---

## 4. Manual VPS Setup

For full control over the environment.

### Steps (Ubuntu 22.04+/Debian 12)

```bash
# 1. Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git

# 2. Clone the project
git clone https://github.com/QuadDarv1ne/cyberlab-mtusi.git /opt/cyberlab
cd /opt/cyberlab

# 3. Install dependencies and build
npm install
npx prisma generate
npx prisma db push
npm run db:seed

# 4. Set up PostgreSQL (recommended)
apt-get install -y postgresql postgresql-contrib
sudo -u postgres createuser cyberlab -P
sudo -u postgres createdb cyberlab -O cyberlab
```

In `.env`:
```env
DATABASE_URL=postgresql://cyberlab:password@localhost:5432/cyberlab?schema=public
NODE_ENV=production
PORT=3000
```

```bash
# 5. Build for production
npm run build

# 6. Install PM2 for process management
npm install -g pm2
pm2 start scripts/start-server.js --name cyberlab
pm2 save
pm2 startup
```

### Caddy (HTTPS + reverse proxy)

```bash
# Install Caddy
apt-get install -y debian-keyring debian-archive-keyring
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update && apt-get install caddy
```

Create `/etc/caddy/Caddyfile`:
```
cyberlab.example.com {
    reverse_proxy localhost:3000
}
```

```bash
systemctl enable --now caddy
```

---

## 5. Railway

Simple cloud hosting (free $5 credit).

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### Steps

1. Create an account at [railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your fork of the repository (or use the `Deploy on Railway` button)

### PostgreSQL Setup

1. In the Railway project, click **New** → **Database** → **Add PostgreSQL**
2. Railway auto-adds `DATABASE_URL_PUBLIC`
3. Add environment variables:
   ```
   DATABASE_URL = postgresql://...
   NODE_ENV = production
   PORT = 3000
   ```

4. In **Deploy** → **Shell**, run:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

### Important

- **Build Command:** `npm run build`
- **Start Command:** `node scripts/start-server.js`
- The free tier sleeps after 30 minutes of inactivity

---

## 6. Render

Cloud hosting with a free tier (512 MB RAM, sleeps after 15 minutes).

### Steps

1. Create an account at [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository (or fork of `QuadDarv1ne/cyberlab-mtusi`)
4. Settings:

   | Parameter | Value |
   |-----------|-------|
   | Name | `cyberlab` |
   | Runtime | **Node** |
   | Build Command | `npm install && npx prisma generate && npx prisma db push && npm run db:seed && npm run build` |
   | Start Command | `node scripts/start-server.js` |

5. Add environment variables:
   ```
   NODE_ENV = production
   ```

6. Create a database: **New +** → **PostgreSQL**
7. Copy `DATABASE_URL` from PostgreSQL into the Web Service environment variables

---

## 7. Vercel + MongoDB Atlas

Vercel is a free Next.js hosting platform from the creators of Next.js. Limitation: serverless functions do not support long-lived connections to SQLite. An external database is required.

### Steps

1. Create an account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```

3. Deploy from the project root:
   ```bash
   vercel login
   vercel --prod
   ```

4. Set up MongoDB Atlas:
   - Create a cluster at [mongodb.com/atlas](https://mongodb.com/atlas) (free M0 tier)
   - Get the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/cyberlab`
   - Add IP `0.0.0.0/0` to Network Access

5. In Vercel project settings, add environment variables:
   ```
   MONGODB_URI = mongodb+srv://...
   DB_TYPE = mongodb
   NODE_ENV = production
   ```

6. Create `vercel.json` in the project root:

```json
{
  "buildCommand": "npx prisma generate && next build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### Important

- **Serverless functions** have a 10-second timeout and 50 MB memory limit
- The free tier includes 100 GB bandwidth and 6000 build minutes per month

---

## Security Tips

1. **Always change default database passwords** before going to production
2. **Use HTTPS** — Caddy provides free SSL certificates
3. **Configure a firewall** — only open ports 80, 443 (and 22 for SSH)
4. **Back up your database regularly**:
   ```bash
   # PostgreSQL
   pg_dump cyberlab > backup-$(date +%Y%m%d).sql

   # MongoDB
   mongodump --uri="$MONGODB_URI"
   ```
5. **Monitor with PM2**:
   ```bash
   pm2 monit
   pm2 logs cyberlab
   ```

## Platform Comparison

| Feature | LAN | Docker | VPS | Railway | Render | Vercel |
|---------|-----|--------|-----|---------|--------|--------|
| Free | ✓ | - | - | ~ | ~ | ~ |
| HTTPS | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| Custom domain | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| SQLite | ✓ | ✓ | ✓ | - | - | - |
| PostgreSQL | - | ✓ | ✓ | ✓ | ✓ | - |
| MongoDB | - | ✓ | ✓ | ✓ | - | ✓ |
| Ease | ★★★★★ | ★★★ | ★★ | ★★★★ | ★★★★ | ★★★★ |
| Control | ★★★ | ★★★★ | ★★★★★ | ★★ | ★★ | ★★ |

---

<div align="center">

**CyberLab v2** — © 2025–2026 Dupley Maxim Igorevich. All rights reserved.

</div>
