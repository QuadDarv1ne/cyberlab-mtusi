import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const labs = await db.lab.findMany({
      include: { flags: { select: { id: true, flagKey: true, points: true, hint: true } } },
      orderBy: { order: 'asc' }
    })
    const response = NextResponse.json(labs)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('[API /labs] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
