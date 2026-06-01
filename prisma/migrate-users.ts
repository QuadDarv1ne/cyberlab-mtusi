import { db } from '@/lib/db'
import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function migrateUsers() {
  const prisma = db.rawClient as PrismaClient

  const students = await prisma.student.findMany()
  let created = 0

  for (const student of students) {
    const existing = await prisma.user.findFirst({
      where: { studentId: student.id }
    })
    if (existing) continue

    const parts = student.name.split(' ')
    const firstName = parts[0]?.toLowerCase() || 'student'
    const lastName = (parts[1]?.toLowerCase()) || ''
    const email = `${firstName}.${lastName}@mtusi.local`

    const passwordHash = await bcrypt.hash('Student2024!', 12)

    await prisma.user.create({
      data: {
        name: student.name,
        email,
        passwordHash,
        role: 'STUDENT',
        studentId: student.id,
      }
    })
    created++
    console.log(`  Created user for: ${student.name} (${email})`)
  }

  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@mtusi.local' }
  })
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('Admin2024!', 12)
    await prisma.user.create({
      data: {
        name: 'Administrator',
        email: 'admin@mtusi.local',
        passwordHash,
        role: 'ADMIN',
      }
    })
    created++
    console.log('  Created admin user (admin@mtusi.local)')
  }

  console.log(`Migration complete! Created ${created} user(s).`)
}

migrateUsers().catch(e => { console.error(e); process.exit(1) })
