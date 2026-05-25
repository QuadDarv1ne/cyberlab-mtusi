import { db } from '@/lib/db'

async function seed() {
  // Create students
  const student1 = await db.student.create({
    data: { name: 'Дуплей Максим Игоревич', group: '' }
  })
  const student2 = await db.student.create({
    data: { name: 'Думилин Вадим Владиславович', group: '' }
  })

  // Create labs
  const lab1 = await db.lab.create({
    data: {
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

  const lab2 = await db.lab.create({
    data: {
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

  const lab3 = await db.lab.create({
    data: {
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

  const lab4 = await db.lab.create({
    data: {
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

  const lab5 = await db.lab.create({
    data: {
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

  // Create progress records
  await db.labProgress.createMany({
    data: [
      { studentId: student1.id, labId: lab1.id, status: 'completed', flagsFound: 3, totalFlags: 3, score: 40, completedAt: new Date() },
      { studentId: student1.id, labId: lab2.id, status: 'completed', flagsFound: 3, totalFlags: 3, score: 50, completedAt: new Date() },
      { studentId: student1.id, labId: lab3.id, status: 'completed', flagsFound: 4, totalFlags: 4, score: 60, completedAt: new Date() },
      { studentId: student1.id, labId: lab4.id, status: 'completed', flagsFound: 3, totalFlags: 3, score: 40, completedAt: new Date() },
      { studentId: student1.id, labId: lab5.id, status: 'completed', flagsFound: 3, totalFlags: 3, score: 50, completedAt: new Date() },
      { studentId: student2.id, labId: lab1.id, status: 'completed', flagsFound: 3, totalFlags: 3, score: 40, completedAt: new Date() },
      { studentId: student2.id, labId: lab2.id, status: 'completed', flagsFound: 3, totalFlags: 3, score: 50, completedAt: new Date() },
      { studentId: student2.id, labId: lab4.id, status: 'in_progress', flagsFound: 1, totalFlags: 3, score: 10 },
    ]
  })

  console.log('Seed completed!')
}

seed().catch(console.error)
