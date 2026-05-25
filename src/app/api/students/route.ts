import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const students = await db.student.findMany({
    select: {
      id: true,
      name: true,
      group: true,
      progress: { include: { lab: { select: { id: true } } } }
    },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json(students)
}
