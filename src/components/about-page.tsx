'use client'

import { Shield, GraduationCap, Users, Code, Database } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function AboutPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">О проекте</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-500" aria-hidden="true" /> CyberLab
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              <strong>CyberLab</strong> — образовательная платформа для проведения лабораторных работ по информационной безопасности.
              Платформа позволяет студентам практиковаться в реальных сценариях кибератак и защиты от них в безопасной среде.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Каждая лабораторная работа содержит набор заданий в формате CTF (Capture The Flag), где необходимо найти
              флаги в формате <code className="px-1 py-0.5 bg-muted rounded font-mono text-sm">CYBER{'{...}'}</code>,
              выполняя различные задачи по кибербезопасности.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-500" aria-hidden="true" /> Разработчик
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10">
                  <Users className="w-5 h-5 text-cyan-600" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-semibold">Дуплей Максим Игоревич</div>
                  <div className="text-sm text-muted-foreground">Студент</div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Университет</div>
                  <div className="font-medium">МТУСИ</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Дисциплина</div>
                  <div className="font-medium">Защита информации от вредоносного ПО</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Кафедра</div>
                  <div className="font-medium">Информационной безопасности</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-amber-500" aria-hidden="true" /> Технологический стек
          </CardTitle>
          <CardDescription>Технологии, использованные при разработке платформы</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: 'Next.js 16', desc: 'React-фреймворк', icon: '⚡' },
              { name: 'React 19', desc: 'UI библиотека', icon: '⚛️' },
              { name: 'TypeScript', desc: 'Типизированный JS', icon: '📘' },
              { name: 'Tailwind CSS 4', desc: 'Утилитарный CSS', icon: '🎨' },
              { name: 'shadcn/ui', desc: 'Компоненты', icon: '🧩' },
              { name: 'Prisma ORM', desc: 'ORM для БД', icon: <Database className="w-4 h-4" /> },
              { name: 'SQLite', desc: 'База данных', icon: '🗄️' },
              { name: 'Recharts', desc: 'Графики и диаграммы', icon: '📊' },
              { name: 'Lucide Icons', desc: 'Иконки', icon: '✨' },
            ].map(tech => (
              <div key={tech.name} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50 border">
                <span className="text-lg shrink-0 mt-0.5">{tech.icon}</span>
                <div>
                  <div className="font-medium text-sm">{tech.name}</div>
                  <div className="text-xs text-muted-foreground">{tech.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
              <Shield className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold">CyberLab · МТУСИ</h3>
          </div>
          <p className="text-slate-300 leading-relaxed max-w-2xl">
            Платформа разработана в учебных целях для освоения практических навыков в области информационной безопасности.
            Все сценарии атак выполняются в изолированной среде и предназначены исключительно для образовательных целей.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Образование</Badge>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Кибербезопасность</Badge>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">CTF</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
