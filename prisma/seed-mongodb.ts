/**
 * MongoDB seed script for CyberLab MTUSI.
 * Run with: npx tsx prisma/seed-mongodb.ts
 * Requires: Docker MongoDB running or external MongoDB
 */

import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyberlab'
const MONGODB_DB = process.env.MONGODB_DB || 'cyberlab'

async function seed() {
  console.log('Starting MongoDB seed...')
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db(MONGODB_DB)

    // Drop existing data for clean seed
    console.log('Clearing existing data...')
    await db.collection('students').deleteMany({})
    await db.collection('labs').deleteMany({})
    await db.collection('lab_flags').deleteMany({})
    await db.collection('lab_progress').deleteMany({})
    await db.collection('flag_submissions').deleteMany({})
    await db.collection('articles').deleteMany({})

    // Create indexes
    console.log('Creating indexes...')
    await db.collection('lab_progress').createIndex({ studentId: 1, labId: 1 }, { unique: true })
    await db.collection('flag_submissions').createIndex(
      { studentId: 1, labId: 1, flagKey: 1, correct: 1 },
      { unique: true, name: 'unique_correct_flag_per_student' }
    )
    await db.collection('flag_submissions').createIndex({ studentId: 1, correct: 1 })
    await db.collection('labs').createIndex({ number: 1 }, { unique: true })
    await db.collection('articles').createIndex({ slug: 1 }, { unique: true })

    // Insert students
    console.log('Seeding students...')
    const student1Id = new ObjectId()
    const student2Id = new ObjectId()
    await db.collection('students').insertMany([
      {
        _id: student1Id,
        name: 'Дуплей Максим Игоревич',
        group: 'УБВТ-24-04',
        createdAt: new Date(),
      },
      {
        _id: student2Id,
        name: 'Думилин Вадим Владиславович',
        group: 'УБВТ-24-04',
        createdAt: new Date(),
      },
    ])

    // Insert labs with flags
    console.log('Seeding labs and flags...')
    const labs = [
      {
        number: 1,
        title: 'OSINT и разведка',
        description: 'Сбор информации о целевой организации из открытых источников',
        goal: 'Научиться проводить разведку с использованием OSINT-методов и инструментов',
        tools: 'Maltego, theHarvester, Shodan',
        difficulty: 'easy',
        category: 'recon',
        order: 1,
        flags: [
          { flagKey: 'flag-1-email', flagValue: 'CYBER{found_email@company.ru}', points: 10, hint: 'Используйте theHarvester для поиска email' },
          { flagKey: 'flag-1-domain', flagValue: 'CYBER{company-domain.com}', points: 15, hint: 'Проверьте WHOIS данные' },
          { flagKey: 'flag-1-social', flagValue: 'CYBER{social_media_found}', points: 10, hint: 'Поиск по социальным сетям' },
        ],
      },
      {
        number: 2,
        title: 'Эксплуатация уязвимостей',
        description: 'Практическое использование Metasploit для эксплуатации',
        goal: 'Изучить принципы работы фреймворка Metasploit',
        tools: 'Metasploit, Nmap, Burp Suite',
        difficulty: 'medium',
        category: 'exploitation',
        order: 2,
        flags: [
          { flagKey: 'flag-2-smb', flagValue: 'CYBER{smb_exploit_success}', points: 20, hint: 'Используйте модуль smb_ms17_010' },
          { flagKey: 'flag-2-shell', flagValue: 'CYBER{reverse_shell_obtained}', points: 15, hint: 'Проверьте обратные подключения' },
          { flagKey: 'flag-2-hash', flagValue: 'CYBER{ntlm_hash_extracted}', points: 20, hint: 'Извлеките хеши из памяти' },
        ],
      },
      {
        number: 3,
        title: 'SQL-инъекции',
        description: 'Обнаружение и эксплуатация SQL-инъекций',
        goal: 'Научиться находить и эксплуатировать SQL-инъекции',
        tools: 'SQLmap, Burp Suite, MySQL',
        difficulty: 'medium',
        category: 'web',
        order: 3,
        flags: [
          { flagKey: 'flag-3-login', flagValue: 'CYBER{auth_bypassed_via_sqli}', points: 20, hint: "Попробуйте ' OR 1=1 --" },
          { flagKey: 'flag-3-db', flagValue: 'CYBER{database_name_found}', points: 15, hint: 'Используйте ORDER BY для определения колонок' },
          { flagKey: 'flag-3-users', flagValue: 'CYBER{users_table_dumped}', points: 20, hint: 'UNION SELECT для извлечения данных' },
        ],
      },
      {
        number: 4,
        title: 'Аудит веб-приложений',
        description: 'Комплексный аудит безопасности веб-приложений',
        goal: 'Провести полный аудит веб-приложения',
        tools: 'Burp Suite, OWASP ZAP, Nikto',
        difficulty: 'hard',
        category: 'web',
        order: 4,
        flags: [
          { flagKey: 'flag-4-xss', flagValue: 'CYBER{xss_payload_executed}', points: 15, hint: 'Проверьте поля ввода на XSS' },
          { flagKey: 'flag-4-upload', flagValue: 'CYBER{malicious_file_uploaded}', points: 20, hint: 'Обойдите фильтрацию загрузок' },
          { flagKey: 'flag-4-admin', flagValue: 'CYBER{admin_panel_access}', points: 20, hint: 'Ищите скрытые эндпоинты' },
          { flagKey: 'flag-4-config', flagValue: 'CYBER{config_file_exposed}', points: 15, hint: 'Проверьте backup файлы' },
        ],
      },
      {
        number: 5,
        title: 'ARP/DNS спуфинг',
        description: 'Атаки на протоколы ARP и DNS в локальной сети',
        goal: 'Изучить механизмы спуфинга в локальных сетях',
        tools: 'Ettercap, Bettercap, Wireshark',
        difficulty: 'hard',
        category: 'network',
        order: 5,
        flags: [
          { flagKey: 'flag-5-arp', flagValue: 'CYBER{arp_poisoning_success}', points: 20, hint: 'Используйте Ettercap для ARP спуфинга' },
          { flagKey: 'flag-5-dns', flagValue: 'CYBER{dns_spoof_captured}', points: 20, hint: 'Настройте DNS спуфинг' },
          { flagKey: 'flag-5-creds', flagValue: 'CYBER{credentials_intercepted}', points: 25, hint: 'Захватите учетные данные' },
        ],
      },
    ]

    const labIds: string[] = []
    for (const lab of labs) {
      const flags = lab.flags
      delete (lab as any).flags
      const result = await db.collection('labs').insertOne({
        ...lab,
        createdAt: new Date(),
      })
      labIds.push(result.insertedId.toString())

      const flagDocs = flags.map((f: any) => ({
        ...f,
        labId: result.insertedId.toString(),
      }))
      await db.collection('lab_flags').insertMany(flagDocs)
    }

    // Insert progress
    console.log('Seeding progress...')
    await db.collection('lab_progress').insertMany([
      { studentId: student1Id.toString(), labId: labIds[0], status: 'completed', flagsFound: 3, totalFlags: 3, score: 35, startedAt: new Date(), completedAt: new Date() },
      { studentId: student1Id.toString(), labId: labIds[1], status: 'completed', flagsFound: 3, totalFlags: 3, score: 55, startedAt: new Date(), completedAt: new Date() },
      { studentId: student1Id.toString(), labId: labIds[2], status: 'completed', flagsFound: 3, totalFlags: 3, score: 55, startedAt: new Date(), completedAt: new Date() },
      { studentId: student1Id.toString(), labId: labIds[3], status: 'completed', flagsFound: 4, totalFlags: 4, score: 70, startedAt: new Date(), completedAt: new Date() },
      { studentId: student1Id.toString(), labId: labIds[4], status: 'completed', flagsFound: 3, totalFlags: 3, score: 65, startedAt: new Date(), completedAt: new Date() },
      { studentId: student2Id.toString(), labId: labIds[0], status: 'completed', flagsFound: 3, totalFlags: 3, score: 35, startedAt: new Date(), completedAt: new Date() },
      { studentId: student2Id.toString(), labId: labIds[1], status: 'completed', flagsFound: 3, totalFlags: 3, score: 55, startedAt: new Date(), completedAt: new Date() },
      { studentId: student2Id.toString(), labId: labIds[3], status: 'in_progress', flagsFound: 1, totalFlags: 4, score: 15, startedAt: new Date() },
    ])

    // Insert articles
    console.log('Seeding articles...')
    await db.collection('articles').insertMany([
      {
        slug: 'osint-basics',
        title: 'Основы OSINT: Разведка из открытых источников',
        excerpt: 'Введение в методы сбора информации из открытых источников',
        content: 'OSINT (Open Source Intelligence) — это сбор и анализ информации из открытых источников...',
        author: 'Дуплей М.И.',
        category: 'Кибербезопасность',
        tags: '["osint", "разведка"]',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        slug: 'sql-injection-guide',
        title: 'SQL-инъекции: Полное руководство',
        excerpt: 'Подробный обзор типов SQL-инъекций и методов защиты',
        content: 'SQL-инъекция — это один из самых распространенных векторов атак...',
        author: 'Дуплей М.И.',
        category: 'Учебные материалы',
        tags: '["sqli", "web"]',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        slug: 'metasploit-tutorial',
        title: 'Metasploit: Учебное пособие',
        excerpt: 'Практическое руководство по использованию фреймворка Metasploit',
        content: 'Metasploit — это самый популярный фреймворк для тестирования на проникновение...',
        author: 'Дуплей М.И.',
        category: 'Учебные материалы',
        tags: '["metasploit", "exploitation"]',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        slug: 'arp-dns-spoofing',
        title: 'ARP и DNS спуфинг: Теория и практика',
        excerpt: 'Как работают атаки на протоколы локальной сети',
        content: 'ARP спуфинг позволяет атакующему перехватывать трафик в локальной сети...',
        author: 'Дуплей М.И.',
        category: 'Кибербезопасность',
        tags: '["arp", "dns", "network"]',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        slug: 'cyber-tools-overview',
        title: 'Обзор инструментов кибербезопасности',
        excerpt: 'Топ-10 инструментов для начинающего пентестера',
        content: 'В этой статье мы рассмотрим самые популярные инструменты...',
        author: 'Дуплей М.И.',
        category: 'Новости и обзоры',
        tags: '["tools", "pentest"]',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        slug: 'ctf-strategy',
        title: 'Стратегия победы в CTF-соревнованиях',
        excerpt: 'Как подготовиться и выиграть CTF-соревнование',
        content: 'CTF (Capture The Flag) — это соревнования по информационной безопасности...',
        author: 'Дуплей М.И.',
        category: 'Учебные материалы',
        tags: '["ctf", "strategy"]',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    console.log('MongoDB seed completed successfully!')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

seed()
