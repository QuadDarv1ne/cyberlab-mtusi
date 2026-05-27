import type { DatabaseAdapter } from './db/adapters/base'
import { PrismaAdapter } from './db/adapters/prisma-adapter'
import { MongoAdapter } from './db/adapters/mongodb-adapter'
import { detectDatabaseType } from './db/config'
import { logger } from './logger'

const globalForDb = globalThis as unknown as {
  adapter: DatabaseAdapter | undefined
}

let adapter: DatabaseAdapter

if (globalForDb.adapter) {
  adapter = globalForDb.adapter
} else {
  const dbType = detectDatabaseType()

  switch (dbType) {
    case 'mongodb':
      adapter = new MongoAdapter()
      break
    case 'postgresql':
      adapter = new PrismaAdapter('postgresql')
      break
    case 'sqlite':
    default:
      adapter = new PrismaAdapter('sqlite')
      break
  }

  // Auto-connect on first access
  adapter.connect().catch((err) => {
    logger.error(`[db] Failed to connect to ${dbType}:`, err.message)
  })

  globalForDb.adapter = adapter
}

// Re-export as `db` for backwards compatibility with all API routes
export const db = adapter
export { adapter }
