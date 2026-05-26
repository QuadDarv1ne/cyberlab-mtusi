import { DbType } from './adapters/base'

/**
 * Auto-detects the optimal database type from environment variables.
 * Priority: DB_TYPE env > DATABASE_URL pattern > MONGODB_URI > file existence > sqlite default
 */
export function detectDatabaseType(): DbType {
  // 1. Explicit override takes highest priority
  if (process.env.DB_TYPE) {
    const validTypes: DbType[] = ['sqlite', 'postgresql', 'mongodb']
    if (validTypes.includes(process.env.DB_TYPE as DbType)) {
      return process.env.DB_TYPE as DbType
    }
    console.warn(`[config] Invalid DB_TYPE "${process.env.DB_TYPE}", falling back to auto-detection`)
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

  // 4. Fallback: check if SQLite file exists (backwards compatible)
  try {
    // Use dynamic import to avoid TypeScript require errors in ESM/strict mode
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const requireFunc = typeof require !== 'undefined'
      ? require
      : new Function('specifier', 'return require(specifier)') as NodeRequire
    const fs = requireFunc('fs')
    const path = requireFunc('path')
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

/**
 * Returns the appropriate database URL based on detected database type.
 */
export function getDatabaseUrl(): string {
  const dbType = detectDatabaseType()

  switch (dbType) {
    case 'postgresql':
      return process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cyberlab?schema=public'
    case 'mongodb':
      return process.env.MONGODB_URI || 'mongodb://localhost:27017/cyberlab'
    case 'sqlite':
    default:
      return process.env.DATABASE_URL || 'file:./db/custom.db'
  }
}
