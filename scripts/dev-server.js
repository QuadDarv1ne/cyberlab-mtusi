#!/usr/bin/env node
/**
 * Development server with auto port detection.
 * Finds an available port and starts Next.js dev server.
 */

const { findAvailablePort, detectPort } = require('../src/lib/port-detector')
const { execSync } = require('child_process')

async function main() {
  const preferredPort = detectPort()
  const port = await findAvailablePort(preferredPort)

  console.log(`[dev-server] Database: ${process.env.DB_TYPE || 'auto-detected'}`)
  console.log(`[dev-server] Starting Next.js dev server on port ${port}`)

  if (port !== preferredPort) {
    console.warn(`[dev-server] Warning: Port ${preferredPort} was busy, using ${port} instead`)
  }

  // Set PORT for Next.js
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
