import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

/**
 * Health check endpoint for Docker, load balancers, and monitoring.
 * Returns database connectivity status and uptime.
 * No authentication required — safe for automated health checks.
 */
export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'unknown',
  }

  try {
    // Quick connectivity check — fetch a single row from a lightweight table
    const labs = await db.labFindMany({ orderBy: { order: 'asc' } })
    health.database = db.type
    health.status = labs.length >= 0 ? 'ok' : 'ok' // even 0 labs is healthy
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[health] Database check failed:', message)
    health.database = 'disconnected'
    health.status = 'degraded'
  }

  const statusCode = health.status === 'ok' ? 200 : 503
  return NextResponse.json(health, { status: statusCode })
}
