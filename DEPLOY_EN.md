<div align="center">

# CyberLab v2 Deployment

### A guide to hosting the platform for other users

</div>

---

## Table of Contents

- [Quick Platform Comparison Table](#quick-platform-comparison-table)
- [All Environment Variables](#all-environment-variables)
- [SQLite vs PostgreSQL — when to use what](#sqlite-vs-postgresql--when-to-use-what)
- [Step-by-Step Guides](#step-by-step-guides)
  - [1. Vercel + Supabase — 5 min](#1-vercel--supabase--5-min)
  - [2. Railway (with SQLite) — 3 min](#2-railway-with-sqlite--3-min)
  - [3. Render — 10 min](#3-render--10-min)
  - [4. VPS + Docker — 30 min](#4-vps--docker--30-min)
  - [5. Docker Swarm — 1–2 hours](#5-docker-swarm--12-hours)
  - [6. Netlify — 5 min](#6-netlify--5-min)
  - [7. Yandex Cloud — 20 min](#7-yandex-cloud--20-min)
- [Backups](#backups)
- [Monitoring (Prometheus + Grafana)](#monitoring-prometheus--grafana)
- [CI/CD via GitHub Actions](#cicd-via-github-actions)
- [Deployment Checklist](#deployment-checklist)
- [Troubleshooting and Rollback](#troubleshooting-and-rollback)

---

## Quick Platform Comparison Table

| Platform | Difficulty | Time | Free? | RAM | Database | Traffic | Domain |
|----------|-----------|------|-------|-----|----------|---------|--------|
| **Vercel + Supabase** | ★☆☆ | 5 min | Yes (Hobby) | 1 GB (Serverless) | PostgreSQL via Supabase | 100 GB/mo | `<project>.vercel.app` |
| **Railway** | ★☆☆ | 3 min | Yes ($5 credit) | 512 MB | SQLite (file) | 1 TB/mo | `<project>.railway.app` |
| **Render** | ★★☆ | 10 min | Yes (Free) | 512 MB | PostgreSQL | 100 GB/mo | `<project>.onrender.com` |
| **VPS + Docker** | ★★☆ | 30 min | No (from $5) | ∞ | Any | ∞ | Custom |
| **Docker Swarm** | ★★★ | 1–2 h | No (from $15) | ∞ | Any (cluster) | ∞ | Custom (load-balanced) |
| **Netlify** | ★☆☆ | 5 min | Yes (Free) | 512 MB (Serverless) | Supabase / Atlas | 100 GB/mo | `<project>.netlify.app` |
| **Yandex Cloud** | ★★☆ | 20 min | 4000 RUB start | 1+ GB | PostgreSQL Managed | 5+ GB/mo | Custom (YMQ) |

---

## All Environment Variables

### Required (at least one database connection string)

```env
# ==========================================
# Database (choose one)
# ==========================================

# SQLite (default)
# DATABASE_URL=file:./db/custom.db

# PostgreSQL
# DATABASE_URL=postgresql://user:pass@host:5432/dbname?schema=public

# MongoDB
# MONGODB_URI=mongodb://user:pass@host:27017/dbname?authSource=admin
```

### Optional

```env
# ==========================================
# Force a specific database type
# (auto-detected from DATABASE_URL if not set)
# ==========================================
# DB_TYPE=sqlite
# DB_TYPE=postgresql
# DB_TYPE=mongodb

# ==========================================
# Port (auto-detected: scans from 3000 upward)
# ==========================================
# PORT=3000

# ==========================================
# Environment
# ==========================================
# NODE_ENV=development
# NODE_ENV=production

# ==========================================
# PostgreSQL (mapped into DATABASE_URL)
# ==========================================
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=postgres
# POSTGRES_DB=cyberlab
# POSTGRES_PORT=5432
# POSTGRES_HOST=localhost

# ==========================================
# MongoDB (mapped into MONGODB_URI)
# ==========================================
# MONGODB_USER=root
# MONGODB_PASSWORD=root
# MONGODB_PORT=27017
# MONGODB_HOST=localhost

# ==========================================
# Supabase (for Vercel/Supabase setup)
# ==========================================
# SUPABASE_URL=https://project.supabase.co
# SUPABASE_KEY=anon-public-key
# NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-public-key
```

### For Yandex Cloud

```env
YC_FOLDER_ID=b1gxxxxxxxxxx
YC_ZONE=ru-central1-a
YC_SUBNET_ID=e9bxxxxxxxxxx
YC_SERVICE_ACCOUNT_ID=ajexxxxxxxxxx
YC_IMAGE_ID=fd8xxxxxxxxxx
```

---

## SQLite vs PostgreSQL — when to use what

| Criteria | SQLite | PostgreSQL |
|----------|--------|------------|
| **Users** | 1–10 | 10+ |
| **Concurrent writes** | 1 (write lock) | Many (MVCC) |
| **Reliability** | Low (single file) | High (WAL, PITR) |
| **Backups** | Copy the file | `pg_dump` |
| **Size** | Small (embedded) | Requires a server |
| **Ease of use** | ★★★★★ (zero config) | ★★★ (install + configure) |
| **When to use** | Development, 1–2 students | Production, groups >10 |

### Migrating from SQLite to PostgreSQL

```bash
# 1. Install pgloader
sudo apt install pgloader                          # Linux
brew install pgloader                               # macOS

# 2. Dump SQLite
sqlite3 db/custom.db ".dump" > dump.sql

# 3. Import into PostgreSQL
pgloader db/custom.db postgresql://user:pass@localhost/cyberlab

# 4. Change DATABASE_URL in .env
# DATABASE_URL=postgresql://user:pass@localhost:5432/cyberlab?schema=public

# 5. Re-apply Prisma schema
npx prisma db push

# 6. Re-seed if pgloader failed
npm run db:seed

# 7. Verify
npm run dev
```

### Migrating from SQLite to MongoDB

```bash
# 1. Install mongoimport
# https://www.mongodb.com/try/download/database-tools

# 2. Export SQLite tables as JSON
sqlite3 db/custom.db "SELECT * FROM Lab;" -json > labs.json
sqlite3 db/custom.db "SELECT * FROM Student;" -json > students.json
# ... remaining tables

# 3. Import into MongoDB
mongoimport --uri="mongodb://localhost:27017/cyberlab" --collection=labs --file=labs.json
mongoimport --uri="mongodb://localhost:27017/cyberlab" --collection=students --file=students.json

# 4. Re-seed flags
npm run db:seed:mongo
```

---

## Step-by-Step Guides

---

### 1. Vercel + Supabase — 5 min

A free pairing: frontend on Vercel, database on Supabase (PostgreSQL).

#### Steps

**Supabase:**

```bash
# 1. Sign up at https://supabase.com
# 2. Click "New project"
# 3. Remember the Database Password
# 4. After creation, open "Project Settings" → "Database"
#    — copy the Connection string (URI)
```

**Vercel:**

```bash
# 5. Sign up at https://vercel.com
# 6. Click "Add New" → "Project"
# 7. Import the GitHub repository QuadDarv1ne/cyberlab-mtusi
```

**Environment variables:**

In Vercel → Project Settings → Environment Variables, add:

```env
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?schema=public
```

**Build & Deploy:**

```bash
# Vercel detects Next.js automatically.
# Default settings:
#   Build Command:   next build
#   Output Directory: .next
```

After deployment, open the Vercel Shell and run:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

#### Result

`https://cyberlab.vercel.app` — HTTPS, PostgreSQL.

> **Important:** Prisma + PostgreSQL — run migrations manually via Shell.
> Free Vercel tier: 100 GB traffic/mo, 6000 build minutes.

---

### 2. Railway (with SQLite) — 3 min

Railway supports persistent volumes — SQLite works perfectly.

#### Steps

```bash
# 1. Sign up at https://railway.app (GitHub OAuth)
# 2. Click "New Project" → "Deploy from GitHub"
# 3. Select the repository QuadDarv1ne/cyberlab-mtusi
```

**Configuration:**

Railway project → Variables:

```env
NODE_ENV=production
DATABASE_URL=file:./db/custom.db
PORT=3000
```

Deploy settings (Railway → Settings → Deploy):

| Parameter | Value |
|-----------|-------|
| Build Command | `npm install && npx prisma generate && npx prisma db push && npm run db:seed && npm run build` |
| Start Command | `node scripts/start-server.js` |
| Root Directory | `/` |
| Healthcheck Path | `/` |

**Persistent Volume (so SQLite survives redeploys):**

Railway → Volumes → Add Volume:
- Mount Path: `/app/prisma/db`
- Size: 1 GB (free)

Railway automatically mounts the volume to `/app/prisma/db`.

> **Note:** Railway gives $5 of free credits. SQLite on a volume
> costs $0.2/GB/mo. This is enough for years.

#### Result

`https://cyberlab.up.railway.app` — up and running in 3 minutes.

---

### 3. Render — 10 min

Render is a cloud host with a free tier (sleeps after 15 min of inactivity).

#### Steps

```bash
# 1. Sign up at https://render.com (GitHub OAuth)
```

**Web Service:**

Render Dashboard → New + → Web Service → Connect GitHub repo.

Settings:

| Parameter | Value |
|-----------|-------|
| Name | `cyberlab` |
| Region | `Frankfurt (EU)` |
| Runtime | `Node` |
| Branch | `main` |
| Build Command | `npm install && npx prisma generate && npx prisma db push && npm run db:seed && npm run build` |
| Start Command | `node scripts/start-server.js` |
| Plan | **Free** (512 MB RAM, 0.1 CPU) |

**PostgreSQL:**

Render Dashboard → New + → PostgreSQL → Create.

After creation, copy the `Internal Database URL` and add it as a Web Service environment variable:

```env
DATABASE_URL=<Internal Database URL>
NODE_ENV=production
```

#### Result

`https://cyberlab.onrender.com` — PostgreSQL, auto-deploy from GitHub.

> Render automatically rebuilds on push to main.
> The free Web Service "sleeps" — the first request after inactivity
> takes 10–30 seconds (cold start).

---

### 4. VPS + Docker — 30 min

Full production setup on your own server.

#### Steps

```bash
# 1. Buy a VPS (Ubuntu 22.04 / Debian 12)
#    Recommended: Timeweb Cloud, Reg.ru, Hetzner, DigitalOcean
#    Minimum: 1 vCPU, 1 GB RAM, 20 GB SSD

# 2. Connect via SSH
ssh root@<SERVER_IP>

# 3. Install Docker and Compose
apt-get update && apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 4. Clone the project
git clone https://github.com/QuadDarv1ne/cyberlab-mtusi.git /opt/cyberlab
cd /opt/cyberlab

# 5. Create .env
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:my_strong_password@cyberlab-postgres:5432/cyberlab?schema=public
POSTGRES_USER=postgres
POSTGRES_PASSWORD=my_strong_password
POSTGRES_DB=cyberlab
NODE_ENV=production
PORT=3000
```

```bash
# 6. Build and start
docker compose build app
docker compose --profile postgres up -d

# 7. Apply schema and seed
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed

# 8. Set up Caddy (HTTPS)
```

Create `/opt/cyberlab/Caddyfile`:

```
cyberlab.example.com {
    reverse_proxy app:3000
}
```

Update `docker-compose.yml` — add the Caddy service:

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
# 9. Restart with Caddy
docker compose up -d
```

#### Updating (pull + rebuild)

```bash
cd /opt/cyberlab
git pull
docker compose build app
docker compose up -d
docker compose exec app npx prisma db push
```

#### Result

`https://cyberlab.example.com` — HTTPS, PostgreSQL, auto-start, logs.

---

### 5. Docker Swarm — 1–2 hours

Clustering for high availability. Suitable when the whole department uses
the platform and uptime is critical.

#### Architecture

```
          ┌──────────┐
          │  Caddy    │  ← load balancer (manager node)
          │  (VIP)    │
          └────┬─────┘
       ┌───────┼───────┐
       ▼       ▼       ▼
   ┌──────┐ ┌──────┐ ┌──────┐
   │ App 1 │ │ App 2 │ │ App 3 │  ← 3 replicas (worker nodes)
   └──┬───┘ └──┬───┘ └──┬───┘
      └────────┼────────┘
               ▼
          ┌──────────┐
          │PostgreSQL│  ← external or Replication Set
          │ MongoDB  │
          └──────────┘
```

#### Steps

```bash
# 1. Prepare 3+ servers (Ubuntu 22.04)
#    manager1 (4 GB RAM, 2 vCPU)
#    worker1  (2 GB RAM, 1 vCPU)
#    worker2  (2 GB RAM, 1 vCPU)

# 2. Install Docker on all servers
curl -fsSL https://get.docker.com | bash

# 3. Initialize Swarm on the manager
docker swarm init --advertise-addr <MANAGER_IP>

# 4. Add workers (output from step 3)
docker swarm join --token <TOKEN> <MANAGER_IP>:2377

# 5. On the manager: create the stack
git clone https://github.com/QuadDarv1ne/cyberlab-mtusi.git /opt/cyberlab
cd /opt/cyberlab
```

Create `docker-stack.yml`:

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
# 6. Build the image
docker build -t cyberlab-app:latest .

# 7. Deploy the stack
docker stack deploy -c docker-stack.yml cyberlab

# 8. Verify
docker stack services cyberlab
docker service ps cyberlab_app

# 9. Scale
docker service scale cyberlab_app=5
```

#### Rollback

```bash
# Roll back the last service update
docker service update --rollback cyberlab_app

# Switch to a specific image
docker service update --image cyberlab-app:previous-tag cyberlab_app
```

#### Result

Cluster of 3+ nodes. If any worker goes down, traffic is routed to the
remaining nodes. If a manager goes down, the other manager's Caddy
takes over.

---

### 6. Netlify — 5 min

Netlify is like Vercel, but for static sites + serverless functions.

#### Important

Netlify only works with **Next.js Static Generation (SSG)**.
API routes (`/api/*`) become Netlify Functions.
This has limitations: Prisma in serverless = cold start.

#### Steps

```bash
# 1. Sign up at https://netlify.com
# 2. Click "Add new site" → "Import an existing project"
# 3. Connect a GitHub repository
```

Build settings:

| Parameter | Value |
|-----------|-------|
| Base directory | `/` |
| Build command | `npm install && npx prisma generate && next build` |
| Publish directory | `.next` |
| Functions directory | `netlify/functions` |

**Environment variables:**

```env
DATABASE_URL=postgresql://postgres:pass@db.xxxxx.supabase.co:5432/postgres?schema=public
NEXT_PUBLIC_NETLIFY=true
```

**Netlify TOML** — create `netlify.toml` in the root:

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

> Netlify Functions have a 10-second / 10 MB limit.
> Heavy API operations (dashboard aggregation) may time out.

#### Result

`https://cyberlab.netlify.app` — SSG + Netlify Functions + Supabase.

---

### 7. Yandex Cloud — 20 min

For deployments within Russia without risk of service blocks.

#### Steps

```bash
# 1. Sign up at https://cloud.yandex.ru
# 2. Get 4000 RUB in initial credits (first 60 days)

# 3. Install YC CLI
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
yc init
```

**Creating a VM:**

```bash
# 4. Create a virtual machine
yc compute instance create \
  --name cyberlab \
  --zone ru-central1-a \
  --cores 2 \
  --memory 2 \
  --create-boot-disk size=20GB,image-folder-id=standard-images,image-family=ubuntu-2204-lts \
  --network-interface subnet-name=default-ru-central1-a,nat-ip-version=ipv4 \
  --ssh-key ~/.ssh/id_rsa.pub

# 5. Get the public IP
yc compute instance get cyberlab --format json | jq -r '.network_interfaces[0].primary_v4_address.one_to_one_nat.address'
```

**Managed PostgreSQL:**

```bash
# 6. Create a PostgreSQL cluster
yc managed-postgresql cluster create \
  --name cyberlab-db \
  --environment production \
  --network-id <network-id> \
  --host zone-id=ru-central1-a,subnet-id=<subnet-id> \
  --user name=cyberlab,password=strong_password \
  --database name=cyberlab

# 7. Get the host
yc managed-postgresql cluster list-hosts cyberlab-db --format json | jq -r '.[0].name'
```

**Setting up the VM:**

```bash
# 8. Connect via SSH
ssh ubuntu@<PUBLIC_IP>

# 9. Install Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER

# 10. Clone and start
git clone https://github.com/QuadDarv1ne/cyberlab-mtusi.git /opt/cyberlab
cd /opt/cyberlab

# 11. .env — point to the host from step 7
cat > .env << EOF
DATABASE_URL=postgresql://cyberlab:strong_password@rc1a-xxxxx.mdb.yandexcloud.net:6432/cyberlab?schema=public&ssl=true&sslmode=require
NODE_ENV=production
PORT=3000
EOF

# 12. Install Node.js and start
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

**HTTPS (Certbot or Caddy):**

```bash
sudo apt-get install -y caddy
```

Create `/etc/caddy/Caddyfile`:
```
cyberlab.example.com {
    reverse_proxy localhost:3000
}
```

If you don't have a domain, Caddy won't issue a certificate for an IP.
Use Yandex Certificate Manager for your domain.

#### Result

`https://cyberlab.example.com` — managed PostgreSQL, full control over the VM.

---

## Backups

### Manual

```bash
# PostgreSQL
pg_dump "postgresql://user:pass@localhost:5432/cyberlab?schema=public" \
  --no-owner --no-acl \
  | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore
gunzip -c backup_20260527_120000.sql.gz | psql "postgresql://user:pass@localhost:5432/cyberlab?schema=public"

# MongoDB
mongodump --uri="mongodb://user:pass@localhost:27017/cyberlab" \
  --gzip --archive=backup_$(date +%Y%m%d_%H%M%S).gz

# Restore
mongorestore --gzip --archive=backup_20260527_120000.gz

# SQLite (just copy the file)
cp db/custom.db backup/backup_$(date +%Y%m%d_%H%M%S).db
```

### Automatic (cron)

Create the script `/opt/cyberlab/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/cyberlab"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)

cd /opt/cyberlab

# Detect database type
if grep -q "postgresql" .env 2>/dev/null; then
  pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"
elif grep -q "mongodb" .env 2>/dev/null; then
  mongodump --uri="$MONGODB_URI" --gzip --archive="$BACKUP_DIR/db_$DATE.gz"
else
  cp db/custom.db "$BACKUP_DIR/db_$DATE.db"
fi

# Keep 30 days
find "$BACKUP_DIR" -name "db_*" -mtime +30 -delete

echo "[$(date)] Backup created: $BACKUP_DIR/db_$DATE" >> "$BACKUP_DIR/backup.log"
```

```bash
chmod +x /opt/cyberlab/scripts/backup.sh
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/cyberlab/scripts/backup.sh") | crontab -
```

> Backs up daily at 3:00 AM. Keeps 30 days, deletes old ones.

---

## Monitoring (Prometheus + Grafana)

### Docker Compose monitoring

Add to `docker-compose.yml`:

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

Create `prometheus.yml`:

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

Add a health endpoint at `src/app/api/health/route.ts`:

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

### Monitoring metrics

| Metric | Description | Source |
|--------|-------------|--------|
| CPU / RAM / Disk | Server resource usage | node-exporter |
| Uptime | Application uptime | `/api/health` |
| DB connection | Database connectivity | `/api/health` |
| HTTP 5xx | Server errors | Caddy / Nginx logs |
| Response time (p50/p95/p99) | Request latency | Caddy logs |

### Grafana Dashboard

1. Open `http://<server>:3001` (login: admin / admin)
2. Add Data Source → Prometheus (`http://prometheus:9090`)
3. Import Dashboard ID `1860` (Node Exporter Full)
4. Set up alerts: Telegram / Email

---

## CI/CD via GitHub Actions

Create `.github/workflows/deploy.yml`:

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

### Setting up Secrets

In GitHub → Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP address |
| `VPS_USER` | SSH user (usually `root` or `ubuntu`) |
| `VPS_SSH_KEY` | Private SSH key |
| `RAILWAY_TOKEN` | Railway API token (Settings → Tokens) |

---

## Deployment Checklist

### Before Deployment

- [ ] `.env` created with correct variables
- [ ] `DATABASE_URL` points to an existing database
- [ ] Database passwords changed (not defaults)
- [ ] `prisma generate` completed without errors
- [ ] `prisma db push` applied the schema
- [ ] `npm run db:seed` populated data
- [ ] `npm run lint` — 0 errors
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npm run build` — compiled successfully
- [ ] App opens at `http://localhost:3000`
- [ ] API routes respond (`/api/labs`, `/api/students`, etc.)
- [ ] Flag submission works (POST `/api/flags`)
- [ ] Dashboard shows data (GET `/api/dashboard`)

### After Deployment

- [ ] HTTPS is working (Caddy / Certbot)
- [ ] Domain is linked (DNS A-record pointing to server IP)
- [ ] Ports 80/443 are open in the firewall
- [ ] Port 22 (SSH) is key-only access
- [ ] Automated backups configured (cron)
- [ ] Monitoring configured (PM2 / Grafana)
- [ ] CI/CD pipeline is passing
- [ ] Students can connect and submit flags

---

## Troubleshooting and Rollback

### App won't start

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

Check:
- `DATABASE_URL` in `.env` (syntax, host, port)
- Database is running: `docker ps` / `systemctl status postgresql`
- Firewall: `sudo ufw status`

```
Error: Port 3000 is already in use
```

```bash
# Find the process
lsof -i :3000
# or Windows
netstat -ano | findstr :3000

# Kill it
kill -9 <PID>
# or Windows
taskkill /PID <PID> /F
```

### Database

```
PrismaClientInitializationError: Invalid `prisma.lab.findMany()`
```

Cause: Prisma schema not applied to the database.
Fix:
```bash
npx prisma db push
```

```
Error: relation "Lab" does not exist
```

Cause: PostgreSQL, migration not run.
Fix:
```bash
npx prisma db push
```

### Docker / Docker Swarm

```
docker: 'compose' is not a docker command.
```

```bash
sudo apt-get install docker-compose-plugin
# or use docker-compose (with a hyphen)
```

```
Service replicas are failing to start
```

```bash
docker service logs cyberlab_app
docker service ps cyberlab_app --no-trunc
```

### Rollback

**Docker Compose:**
```bash
# Revert to the previous commit
cd /opt/cyberlab
git revert HEAD
# or
git reset --hard HEAD~1
# Rebuild
docker compose build app
docker compose up -d
```

**Docker Swarm:**
```bash
# Roll back the last service update
docker service update --rollback cyberlab_app
```

**VPS (without Docker):**
```bash
# Switch to a previous build
cd /opt/cyberlab
git stash
git checkout <previous-commit>
npm ci
npm run build
pm2 restart cyberlab
```

**Vercel:**
```bash
# Vercel Dashboard → Deployments → three dots → Promote to Production
# Or CLI:
vercel rollback
```

**Railway:**
```bash
# Railway → Deployments → select previous → "Deploy"
# Or CLI:
railway rollback
```

---

<div align="center">

**CyberLab v2** — © 2025–2026 Dupley Maxim Igorevich. All rights reserved.

</div>
