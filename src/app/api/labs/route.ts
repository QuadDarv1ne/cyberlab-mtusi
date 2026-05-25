import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const labs = await db.lab.findMany({
    include: { flags: { select: { id: true, flagKey: true, points: true, hint: true } } },
    orderBy: { order: 'asc' }
  })
  // Never send flagValue to the client!
  return NextResponse.json(labs)
}
