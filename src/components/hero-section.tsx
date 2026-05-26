'use client'

import { Shield, BarChart3, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function HeroSection({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500 rounded-full blur-[128px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-[128px] translate-x-1/2 translate-y-1/2" />
      </div>
      <div className="relative z-10 px-6 py-16 md:px-12 md:py-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <Shield className="w-6 h-6 text-cyan-400" aria-hidden="true" />
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30">МТУСИ · Кафедра ИБ</Badge>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Cyber<span className="text-cyan-400">Lab</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-8">
          Образовательная платформа для проведения лабораторных работ по информационной безопасности.
          Практикуйтесь в реальных сценариях кибератак и защите от них.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white gap-2" onClick={() => onNavigate('labs')}>
            <Terminal className="w-5 h-5" /> Начать работу
          </Button>
          <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2" onClick={() => onNavigate('dashboard')}>
            <BarChart3 className="w-5 h-5" /> Дашборд
          </Button>
        </div>
      </div>
    </section>
  )
}
