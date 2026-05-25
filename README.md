<div align="center">

# CyberLab v2

### CyberLab-mtusi — образовательная платформа МТУСИ

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-black)](https://ui.shadcn.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.11-2d3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENCE)

---

**Разработчик:** Дуплей Максим Игоревич

**Интеллектуальная собственность:** Дуплей Максим Игоревич

**МТУСИ**, кафедра ИБ

</div>

---

## Языковые версии

- [Русская версия](README_RU.md)
- [English version](README_EN.md)

---

## О проекте

**CyberLab v2** — образовательная платформа МТУСИ (кафедра информационной безопасности) для проведения лабораторных работ по дисциплине «Защита информации от вредоносного ПО». Платформа объединяет каталог лабораторных работ, систему CTF-флагов, дашборд с графиками прогресса, справочник инструментов кибербезопасности и систему отслеживания попыток студентов.

Платформа поддерживает 5 лабораторных работ: OSINT и сбор информации, тестирование на проникновение, защита баз данных от SQL-инъекций, аудит веб-ресурсов, ARP/DNS-spoofing.

## Что нового в v2

- **Фильтры в каталоге** — фильтрация по категориям и сложности
- **Поиск по каталогу** — мгновенный поиск по названию и описанию
- **Вкладка «О проекте»** — информация о разработчике, университете, технологиях
- **Графики на дашборде** — BarChart баллов по ЛР и PieChart статуса выполнения (recharts)
- **Лента последних отправок** — 10 последних попыток отправки флагов
- **Анимации** — плавные переходы между вкладками, анимация появления карточек
- **Тёмная тема** — сохранение в localStorage
- **Пустые состояния** — информативные сообщения при отсутствии данных

## Разделы платформы

| # | Раздел | Описание |
|---|--------|----------|
| 1 | **Главная** | Герой-баннер, анимированная статистика, избранные ЛР |
| 2 | **Каталог ЛР** | 5 ЛР с фильтрами, поиском, CTF-флагами и подсказками |
| 3 | **Детали ЛР** | Цель, описание, задания с флагами, боковая панель прогресса |
| 4 | **Дашборд** | Графики recharts, рейтинг, таблица прогресса, лента отправок |
| 5 | **Инструменты** | Справочник 10 инструментов кибербезопасности |
| 6 | **О проекте** | Информация о разработчике и технологическом стеке |

## Лабораторные работы

| # | Лабораторная | Тема | Ключевые инструменты |
|---|-------------|------|---------------------|
| 1 | **ЛР1** | Сбор информации в компьютерных сетях | Spiderfoot, Maltego, Nmap |
| 2 | **ЛР2** | Тестирование сети на проникновение | Metasploit, Exploit-DB |
| 3 | **ЛР3** | Защита БД от SQL-инъекций | SQLi, параметризованные запросы |
| 4 | **ЛР4** | Аудит веб-ресурсов | OWASP ZAP, Probely |
| 5 | **ЛР5** | ARP-spoofing и DNS-spoofing | Bettercap, VMware, OpenWRT |

## Система CTF-флагов

- Формат флагов: `CYBER{...}`
- Каждый флаг имеет стоимость в баллах (10–20)
- Доступны подсказки для каждого флага
- Прогресс сохраняется в базе данных
- Поддерживается несколько студентов с индивидуальным прогрессом

## Быстрый старт

```bash
git clone https://github.com/your-username/cyberlab.git
cd cyberlab
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Приложение запустится на порту 3000.

## База данных

По умолчанию используется SQLite (файл `db/custom.db`). Схема БД включает модели: Student, Lab, LabFlag, LabProgress, FlagSubmission.

Команды для работы с БД:

```bash
npm run db:generate  # Сгенерировать клиент Prisma
npm run db:push      # Применить схему к БД
npm run db:migrate   # Создать и применить миграцию
npm run db:reset     # Сбросить БД
```

## Технологии

| Технология | Назначение |
|------------|------------|
| **Next.js 16** | React-фреймворк с App Router |
| **TypeScript 5** | Статическая типизация |
| **Tailwind CSS 4** | Утилитарные CSS-стили |
| **shadcn/ui** | Компоненты интерфейса (New York style) |
| **Prisma 6** | ORM для работы с SQLite |
| **Recharts 2** | Графики и диаграммы (BarChart, PieChart) |
| **Framer Motion 12** | Анимации и переходы |
| **Sonner** | Toast-уведомления |
| **Lucide React** | Иконки |
| **Zustand 5** | Управление состоянием |

## Структура проекта

```
cyberlab/
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
│   │   ├── layout.tsx            # Корневой layout
│   │   ├── page.tsx              # Главная страница (SPA с 6 вкладками)
│   │   ├── globals.css           # Глобальные стили (CSS-переменные, тёмная тема)
│   │   └── api/
│   │       ├── labs/route.ts     # GET /api/labs
│   │       ├── students/route.ts # GET /api/students
│   │       ├── flags/route.ts    # POST /api/flags — проверка флага
│   │       ├── dashboard/route.ts# GET /api/dashboard
│   │       └── progress/route.ts # GET /api/progress
│   ├── components/ui/            # shadcn/ui компоненты (50+)
│   ├── hooks/
│   │   ├── use-toast.ts          # Toast-уведомления
│   │   └── use-mobile.ts         # Определение мобильных устройств
│   └── lib/
│       ├── db.ts                 # Prisma Client (singleton)
│       └── utils.ts              # Утилиты (cn)
```

## API маршруты

| Эндпоинт | Метод | Описание |
|----------|-------|----------|
| `/api/labs` | GET | Список лабораторных работ |
| `/api/students` | GET | Список студентов |
| `/api/flags` | POST | Проверка и отправка флага |
| `/api/dashboard` | GET | Статистика дашборда |
| `/api/progress` | GET | Прогресс студента |

---

**CyberLab** — © 2025–2026 Дуплей Максим Игоревич. Все права защищены.
