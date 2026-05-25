'use client'

import { BookOpen, Flame, Flag, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useCountUp } from '@/hooks/use-count-up'
import type { DashboardData, StudentDb } from '@/types'

export function StatsSection({
  dashboard,
  selectedStudent,
  statsRef,
}: {
  dashboard: DashboardData | null
  selectedStudent: StudentDb | null
  statsRef: React.RefObject<HTMLDivElement | null>
}) {
  const currentStat = dashboard?.studentStats.find(s => s.id === selectedStudent?.id)
  const accuracyValue = dashboard ? Math.round((dashboard.correctSubmissions / Math.max(dashboard.totalSubmissions, 1)) * 100) : 0
  return (
    <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard icon={<BookOpen className="w-5 h-5" />} label="Лабораторных" value={dashboard?.totalLabs ?? 5} color="text-cyan-500" />
      <StatCard icon={<Flame className="w-5 h-5" />} label="Ваши баллы" value={currentStat?.totalScore ?? 0} color="text-orange-500" />
      <StatCard icon={<Flag className="w-5 h-5" />} label="Флагов найдено" value={dashboard?.correctSubmissions ?? 0} color="text-emerald-500" />
      <StatCard icon={<Target className="w-5 h-5" />} label="Точность" value={accuracyValue} color="text-amber-500" isPercentage />
    </div>
  )
}

function StatCard({ icon, label, value, color, isPercentage }: {
  icon: React.ReactNode; label: string; value: number; color: string; isPercentage?: boolean
}) {
  const count = useCountUp(value, 1000, true)
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-500">
      <CardContent className="p-4 md:p-6">
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted mb-3 ${color}`}>
          {icon}
        </div>
        <div className="text-2xl md:text-3xl font-bold">
          {isPercentage ? `${count}%` : count}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}
