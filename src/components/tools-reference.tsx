'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ToolsReference() {
  const tools = [
    { name: 'Spiderfoot', category: 'OSINT', desc: 'Автоматизированный сбор информации о доменах, IP-адресах, поддоменах и связях между объектами.', color: 'bg-cyan-500' },
    { name: 'Maltego Graph', category: 'OSINT', desc: 'Визуальная платформа для сбора и анализа информации с построением графов связей.', color: 'bg-cyan-500' },
    { name: 'Nmap / Zenmap', category: 'Сканирование', desc: 'Сетевой сканер для обнаружения хостов, открытых портов и определения сервисов.', color: 'bg-purple-500' },
    { name: 'Metasploit', category: 'Эксплуатация', desc: 'Фреймворк для разработки и выполнения эксплоитов против удалённых целей.', color: 'bg-red-500' },
    { name: 'OWASP ZAP', category: 'Аудит', desc: 'Автоматизированный сканер уязвимостей веб-приложений и API.', color: 'bg-amber-500' },
    { name: 'Probely', category: 'Аудит', desc: 'Облачная платформа для тестирования безопасности веб-приложений.', color: 'bg-amber-500' },
    { name: 'Bettercap', category: 'Сетевые атаки', desc: 'Мощный фреймворк для проведения ARP/DNS-spoofing и сниффинга трафика.', color: 'bg-rose-500' },
    { name: 'Docker', category: 'Инфраструктура', desc: 'Контейнеризация для развёртывания уязвимых машин и тестовых сред.', color: 'bg-emerald-500' },
    { name: 'VMware Workstation', category: 'Виртуализация', desc: 'Создание виртуальных сетей с изолированными машинами для безопасного тестирования.', color: 'bg-emerald-500' },
    { name: 'Exploit-DB', category: 'Справочник', desc: 'База данных известных уязвимостей и готовых эксплоитов.', color: 'bg-indigo-500' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Справочник инструментов</h2>
      <p className="text-muted-foreground">Программное обеспечение, используемое в лабораторных работах курса.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {tools.map(tool => (
          <Card key={tool.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${tool.color}`} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{tool.name}</span>
                    <Badge variant="secondary" className="text-xs">{tool.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{tool.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
