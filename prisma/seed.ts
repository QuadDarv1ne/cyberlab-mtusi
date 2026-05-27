import { db } from '@/lib/db'
import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function seed() {
  // Use raw Prisma client for seed operations (upsert, nested creates, etc.)
  const prisma = db.rawClient as PrismaClient

  // Create passwords
  const studentPassword = await bcrypt.hash('Student2024!', 12)
  const adminPassword = await bcrypt.hash('Admin2024!', 12)

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@mtusi.local' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@mtusi.local',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create students with linked users (idempotent)
  const student1 = await prisma.student.upsert({
    where: { id: 'seed-student-1' },
    update: {},
    create: { id: 'seed-student-1', name: 'Дуплей Максим Игоревич', group: 'УБВТ-24-04' },
  })
  await prisma.user.upsert({
    where: { email: 'dupley.maksim@mtusi.local' },
    update: {},
    create: {
      name: student1.name,
      email: 'dupley.maksim@mtusi.local',
      passwordHash: studentPassword,
      role: 'STUDENT',
      studentId: student1.id,
    },
  })

  const student2 = await prisma.student.upsert({
    where: { id: 'seed-student-2' },
    update: {},
    create: { id: 'seed-student-2', name: 'Думилин Вадим Владиславович', group: 'УБВТ-24-04' },
  })
  await prisma.user.upsert({
    where: { email: 'dumilin.vadim@mtusi.local' },
    update: {},
    create: {
      name: student2.name,
      email: 'dumilin.vadim@mtusi.local',
      passwordHash: studentPassword,
      role: 'STUDENT',
      studentId: student2.id,
    },
  })

  // Create labs (idempotent)
  const lab1 = await prisma.lab.upsert({
    where: { number: 1 },
    update: {},
    create: {
      number: 1,
      title: 'Сбор информации в компьютерных сетях',
      description: 'Исследование действий по сбору информации о целевой системе для проведения тестирования на проникновение. Получение навыков по работе с программным обеспечением для сбора информации (OSINT).',
      goal: 'Овладеть навыками сбора информации о доменах, поддоменах, IP-адресах и открытых портах целевой системы с использованием инструментов OSINT.',
      tools: 'Spiderfoot, Maltego Graph, Nmap/Zenmap, Docker',
      difficulty: 'easy',
      category: 'reconnaissance',
      order: 1,
      flags: {
        create: [
          { flagKey: 'subdomain', flagValue: 'CYBER{sp1d3rf00t_0s1nt}', points: 15, hint: 'Используйте Spiderfoot для сканирования домена mtuci.ru' },
          { flagKey: 'open_port', flagValue: 'CYBER{nmap_p0rt_sc4n}', points: 10, hint: 'Запустите Zenmap с профилем Intense scan' },
          { flagKey: 'graph', flagValue: 'CYBER{malt3g0_gr4ph}', points: 15, hint: 'Постройте граф связей в Maltego' },
        ]
      }
    }
  })

  const lab2 = await prisma.lab.upsert({
    where: { number: 2 },
    update: {},
    create: {
      number: 2,
      title: 'Тестирование компьютерной сети на проникновение',
      description: 'Изучение эксплуатирования уязвимостей в удалённой системе с помощью программного обеспечения Metasploit, а также демонстрация того, как найденная уязвимость может быть эксплуатирована злоумышленником.',
      goal: 'Научиться использовать Metasploit Framework для поиска и эксплуатации уязвимостей, получить практический доступ к удалённой системе.',
      tools: 'Metasploit Framework, Nmap, Docker (DVWA), Exploit-DB',
      difficulty: 'medium',
      category: 'exploitation',
      order: 2,
      flags: {
        create: [
          { flagKey: 'port_scan', flagValue: 'CYBER{nmap_r3c0nn}', points: 10, hint: 'Сканируйте цель с помощью Nmap для поиска открытых портов' },
          { flagKey: 'exploit', flagValue: 'CYBER{m3t4spl01t_r00t}', points: 20, hint: 'Найдите подходящий эксплоит в Metasploit' },
          { flagKey: 'session', flagValue: 'CYBER{s3ss10n_3st4bl1sh3d}', points: 20, hint: 'Установите сессию с целевой машиной' },
        ]
      }
    }
  })

  const lab3 = await prisma.lab.upsert({
    where: { number: 3 },
    update: {},
    create: {
      number: 3,
      title: 'Защита баз данных от атак методом внедрения SQL-кода',
      description: 'Изучение основных способов проведения атак на базы данных методом внедрения SQL-кода, а также способов их предотвращения.',
      goal: 'Освоить методы SQL-инъекций (UNION, UPDATE, blind) и научиться защищать приложения от данного типа атак.',
      tools: 'Специализированная веб-форма, MySQL, ручное составление SQL-запросов',
      difficulty: 'medium',
      category: 'web_security',
      order: 3,
      flags: {
        create: [
          { flagKey: 'bypass_login', flagValue: 'CYBER{sql_byp4ss_l0g1n}', points: 10, hint: 'Используйте OR 1=1 для обхода аутентификации' },
          { flagKey: 'user_data', flagValue: 'CYBER{sql_us3r_d4t4}', points: 15, hint: 'Извлеките данные пользователя через UPDATE + SELECT' },
          { flagKey: 'admin_pass', flagValue: 'CYBER{sql_4dm1n_p4ss}', points: 20, hint: 'Получите пароль администратора через GROUP_CONCAT' },
          { flagKey: 'new_admin', flagValue: 'CYBER{sql_n3w_4dm1n}', points: 15, hint: 'Создайте нового пользователя с ролью admin' },
        ]
      }
    }
  })

  const lab4 = await prisma.lab.upsert({
    where: { number: 4 },
    update: {},
    create: {
      number: 4,
      title: 'Проведение аудита веб-ресурсов',
      description: 'Приобретение навыков поиска уязвимостей в веб-ресурсах путём выявления структуры ресурса, сканирования на уязвимости и выявления ошибок в логике работы.',
      goal: 'Научиться проводить аудит безопасности веб-приложений с использованием автоматизированных сканеров и ручного тестирования.',
      tools: 'OWASP ZAP, Spiderfoot, Probely, браузер (DevTools)',
      difficulty: 'medium',
      category: 'web_security',
      order: 4,
      flags: {
        create: [
          { flagKey: 'pii_leak', flagValue: 'CYBER{z4p_p11_l34k}', points: 15, hint: 'Запустите автоматическое сканирование в ZAP' },
          { flagKey: 'js_vuln', flagValue: 'CYBER{0ld_js_l1b}', points: 15, hint: 'Проверьте версию JS-библиотеки в DevTools' },
          { flagKey: 'sql_inject', flagValue: 'CYBER{w3b_sql1}', points: 10, hint: 'Попробуйте SQL-инъекцию в URL-параметре' },
        ]
      }
    }
  })

  const lab5 = await prisma.lab.upsert({
    where: { number: 5 },
    update: {},
    create: {
      number: 5,
      title: 'ARP-spoofing и DNS-spoofing',
      description: 'Получение практических навыков реализации атак типа ARP-spoofing, DNS-spoofing и HSTS-spoofing, а также методов обнаружения и предотвращения данных типов атак.',
      goal: 'Освоить проведение ARP и DNS спуфинг-атак, а также методы защиты от них, используя виртуальную сетевую среду.',
      tools: 'VMware Workstation Pro, Bettercap, OpenWRT, Wireshark',
      difficulty: 'hard',
      category: 'network_attacks',
      order: 5,
      flags: {
        create: [
          { flagKey: 'arp_spoof', flagValue: 'CYBER{4rp_sp00f1ng}', points: 15, hint: 'Запустите ARP-spoofing через bettercap' },
          { flagKey: 'sniff_creds', flagValue: 'CYBER{sn1ff_cr3ds}', points: 20, hint: 'Перехватите HTTP-трафик с логином и паролем' },
          { flagKey: 'dns_spoof', flagValue: 'CYBER{dns_sp00f1ng}', points: 15, hint: 'Настройте DNS-spoofing для поддоменов yandex.ru' },
        ]
      }
    }
  })

  // Create progress records (skip if already exists via unique constraint)
  const progressData = [
    { studentId: student1.id, labId: lab1.id, status: 'completed', flagsFound: 3, totalFlags: 3, score: 40, completedAt: new Date() },
    { studentId: student1.id, labId: lab2.id, status: 'completed', flagsFound: 3, totalFlags: 3, score: 50, completedAt: new Date() },
    { studentId: student1.id, labId: lab3.id, status: 'completed', flagsFound: 4, totalFlags: 4, score: 60, completedAt: new Date() },
    { studentId: student1.id, labId: lab4.id, status: 'completed', flagsFound: 3, totalFlags: 3, score: 40, completedAt: new Date() },
    { studentId: student1.id, labId: lab5.id, status: 'completed', flagsFound: 3, totalFlags: 3, score: 50, completedAt: new Date() },
    { studentId: student2.id, labId: lab1.id, status: 'completed', flagsFound: 3, totalFlags: 3, score: 40, completedAt: new Date() },
    { studentId: student2.id, labId: lab2.id, status: 'completed', flagsFound: 3, totalFlags: 3, score: 50, completedAt: new Date() },
    { studentId: student2.id, labId: lab4.id, status: 'in_progress', flagsFound: 1, totalFlags: 3, score: 10 },
  ]
  for (const data of progressData) {
    await prisma.labProgress.upsert({
      where: { studentId_labId: { studentId: data.studentId, labId: data.labId } },
      update: {},
      create: data,
    })
  }

  // Seed articles
  const articles = [
    {
      slug: 'osint-introduction',
      title: 'Введение в OSINT: сбор информации из открытых источников',
      excerpt: 'Разбираем основные методы и инструменты OSINT для сбора информации о целевой системе: от Google Dorking до Spiderfoot и Maltego.',
      content: `OSINT (Open Source Intelligence) — это разведка на основе данных из открытых источников. В контексте кибербезопасности OSINT используется для сбора информации о целевой системе перед проведением тестирования на проникновение.\n\nОсновные методы OSINT:\n\nGoogle Dorking — использование расширенных операторов поиска Google для нахождения чувствительной информации. Например, site:example.com находит все проиндексированные страницы, а filetype:pdf ищет документы.\n\nSpiderfoot — автоматизированный инструмент для сбора информации о доменах, IP-адресах и email. Поддерживает более 200 модулей для различных источников данных.\n\nMaltego — визуализация связей между сущностями: доменами, IP, email-адресами, телефонами. Позволяет построить граф связей и обнаружить скрытые зависимости.\n\nShodan — поисковая система для устройств, подключённых к интернету. Позволяет находить открытые порты, сервисы и уязвимости.\n\nПрактические рекомендации:\n— Всегда документируйте результаты разведки\n— Используйте несколько источников для перекрёстной проверки\n— Помните о юридических ограничениях сбора информации\n— Автоматизируйте повторяющиеся задачи`,
      author: 'CyberLab MTUSI',
      category: 'Учебные материалы',
      tags: '["OSINT","разведка","Spiderfoot","Maltego"]',
    },
    {
      slug: 'sql-injection-basics',
      title: 'SQL-инъекции: основы и методы защиты',
      excerpt: 'Подробный разбор типов SQL-инъекций, примеров эксплуатации и современных подходов к защите веб-приложений.',
      content: `SQL-инъекция — один из самых распространённых и опасных типов атак на веб-приложения. Атакующий внедряет произвольный SQL-код в запросы приложения, что может привести к чтению, изменению или удалению данных.\n\nТипы SQL-инъекций:\n\nUnion-based — использование оператора UNION для объединения результатов нескольких SELECT-запросов. Позволяет извлечь данные из других таблиц.\n\nBoolean-based blind — определение истинности условий по различиям в ответе приложения. Медленный, но универсальный метод.\n\nTime-based blind — использование задержек (SLEEP, WAITFOR) для определения истинности условий. Применяется, когда приложение не возвращает различий в ответе.\n\nError-based — извлечение информации из сообщений об ошибках базы данных.\n\nМетоды защиты:\n\nПараметризованные запросы — самый надёжный способ. Значения подставляются через параметры, а не конкатенацию строк.\n\nORM — использование фреймворков (Prisma, Sequelize), которые автоматически параметризуют запросы.\n\nВалидация входных данных — строгая проверка всех пользовательских данных.\n\nПринцип наименьших привилегий — ограничение прав учётной записи БД.\n\nПодготовленные выражения — предварительная компиляция запроса без значений.`,
      author: 'CyberLab MTUSI',
      category: 'Учебные материалы',
      tags: '["SQL","веб-безопасность","инъекции","защита"]',
    },
    {
      slug: 'metasploit-framework-guide',
      title: 'Metasploit Framework: практическое руководство',
      excerpt: 'Как использовать Metasploit для поиска и эксплуатации уязвимостей. Разбираем основные модули и типичный workflow пентестера.',
      content: `Metasploit Framework — открытая платформа для разработки и запуска эксплоитов. Один из основных инструментов пентестера.\n\nОсновные компоненты:\n\nmsfconsole — основной интерфейс для работы с фреймворком.\nmsfvenom — генератор полезной нагрузки (payloads).\nmsfdb — управление базой данных.\n\nТипичный workflow:\n\nРазведка — сканирование портов с помощью Nmap, определение сервисов и версий.\nПоиск эксплоита — search в msfconsole или поиск на Exploit-DB.\nНастройка — установка RHOSTS, RPORT, LHOST, выбор payload.\nЗапуск — exploit или run. Ожидание сессии.\nПостэксплуатация — сбор данных, повышение привилегий, lateral movement.\n\nОсновные модули:\nexploit — код, использующий уязвимость.\npayload — код, выполняемый на целевой системе.\nauxiliary — вспомогательные модули (сканеры, фурри и т.д.).\nencoder — обход антивирусных систем.\n\nВажно: используйте Metasploit только в рамках авторизованного тестирования.`,
      author: 'CyberLab MTUSI',
      category: 'Кибербезопасность',
      tags: '["Metasploit","pentest","эксплуатация","уязвимости"]',
    },
    {
      slug: 'arp-dns-spoofing',
      title: 'ARP и DNS спуфинг: как работают атаки и как от них защититься',
      content: `ARP-spoofing и DNS-spoofing — два распространённых метода атак на уровне сети, позволяющих злоумышленнику перехватывать и модифицировать трафик.\n\nARP-spoofing:\nПротокол ARP не имеет аутентификации. Атакующий отправляет фальшивые ARP-пакеты, связывая свой MAC-адрес с IP-адресом целевого узла. Весь трафик идёт через машину атакующего.\n\nИнструменты: Bettercap, Ettercap, arpspoof.\n\nDNS-spoofing:\nАтакующий подменяет ответы DNS-сервера, перенаправляя жертву на подконтрольный сервер. Может использоваться для фишинга, распространения malware.\n\nИнструменты: Bettercap (dns-spoof), dnsspoof.\n\nМетоды защиты:\n— Статические ARP-записи (для критичных узлов)\n— DHCP snooping + Dynamic ARP Inspection на коммутаторах\n— DNSSEC для защиты DNS-запросов\n— HTTPS и HSTS для защиты от подмены контента\n— Мониторинг сетевой аномалии (IDS/IPS)`,
      excerpt: 'Разбираем механизмы ARP и DNS спуфинга, инструменты для проведения атак (Bettercap) и методы защиты на уровне сети.',
      author: 'CyberLab MTUSI',
      category: 'Сетевые атаки',
      tags: '["ARP","DNS","Bettercap","сетевые атаки"]',
    },
    {
      slug: 'top-security-tools-2024',
      title: 'Топ-10 инструментов кибербезопасности в 2024 году',
      excerpt: 'Обзор наиболее востребованных инструментов для пентеста, анализа уязвимостей и мониторинга безопасности.',
      content: `Подборка наиболее полезных инструментов для специалистов по кибербезопасности:\n\n1. Nmap — сканер сетей и портов. Незаменим для разведки.\n2. Metasploit Framework — платформа для эксплуатации уязвимостей.\n3. Burp Suite — комплексный инструмент для тестирования веб-приложений.\n4. Wireshark — анализатор сетевого трафика.\n5. OWASP ZAP — открытый сканер безопасности веб-приложений.\n6. Bettercap — фреймворк для сетевых атак (ARP, DNS, WiFi).\n7. John the Ripper — взломщик паролей.\n8. SQLmap — автоматизация SQL-инъекций.\n9. Ghidra — дизассемблер и инструмент реверс-инжиниринга от NSA.\n10. Splunk — платформа для мониторинга и анализа логов безопасности.\n\nКаждый инструмент решает свой класс задач. Рекомендуется изучить хотя бы базовое использование каждого.`,
      author: 'CyberLab MTUSI',
      category: 'Новости и обзоры',
      tags: '["инструменты","обзор","pentest","Nmap","Burp Suite"]',
    },
    {
      slug: 'ctf-strategy-guide',
      title: 'Стратегия прохождения CTF-соревнований',
      excerpt: 'Как эффективно подходить к решению CTF-задач: от выбора категории до работы в команде и распределения времени.',
      content: `CTF (Capture The Flag) — соревнования по кибербезопасности, где участники решают задачи и находят «флаги» — секретные строки.\n\nОсновные категории:\n\nWeb — уязвимости веб-приложений: XSS, SQLi, SSRF, RCE.\nCrypto — криптография: шифры, хеши, RSA, эллиптические кривые.\nReverse — реверс-инжиниринг бинарных файлов.\nPwn — эксплуатация бинарных уязвимостей: buffer overflow, format string.\nForensics — анализ образов дисков, сетевого трафика, файлов.\nMisc — всё остальное: OSINT, стеганография, логические задачи.\n\nСтратегия:\n— Начните с простых задач (100-200 баллов)\n— Распределяйте задачи между членами команды по специализации\n— Не застревайте на одной задаче — переключайтесь\n— Документируйте ход решения\n— Используйте writeup'и после соревнования для обучения\n\nПолезные платформы: HackTheBox, TryHackMe, PicoCTF, CTFtime.`,
      author: 'CyberLab MTUSI',
      category: 'Кибербезопасность',
      tags: '["CTF","стратегия","соревнования","обучение"]',
    },
  ]

  for (const article of articles) {
    const existing = await prisma.article.findUnique({ where: { slug: article.slug } })
    if (!existing) {
      await prisma.article.create({ data: article })
    }
  }

  console.log('Seed completed!')
}

seed().catch(e => { console.error(e); process.exit(1) })
