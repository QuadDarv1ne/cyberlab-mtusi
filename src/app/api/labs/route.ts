import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const labs = await db.lab.findMany({
      include: { flags: { select: { id: true, flagKey: true, points: true, hint: true } } },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(labs)
  } catch (error) {
    console.error('[API /labs] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
