# CyberLab v2 — Платформа лабораторных работ по кибербезопасности

Образовательная платформа МТУСИ (кафедра ИБ) для проведения лабораторных работ по дисциплине
«Защита информации от вредоносного ПО».

## Что нового в v2

- **Фильтры в каталоге**: фильтрация по категориям и сложности
- **Поиск по каталогу**: мгновенный поиск по названию и описанию
- **Вкладка «О проекте»**: информация о разработчике, университете, технологиях
- **Графики на дашборде**: BarChart баллов по ЛР и PieChart статуса выполнения (recharts)
- **Лента последних отправок**: 10 последних попыток отправки флагов
- **Анимации**: плавные переходы между вкладками, анимация появления карточек
- **Тёмная тема**: сохранение в localStorage
- **Пустые состояния**: информативные сообщения при отсутствии данных
- **Улучшенный футер**: разработчик Дуплей Максим Игоревич

## Содержание проекта

| Раздел | Описание |
|--------|----------|
| Главная | Герой-баннер, анимированная статистика, избранные ЛР |
| Каталог ЛР | 5 ЛР с фильтрами, поиском, CTF-флагами и подсказками |
| Детали ЛР | Цель, описание, задания с флагами, боковая панель прогресса |
| Дашборд | Графики recharts, рейтинг, таблица прогресса, лента отправок |
| Инструменты | Справочник 10 инструментов кибербезопасности |
| О проекте | Информация о разработчике и технологическом стеке |

## Лабораторные работы

1. **ЛР1 — Сбор информации в компьютерных сетях** (OSINT, Spiderfoot, Maltego, Nmap)
2. **ЛР2 — Тестирование компьютерной сети на проникновение** (Metasploit, Exploit-DB)
3. **ЛР3 — Защита баз данных от атак методом внедрения SQL-кода** (SQL-инъекции)
4. **ЛР4 — Проведение аудита веб-ресурсов** (OWASP ZAP, Probely)
5. **ЛР5 — ARP-spoofing и DNS-spoofing** (Bettercap, VMware, OpenWRT)

## Технологический стек

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js API Routes (App Router)
- **База данных**: SQLite через Prisma ORM
- **Визуализация**: Recharts (BarChart, PieChart)
- **UI-компоненты**: lucide-react (иконки), framer-motion, sonner

## Структура проекта

```
├── .env                          # DATABASE_URL для SQLite
├── package.json                  # Зависимости и скрипты
├── next.config.ts                # Конфигурация Next.js
├── tailwind.config.ts            # Конфигурация Tailwind CSS
├── tsconfig.json                 # Конфигурация TypeScript
├── components.json               # Конфигурация shadcn/ui
├── Caddyfile                     # Конфигурация Caddy reverse proxy
├── prisma/
│   ├── schema.prisma             # Схема БД (Student, Lab, LabFlag, LabProgress, FlagSubmission)
│   └── seed.ts                   # Начальные данные (5 ЛР, 2 студента, 16 флагов)
├── db/
│   └── custom.db                 # Файл базы данных SQLite
├── public/
│   ├── logo.svg
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Корневой layout (шрифты, метаданные)
│   │   ├── page.tsx              # Главная страница (SPA с 6 вкладками)
│   │   ├── globals.css           # Глобальные стили (CSS-переменные, тёмная тема)
│   │   └── api/
│   │       ├── labs/route.ts     # GET /api/labs — список лабораторных
│   │       ├── students/route.ts # GET /api/students — список студентов
│   │       ├── flags/route.ts    # POST /api/flags — проверка и отправка флага
│   │       ├── dashboard/route.ts# GET /api/dashboard — статистика дашборда
│   │       └── progress/route.ts # GET /api/progress — прогресс студента
│   ├── components/ui/            # shadcn/ui компоненты (50+ шт.)
│   ├── hooks/
│   │   ├── use-toast.ts          # Toast-уведомления
│   │   └── use-mobile.ts         # Определение мобильных устройств
│   └── lib/
│       ├── db.ts                 # Prisma Client (singleton)
│       └── utils.ts              # Утилиты (cn)
```

## Установка и запуск

### Предварительные требования

- Node.js 18+ или Bun
- npm / bun / yarn

### Шаги

```bash
# 1. Распаковать архив
unzip CyberLab-project-v2.zip -d cyberlab
cd cyberlab

# 2. Установить зависимости
npm install
# или
bun install

# 3. Настроить базу данных
npx prisma generate
npx prisma db push

# 4. Заполнить начальными данными
npx prisma db seed
# или вручную:
# npx tsx prisma/seed.ts

# 5. Запустить в режиме разработки
npm run dev
# или
bun dev

# 6. Открыть в браузере
# http://localhost:3000
```

### Сборка для продакшена

```bash
npm run build
npm run start
```

## Система CTF-флагов

- Формат флагов: `CYBER{...}`
- Каждый флаг имеет свою стоимость в баллах (10–20)
- Доступны подсказки для каждого флага
- Прогресс сохраняется в базе данных
- Поддерживается несколько студентов с отдельным прогрессом

## Флаги (спойлеры!)

<details>
<summary>Показать ответы</summary>

| ЛР | Ключ флага | Значение | Баллы |
|----|-----------|----------|-------|
| 1 | subdomain | CYBER{sp1d3rf00t_0s1nt} | 15 |
| 1 | open_port | CYBER{nmap_p0rt_sc4n} | 10 |
| 1 | graph | CYBER{malt3g0_gr4ph} | 15 |
| 2 | port_scan | CYBER{nmap_r3c0nn} | 10 |
| 2 | exploit | CYBER{m3t4spl01t_r00t} | 20 |
| 2 | session | CYBER{s3ss10n_3st4bl1sh3d} | 20 |
| 3 | bypass_login | CYBER{sql_byp4ss_l0g1n} | 10 |
| 3 | user_data | CYBER{sql_us3r_d4t4} | 15 |
| 3 | admin_pass | CYBER{sql_4dm1n_p4ss} | 20 |
| 3 | new_admin | CYBER{sql_n3w_4dm1n} | 15 |
| 4 | pii_leak | CYBER{z4p_p11_l34k} | 15 |
| 4 | js_vuln | CYBER{0ld_js_l1b} | 15 |
| 4 | sql_inject | CYBER{w3b_sql1} | 10 |
| 5 | arp_spoof | CYBER{4rp_sp00f1ng} | 15 |
| 5 | sniff_creds | CYBER{sn1ff_cr3ds} | 20 |
| 5 | dns_spoof | CYBER{dns_sp00f1ng} | 15 |

</details>

## Разработчик

**Дуплей Максим Игоревич**, МТУСИ

## Студенты

- Дуплей Максим Игоревич
- Думилин Вадим Владиславович
