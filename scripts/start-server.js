#!/usr/bin/env node
/**
 * Production server with auto port detection.
 * Finds an available port and starts the standalone Next.js server.
 */

const net = require('net')
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

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
    console.warn(`[start-server] Invalid DB_TYPE "${process.env.DB_TYPE}", falling back to auto-detection`)
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

  console.log(`[start-server] Database: ${dbType}`)
  console.log(`[start-server] Starting production server on port ${port}`)

  if (port !== preferredPort) {
    console.warn(`[start-server] Warning: Port ${preferredPort} was busy, using ${port} instead`)
  }

  process.env.PORT = String(port)
  process.env.NODE_ENV = 'production'

  const serverPath = path.join(process.cwd(), '.next', 'standalone', 'server.js')

  try {
    execSync(`node ${serverPath}`, { stdio: 'inherit', env: { ...process.env } })
  } catch (error) {
    console.error('[start-server] Failed to start production server')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[start-server] Error:', err)
  process.exit(1)
})
