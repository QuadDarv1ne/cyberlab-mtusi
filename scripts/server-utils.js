#!/usr/bin/env node
/**
 * Shared server utilities for dev and production servers.
 * Provides port detection and database type auto-detection.
 */

const net = require('net')
const fs = require('fs')
const path = require('path')

/**
 * Checks if a TCP port is available on localhost.
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true))
    })
    server.on('error', () => resolve(false))
  })
}

/**
 * Finds an available port starting from startPort, checking up to maxAttempts ports.
 */
async function findAvailablePort(startPort, maxAttempts = 10) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    const available = await isPortAvailable(port)
    if (available) return port
  }
  throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts - 1}`)
}

/**
 * Returns the preferred port from PORT env var or defaults to 3000.
 */
function detectPort() {
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10)
    if (!isNaN(parsed) && parsed > 0 && parsed < 65536) {
      return parsed
    }
  }
  return 3000
}

/**
 * Auto-detects database type from environment variables.
 * Priority: DB_TYPE env > DATABASE_URL pattern > MONGODB_URI > file existence > sqlite default
 */
function detectDbType() {
  if (process.env.DB_TYPE) {
    const validTypes = ['sqlite', 'postgresql', 'mongodb']
    if (validTypes.includes(process.env.DB_TYPE)) {
      return process.env.DB_TYPE
    }
    console.warn(`[server-utils] Invalid DB_TYPE "${process.env.DB_TYPE}", falling back to auto-detection`)
  }

  const databaseUrl = process.env.DATABASE_URL || ''

  if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
    return 'postgresql'
  }

  if (databaseUrl.startsWith('file:')) {
    return 'sqlite'
  }

  if (process.env.MONGODB_URI) {
    return 'mongodb'
  }

  try {
    const sqlitePath = path.join(process.cwd(), 'prisma', 'db', 'custom.db')
    if (fs.existsSync(sqlitePath)) {
      return 'sqlite'
    }
  } catch {
    // Ignore errors
  }

  return 'sqlite'
}

/**
 * Sets up DATABASE_URL and PRISMA_PROVIDER/MONGODB_URI based on detected type.
 */
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

module.exports = { isPortAvailable, findAvailablePort, detectPort, detectDbType, setupDatabaseEnv }
