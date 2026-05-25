import * as net from 'net'

/**
 * Checks if a port is available by attempting to bind to it.
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true))
    })
    server.on('error', () => resolve(false))
  })
}

/**
 * Finds the next available port starting from startPort.
 * @param startPort - The port to start scanning from
 * @param maxAttempts - Maximum number of ports to try (default: 10)
 */
export async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    const available = await isPortAvailable(port)
    if (available) return port
  }
  return startPort // fallback to original
}

/**
 * Detects the preferred port from environment variables or defaults.
 */
export function detectPort(): number {
  // 1. Explicit PORT env var
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10)
    if (!isNaN(parsed) && parsed > 0 && parsed < 65536) {
      return parsed
    }
  }

  // 2. Default to 3000
  return 3000
}
