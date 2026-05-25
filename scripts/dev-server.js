#!/usr/bin/env node
/**
 * Development server with auto port detection.
 * Finds an available port and starts Next.js dev server.
 */

const net = require('net')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true))
    })
    server.on('error', () => resolve(false))
  })
}

async function findAvailablePort(startPort, maxAttempts = 10) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    const available = await isPortAvailable(port)
    if (available) return port
  }
  return startPort
}

function detectPort() {
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10)
    if (!isNaN(parsed) && parsed > 0 && parsed < 65536) {
      return parsed
    }
  }
  return 3000
}

function detectDbType() {
  // 1. Explicit override takes highest priority
  if (process.env.DB_TYPE) {
    const validTypes = ['sqlite', 'postgresql', 'mongodb']
    if (validTypes.includes(process.env.DB_TYPE)) {
      return process.env.DB_TYPE
    }
    console.warn(`[dev-server] Invalid DB_TYPE "${process.env.DB_TYPE}", falling back to auto-detection`)
  }

  // 2. Detect from DATABASE_URL pattern
  const databaseUrl = process.env.DATABASE_URL || ''

  if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
    return 'postgresql'
  }

  if (databaseUrl.startsWith('file:')) {
    return 'sqlite'
  }

  // 3. Detect MongoDB from dedicated env var
  if (process.env.MONGODB_URI) {
    return 'mongodb'
  }

  // 4. Fallback: check if SQLite file exists
  try {
    const sqlitePath = path.join(process.cwd(), 'prisma', 'db', 'custom.db')
    if (fs.existsSync(sqlitePath)) {
      return 'sqlite'
    }
  } catch {
    // Ignore errors
  }

  // 5. Ultimate default: SQLite
  return 'sqlite'
}

function setupDatabaseEnv(dbType) {
  switch (dbType) {
    case 'postgresql':
      process.env.PRISMA_PROVIDER = process.env.PRISMA_PROVIDER || 'postgresql'
      process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cyberlab?schema=public'
      break
    case 'mongodb':
      process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyberlab'
      break
    case 'sqlite':
    default:
      process.env.PRISMA_PROVIDER = process.env.PRISMA_PROVIDER || 'sqlite'
      process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./db/custom.db'
      break
  }
}

async function main() {
  const preferredPort = detectPort()
  const port = await findAvailablePort(preferredPort)

  const dbType = detectDbType()
  setupDatabaseEnv(dbType)

  console.log(`[dev-server] Database: ${dbType}`)
  console.log(`[dev-server] Starting Next.js dev server on port ${port}`)

  if (port !== preferredPort) {
    console.warn(`[dev-server] Warning: Port ${preferredPort} was busy, using ${port} instead`)
  }

  process.env.PORT = String(port)

  try {
    execSync(`npx next dev -p ${port}`, { stdio: 'inherit', env: { ...process.env } })
  } catch (error) {
    console.error('[dev-server] Failed to start dev server')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[dev-server] Error:', err)
  process.exit(1)
})
