<div align="center">

# CyberLab v2

### CyberLab-mtusi — MTUSI educational platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-black)](https://ui.shadcn.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.11-2d3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENCE)

---

**Developer:** Dupley Maxim Igorevich

**Intellectual Property:** Dupley Maxim Igorevich

**MTUSI**, Department of Information Security, Group UBVT2404

</div>

---

## About the Project

**CyberLab v2** is an educational platform developed for MTUSI (Department of Information Security) to conduct laboratory exercises for the course "Information Protection from Malicious Software". The platform combines a laboratory work catalog, a CTF flag system, a dashboard with progress charts, a cybersecurity tools reference guide, and a student submission tracking system.

The platform supports 5 laboratory exercises: OSINT and information gathering, penetration testing, database protection from SQL injections, web resource auditing, and ARP/DNS spoofing.

## What's New in v2

- **Catalog filters** — filter by categories and difficulty level
- **Catalog search** — instant search by title and description
- **"About" tab** — information about the developer, university, and technologies
- **Dashboard charts** — BarChart for lab scores and PieChart for completion status (recharts)
- **Recent submissions feed** — 10 latest flag submission attempts
- **Animations** — smooth transitions between tabs, card appearance animations
- **Dark theme** — persisted in localStorage
- **Empty states** — informative messages when no data is available

## Platform Sections

| # | Section | Description |
|---|---------|-------------|
| 1 | **Home** | Hero banner, animated statistics, favorite labs |
| 2 | **Lab Catalog** | 5 labs with filters, search, CTF flags, and hints |
| 3 | **Lab Details** | Objectives, description, flag assignments, progress sidebar |
| 4 | **Dashboard** | Recharts graphs, leaderboard, progress table, submission feed |
| 5 | **Tools** | Reference guide for 10 cybersecurity tools |
| 6 | **About** | Developer and technology stack information |

## Laboratory Exercises

| # | Lab | Topic | Key Tools |
|---|-----|-------|-----------|
| 1 | **Lab 1** | Information Gathering in Computer Networks | Spiderfoot, Maltego, Nmap |
| 2 | **Lab 2** | Network Penetration Testing | Metasploit, Exploit-DB |
| 3 | **Lab 3** | Database Protection from SQL Injections | SQLi, parameterized queries |
| 4 | **Lab 4** | Web Resource Auditing | OWASP ZAP, Probely |
| 5 | **Lab 5** | ARP-spoofing and DNS-spoofing | Bettercap, VMware, OpenWRT |

## CTF Flag System

- Flag format: `CYBER{...}`
- Each flag has a point value (10–20 points)
- Hints are available for each flag
- Progress is persisted in the database
- Multiple students supported with individual progress tracking

## Quick Start

```bash
git clone https://github.com/your-username/cyberlab.git
cd cyberlab
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

The application will be available on port 3000.

## Database

SQLite is used by default (`db/custom.db`). The database schema includes models: Student, Lab, LabFlag, LabProgress, FlagSubmission.

Database commands:

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create and apply migration
npm run db:reset     # Reset the database
```

## Technologies

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript 5** | Static typing for code reliability |
| **Tailwind CSS 4** | Utility-first CSS framework |
| **shadcn/ui** | UI components (New York style) |
| **Prisma 6** | ORM for SQLite database |
| **Recharts 2** | Charts and graphs (BarChart, PieChart) |
| **Framer Motion 12** | Animations and transitions |
| **Sonner** | Toast notifications |
| **Lucide React** | Icon library |
| **Zustand 5** | Lightweight state management |

## Project Structure

```
cyberlab/
├── .env                          # DATABASE_URL for SQLite
├── package.json                  # Dependencies and scripts
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── components.json               # shadcn/ui configuration
├── Caddyfile                     # Caddy reverse proxy configuration
├── prisma/
│   ├── schema.prisma             # Database schema (Student, Lab, LabFlag, LabProgress, FlagSubmission)
│   └── seed.ts                   # Seed data (5 labs, 2 students, 16 flags)
├── db/
│   └── custom.db                 # SQLite database file
├── public/
│   ├── logo.svg
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Main page (SPA with 6 tabs)
│   │   ├── globals.css           # Global styles (CSS variables, dark theme)
│   │   └── api/
│   │       ├── labs/route.ts     # GET /api/labs
│   │       ├── students/route.ts # GET /api/students
│   │       ├── flags/route.ts    # POST /api/flags — flag verification
│   │       ├── dashboard/route.ts# GET /api/dashboard
│   │       └── progress/route.ts # GET /api/progress
│   ├── components/ui/            # shadcn/ui components (50+)
│   ├── hooks/
│   │   ├── use-toast.ts          # Toast notifications
│   │   └── use-mobile.ts         # Mobile device detection
│   └── lib/
│       ├── db.ts                 # Prisma Client (singleton)
│       └── utils.ts              # Utilities (cn)
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/labs` | GET | List laboratory exercises |
| `/api/students` | GET | List students |
| `/api/flags` | POST | Verify and submit flag |
| `/api/dashboard` | GET | Dashboard statistics |
| `/api/progress` | GET | Student progress |

## Roadmap

- [x] Main SPA with 6 tabs
- [x] Prisma database with 5 models
- [x] 5 REST API routes
- [x] CTF flag system with scoring
- [x] Dashboard with recharts graphs
- [x] Lab catalog with filters and search
- [x] Cybersecurity tools reference
- [x] Dark theme with persistence
- [x] Animations with Framer Motion
- [ ] Student authentication and authorization
- [ ] Teacher/admin panel
- [ ] Export progress reports (PDF)

---

## Author

**Dupley Maxim Igorevich**

This project is the intellectual property of Dupley Maxim Igorevich. All rights to the source code, design, educational content, and materials belong to the author.

---

## License

This project is the intellectual property of Dupley Maxim Igorevich. Terms of use are described in the [LICENCE](./LICENCE) file.

---

<div align="center">

**CyberLab v2** — © 2025–2026 Dupley Maxim Igorevich. All rights reserved.

</div>
