'use client'

import { useMemo } from 'react'
import { BarChart3, Target, GraduationCap, FileSearch, CheckCircle2, AlertCircle, Clock, Trophy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { DifficultyBadge } from '@/components/ui/badges'
import type { DashboardData, Lab, StudentDb, ProgressRecord } from '@/types'

export function DashboardView({
  dashboard,
  selectedStudent,
  students,
  labs,
  progressRecords,
}: {
  dashboard: DashboardData
  selectedStudent: StudentDb | null
  students: StudentDb[]
  labs: Lab[]
  progressRecords: ProgressRecord[]
}) {
  const currentStat = dashboard.studentStats.find(s => s.id === selectedStudent?.id)

  const barChartData = useMemo(() => labs.map(lab => {
    const prog = progressRecords.find(p => p.labId === lab.id)
    return {
      name: `ЛР${lab.number}`,
      points: prog?.score ?? 0,
      maxPoints: lab.flags.reduce((sum, f) => sum + f.points, 0),
    }
  }), [labs, progressRecords])

  const sortedStudentStats = useMemo(() =>
    [...dashboard.studentStats].sort((a, b) => b.totalScore - a.totalScore)
  , [dashboard.studentStats])

  const pieChartData = useMemo(() => {
    const completedCount = progressRecords.filter(p => p.status === 'completed').length
    const inProgressCount = progressRecords.filter(p => p.status === 'in_progress').length
    const notStartedCount = Math.max((dashboard.totalLabs) - completedCount - inProgressCount, 0)
    return [
      { name: 'Выполнено', value: completedCount, color: '#10b981' },
      { name: 'В процессе', value: inProgressCount, color: '#f59e0b' },
      { name: 'Не начато', value: notStartedCount, color: '#94a3b8' },
    ].filter(d => d.value > 0)
  }, [progressRecords, dashboard.totalLabs])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Панель управления</h2>
        {selectedStudent && (
          <Badge variant="outline" className="ml-auto">
            <GraduationCap className="w-3 h-3 mr-1" />
            {selectedStudent.name}
          </Badge>
        )}
      </div>

      {currentStat && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Баллы</div>
              <div className="text-2xl font-bold text-cyan-600">{currentStat.totalScore}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Выполнено</div>
              <div className="text-2xl font-bold text-emerald-600">{currentStat.completedLabs}/{currentStat.totalLabs}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">В процессе</div>
              <div className="text-2xl font-bold text-amber-600">{currentStat.inProgressLabs}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Прогресс</div>
              <div className="text-2xl font-bold">{Math.round((currentStat.completedLabs / Math.max(currentStat.totalLabs, 1)) * 100)}%</div>
              <Progress value={Math.round((currentStat.completedLabs / Math.max(currentStat.totalLabs, 1)) * 100)} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-500" aria-hidden="true" /> Баллы по лабораторным</CardTitle>
            <CardDescription>Ваш результат по каждой работе</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    formatter={(value: number, name: string) => [value, name === 'points' ? 'Получено' : 'Максимум']}
                  />
                  <Bar dataKey="maxPoints" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="maxPoints" />
                  <Bar dataKey="points" fill="#06b6d4" radius={[4, 4, 0, 0]} name="points" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-emerald-500" aria-hidden="true" /> Статус выполнения</CardTitle>
            <CardDescription>Распределение по статусам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileSearch className="w-10 h-10 mx-auto mb-2 opacity-50" aria-hidden="true" />
                  <p className="text-sm">Нет данных для отображения</p>
                </div>
              )}
            </div>
            {pieChartData.length > 0 && (
              <div className="flex justify-center gap-4 mt-2">
                {pieChartData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Прогресс по лабораторным</CardTitle>
          <CardDescription>Статистика выполнения работ студентами группы</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Прогресс по лабораторным работам</caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className="text-left py-3 px-2 font-medium text-muted-foreground">Лабораторная</th>
                  <th scope="col" className="text-center py-3 px-2 font-medium text-muted-foreground">Сложность</th>
                  <th scope="col" className="text-center py-3 px-2 font-medium text-muted-foreground">Выполнили</th>
                  <th scope="col" className="text-center py-3 px-2 font-medium text-muted-foreground">В процессе</th>
                  <th scope="col" className="text-center py-3 px-2 font-medium text-muted-foreground">Прогресс</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.labStats.map(ls => (
                  <tr key={ls.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-medium">ЛР №{ls.number}. {ls.title}</div>
                    </td>
                    <td className="py-3 px-2 text-center"><DifficultyBadge level={ls.difficulty} /></td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />{ls.completed}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                        <Clock className="w-4 h-4" aria-hidden="true" />{ls.inProgress}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.round((ls.completed / Math.max(ls.totalStudents, 1)) * 100)} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-10 text-right">{Math.round((ls.completed / Math.max(ls.totalStudents, 1)) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {dashboard.recentSubmissions && dashboard.recentSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-500" aria-hidden="true" /> Последние отправки</CardTitle>
            <CardDescription>Последние попытки отправки флагов</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {dashboard.recentSubmissions.slice(0, 10).map(sub => {
                const student = dashboard.studentStats.find(s => s.id === sub.studentId)
                const lab = labs.find(l => l.id === sub.labId)
                return (
                  <div key={sub.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${sub.correct ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-red-500/5 border border-red-500/10'}`}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${sub.correct ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      {sub.correct ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{student?.name ?? 'Студент'}</span>
                        <Badge variant="secondary" className="text-xs">{student?.group}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {lab ? `ЛР №${lab.number}` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <code className="font-mono truncate">{sub.flagKey}</code>
                        <Badge variant={sub.correct ? "default" : "destructive"} className="text-[10px] px-1 py-0 h-4">
                          {sub.correct ? "OK" : "ERR"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {new Date(sub.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" aria-hidden="true" /> Рейтинг студентов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedStudentStats.map((s, idx) => (
              <div key={s.id} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${s.id === selectedStudent?.id ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-muted/50'}`}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                  idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-sm text-muted-foreground">{s.group}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-cyan-600">{s.totalScore} б.</div>
                  <div className="text-xs text-muted-foreground">{s.completedLabs}/{s.totalLabs} работ</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
