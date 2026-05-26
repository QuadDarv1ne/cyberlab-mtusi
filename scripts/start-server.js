#!/usr/bin/env node
/**
 * Production server with auto port detection.
 * Finds an available port and starts the standalone Next.js server.
 */

const { execSync } = require('child_process')
const path = require('path')
const { findAvailablePort, detectPort, detectDbType, setupDatabaseEnv } = require('./server-utils')

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
