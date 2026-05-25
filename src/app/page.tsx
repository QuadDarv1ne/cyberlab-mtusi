'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Shield, Terminal, Target, Trophy, Users, BookOpen,
  ChevronRight, CheckCircle2, Clock, AlertCircle, Zap,
  Search, Lock, Bug, Network, ArrowRight, Star, Flag,
  BarChart3, GraduationCap, Lightbulb, Send, Menu, X,
  Moon, Sun, Play, Award, Flame, Info, Code, Database,
  LayoutDashboard, FileSearch
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface LabFlag {
  id: string
  flagKey: string
  points: number
  hint: string | null
}

interface Lab {
  id: string
  number: number
  title: string
  description: string
  goal: string
  tools: string
  difficulty: string
  category: string
  flags: LabFlag[]
}

interface StudentDb {
  id: string
  name: string
  group: string
}

interface StudentStat {
  id: string
  name: string
  group: string
  totalScore: number
  completedLabs: number
  inProgressLabs: number
  totalLabs: number
}

interface LabStat {
  id: string
  number: number
  title: string
  difficulty: string
  completed: number
  inProgress: number
  totalStudents: number
}

interface RecentSubmission {
  id: string
  studentId: string
  labId: string
  flagKey: string
  flagValue: string
  correct: boolean
  createdAt: string
}

interface DashboardData {
  studentStats: StudentStat[]
  labStats: LabStat[]
  recentSubmissions: RecentSubmission[]
  totalSubmissions: number
  correctSubmissions: number
  totalStudents: number
  totalLabs: number
}

interface FoundFlag {
  labId: string
  flagKey: string
}

interface ProgressRecord {
  labId: string
  status: string
  flagsFound: number
  totalFlags: number
  score: number
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  reconnaissance: { label: 'Разведка', icon: <Search className="w-4 h-4" />, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  exploitation: { label: 'Эксплуатация', icon: <Zap className="w-4 h-4" />, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  web_security: { label: 'Веб-безопасность', icon: <Bug className="w-4 h-4" />, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  network_attacks: { label: 'Сетевые атаки', icon: <Network className="w-4 h-4" />, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
}

const DIFFICULTY_META: Record<string, { label: string; color: string; stars: number }> = {
  easy: { label: 'Лёгкий', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', stars: 1 },
  medium: { label: 'Средний', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', stars: 2 },
  hard: { label: 'Сложный', color: 'bg-red-500/10 text-red-600 border-red-500/20', stars: 3 },
}

const NAV_TABS = [
  { id: 'home', label: 'Главная', icon: <Shield className="w-4 h-4" /> },
  { id: 'labs', label: 'Лабораторные', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'dashboard', label: 'Дашборд', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'tools', label: 'Инструменты', icon: <Terminal className="w-4 h-4" /> },
  { id: 'about', label: 'О проекте', icon: <Info className="w-4 h-4" /> },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function CyberLab() {
  const { toast } = useToast()
  const [labs, setLabs] = useState<Lab[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [students, setStudents] = useState<StudentDb[]>([])
  const [activeTab, setActiveTab] = useState('home')
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null)
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0)
  const [flagInputs, setFlagInputs] = useState<Record<string, string>>({})
  const [flagResults, setFlagResults] = useState<Record<string, { correct: boolean; message: string; alreadyFound?: boolean }>>({})
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({})
  const [foundFlags, setFoundFlags] = useState<FoundFlag[]>([])
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  // New state: catalog filters and search
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all')
  const [catalogDifficultyFilter, setCatalogDifficultyFilter] = useState<string>('all')
  // Animation key for tab transitions
  const [animKey, setAnimKey] = useState(0)
  // Stats animation
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  // Dark mode: persist to localStorage and read initial value
  useEffect(() => {
    const saved = localStorage.getItem('cyberlab-dark-mode')
    if (saved !== null) {
      const isDark = saved === 'true'
      setDarkMode(isDark)
      document.documentElement.classList.toggle('dark', isDark)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('cyberlab-dark-mode', String(darkMode))
  }, [darkMode])

  const selectedStudent = students[selectedStudentIdx] || null

  // Tab switch handler with animation
  const handleTabSwitch = (tabId: string) => {
    setActiveTab(tabId)
    setAnimKey(prev => prev + 1)
  }

  // Stats intersection observer for entrance animation
  useEffect(() => {
    if (!statsRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [loading])

  const fetchLabs = useCallback(async () => {
    try {
      const res = await fetch('/api/labs')
      const data = await res.json()
      setLabs(data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      setDashboard(data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students')
      const data = await res.json()
      setStudents(data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchProgress = useCallback(async () => {
    if (!selectedStudent) return
    try {
      const res = await fetch(`/api/progress?studentId=${selectedStudent.id}`)
      const data = await res.json()
      setFoundFlags(data.found || [])
      setProgressRecords(data.progress || [])
    } catch (e) { console.error(e) }
  }, [selectedStudent])

  useEffect(() => {
    const init = async () => {
      await fetchStudents()
      await fetchLabs()
      await fetchDashboard()
      setLoading(false)
    }
    init()
  }, [fetchLabs, fetchDashboard, fetchStudents])

  useEffect(() => {
    if (selectedStudent) fetchProgress()
  }, [selectedStudent, fetchProgress])

  const submitFlag = async (labId: string, flagKey: string) => {
    const resultKey = `${labId}-${flagKey}`
    const flagValue = flagInputs[resultKey]
    if (!flagValue?.trim()) {
      toast({ title: 'Ошибка', description: 'Введите значение флага', variant: 'destructive' })
      return
    }
    if (!selectedStudent) {
      toast({ title: 'Ошибка', description: 'Выберите студента', variant: 'destructive' })
      return
    }

    setSubmitting(prev => ({ ...prev, [resultKey]: true }))

    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent.id, labId, flagKey, flagValue: flagValue.trim() })
      })
      const data = await res.json()

      setFlagResults(prev => ({
        ...prev,
        [resultKey]: { correct: data.correct, message: data.message, alreadyFound: data.alreadyFound }
      }))

      if (data.correct && !data.alreadyFound) {
        toast({ title: '🎉 Флаг принят!', description: data.message })
        fetchProgress()
        fetchDashboard()
      } else if (data.alreadyFound) {
        toast({ title: 'Уже найден', description: data.message })
      } else {
        toast({ title: 'Неверный флаг', description: data.message, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отправить флаг', variant: 'destructive' })
    } finally {
      setSubmitting(prev => ({ ...prev, [resultKey]: false }))
    }
  }

  const isFlagFound = (labId: string, flagKey: string) =>
    foundFlags.some(f => f.labId === labId && f.flagKey === flagKey)

  const getLabProgress = (labId: string) =>
    progressRecords.find(p => p.labId === labId)

  // Filtered labs for catalog
  const filteredLabs = labs.filter(lab => {
    const matchesSearch = catalogSearch.trim() === '' ||
      lab.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      lab.description.toLowerCase().includes(catalogSearch.toLowerCase())
    const matchesCategory = catalogCategoryFilter === 'all' || lab.category === catalogCategoryFilter
    const matchesDifficulty = catalogDifficultyFilter === 'all' || lab.difficulty === catalogDifficultyFilter
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  /* ---- Animated counter hook ---- */
  const useCountUp = (end: number, duration: number = 800, visible: boolean = true) => {
    const [count, setCount] = useState(0)
    useEffect(() => {
      if (!visible) return
      let start = 0
      const increment = end / (duration / 16)
      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          setCount(end)
          clearInterval(timer)
        } else {
          setCount(Math.floor(start))
        }
      }, 16)
      return () => clearInterval(timer)
    }, [end, duration, visible])
    return count
  }

  /* ---- Render Helpers ---- */
  const DifficultyBadge = ({ level }: { level: string }) => {
    const meta = DIFFICULTY_META[level] || DIFFICULTY_META.medium
    return (
      <Badge variant="outline" className={`${meta.color} gap-1`}>
        {Array.from({ length: meta.stars }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
        {meta.label}
      </Badge>
    )
  }

  const CategoryBadge = ({ category }: { category: string }) => {
    const meta = CATEGORY_META[category] || CATEGORY_META.reconnaissance
    return (
      <Badge variant="outline" className={`${meta.color} gap-1`}>
        {meta.icon}
        {meta.label}
      </Badge>
    )
  }

  /* ---- HERO ---- */
  const HeroSection = () => (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500 rounded-full blur-[128px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-[128px] translate-x-1/2 translate-y-1/2" />
      </div>
      <div className="relative z-10 px-6 py-16 md:px-12 md:py-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <Shield className="w-6 h-6 text-cyan-400" />
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
          <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white gap-2" onClick={() => handleTabSwitch('labs')}>
            <Terminal className="w-5 h-5" /> Начать работу
          </Button>
          <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2" onClick={() => handleTabSwitch('dashboard')}>
            <BarChart3 className="w-5 h-5" /> Дашборд
          </Button>
        </div>
      </div>
    </section>
  )

  /* ---- STATS CARDS with count-up animation ---- */
  const StatCard = ({ icon, label, value, color, isPercentage }: {
    icon: React.ReactNode; label: string; value: number; color: string; isPercentage?: boolean
  }) => {
    const count = useCountUp(value, 1000, statsVisible)
    return (
      <Card className={`border-0 shadow-sm hover:shadow-md transition-all duration-500 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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

  const StatsSection = () => {
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

  /* ---- LAB CARDS (catalog with search and filters) ---- */
  const LabCatalog = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Каталог лабораторных работ</h2>
        <Badge variant="secondary" className="text-sm">{filteredLabs.length} из {labs.length} работ</Badge>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию или описанию..."
          value={catalogSearch}
          onChange={e => setCatalogSearch(e.target.value)}
          className="pl-9"
        />
        {catalogSearch && (
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setCatalogSearch('')}>
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Category filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Категория:</span>
          <Button variant={catalogCategoryFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCatalogCategoryFilter('all')}>
            Все
          </Button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <Button key={key} variant={catalogCategoryFilter === key ? 'default' : 'outline'} size="sm" className="gap-1" onClick={() => setCatalogCategoryFilter(key)}>
              {meta.icon}{meta.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Сложность:</span>
          <Button variant={catalogDifficultyFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCatalogDifficultyFilter('all')}>
            Все
          </Button>
          {Object.entries(DIFFICULTY_META).map(([key, meta]) => (
            <Button key={key} variant={catalogDifficultyFilter === key ? 'default' : 'outline'} size="sm" className="gap-1" onClick={() => setCatalogDifficultyFilter(key)}>
              {Array.from({ length: meta.stars }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
              {meta.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Empty state for no results */}
      {filteredLabs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileSearch className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Ничего не найдено</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Попробуйте изменить параметры поиска или сбросить фильтры, чтобы найти лабораторные работы.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setCatalogSearch(''); setCatalogCategoryFilter('all'); setCatalogDifficultyFilter('all') }}>
              Сбросить фильтры
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLabs.map(lab => {
            const labStat = dashboard?.labStats.find(ls => ls.id === lab.id)
            const progressPercent = labStat ? Math.round((labStat.completed / Math.max(labStat.totalStudents, 1)) * 100) : 0
            const totalPoints = lab.flags.reduce((sum, f) => sum + f.points, 0)
            const myProgress = getLabProgress(lab.id)
            const foundCount = lab.flags.filter(f => isFlagFound(lab.id, f.flagKey)).length

            return (
              <Card key={lab.id} className="hover:shadow-md transition-all cursor-pointer group" onClick={() => { setSelectedLab(lab); handleTabSwitch('lab-detail') }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono">ЛР №{lab.number}</Badge>
                        <CategoryBadge category={lab.category} />
                        <DifficultyBadge level={lab.difficulty} />
                        {myProgress?.status === 'completed' && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Выполнена
                          </Badge>
                        )}
                        {myProgress?.status === 'in_progress' && (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                            <Clock className="w-3 h-3" /> В процессе
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg group-hover:text-cyan-600 transition-colors">{lab.title}</CardTitle>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-cyan-500 transition-colors shrink-0 mt-1" />
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{lab.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Flag className="w-3.5 h-3.5" />
                      {foundCount}/{lab.flags.length} найдено
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />{totalPoints} баллов
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{labStat?.completed ?? 0} выполнено
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Progress value={progressPercent} className="h-1.5" />
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )

  /* ---- LAB DETAIL ---- */
  const LabDetail = () => {
    if (!selectedLab) return null
    const totalPoints = selectedLab.flags.reduce((sum, f) => sum + f.points, 0)
    const foundCount = selectedLab.flags.filter(f => isFlagFound(selectedLab.id, f.flagKey)).length
    const myProgress = getLabProgress(selectedLab.id)
    const allFound = foundCount === 0 && selectedLab.flags.length > 0

    return (
      <div className="space-y-6">
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => { handleTabSwitch('labs'); setSelectedLab(null) }}>
          <ArrowRight className="w-4 h-4 rotate-180" /> Назад к каталогу
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-base">ЛР №{selectedLab.number}</Badge>
          <CategoryBadge category={selectedLab.category} />
          <DifficultyBadge level={selectedLab.difficulty} />
          {myProgress?.status === 'completed' && (
            <Badge className="bg-emerald-500 text-white gap-1"><Award className="w-3.5 h-3.5" /> Выполнена</Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold">{selectedLab.title}</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-cyan-500" /> Цель работы</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{selectedLab.goal}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-cyan-500" /> Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{selectedLab.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Flag className="w-5 h-5 text-amber-500" /> Задания и флаги</CardTitle>
                <CardDescription>Найдите флаги, чтобы получить баллы. Формат: CYBER{'{...}'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Empty state when no flags found yet */}
                {allFound && selectedLab.flags.length > 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-dashed mb-4">
                    <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Начните поиск флагов</p>
                      <p className="text-xs text-muted-foreground">Ни один флаг ещё не найден. Введите значения в формате CYBER{'{...}'} и нажмите «Отправить».</p>
                    </div>
                  </div>
                )}
                {selectedLab.flags.map((flag, idx) => {
                  const resultKey = `${selectedLab.id}-${flag.flagKey}`
                  const result = flagResults[resultKey]
                  const hintRevealed = revealedHints[resultKey]
                  const found = isFlagFound(selectedLab.id, flag.flagKey)
                  const isSubmitting = submitting[resultKey]

                  return (
                    <div key={flag.id} className={`rounded-lg border p-4 space-y-3 transition-colors ${found ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${found ? 'bg-emerald-500 text-white' : 'bg-muted'}`}>
                            {found ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className="font-medium">Флаг: {flag.flagKey}</span>
                          {found && <Badge className="bg-emerald-500/10 text-emerald-600 gap-1 text-xs"><CheckCircle2 className="w-3 h-3" />Найден</Badge>}
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <Trophy className="w-3 h-3" />{flag.points} б.
                        </Badge>
                      </div>

                      {flag.hint && !found && (
                        <div>
                          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-7" onClick={() => setRevealedHints(prev => ({ ...prev, [resultKey]: !prev[resultKey] }))}>
                            {hintRevealed ? <X className="w-3.5 h-3.5" /> : <Lightbulb className="w-3.5 h-3.5" />}
                            {hintRevealed ? 'Скрыть подсказку' : 'Показать подсказку'}
                          </Button>
                          {hintRevealed && (
                            <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-md px-3 py-2 mt-1">
                              💡 {flag.hint}
                            </p>
                          )}
                        </div>
                      )}

                      {!found && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="CYBER{...}"
                            value={flagInputs[resultKey] || ''}
                            onChange={e => setFlagInputs(prev => ({ ...prev, [resultKey]: e.target.value }))}
                            className="font-mono"
                            onKeyDown={e => e.key === 'Enter' && !isSubmitting && submitFlag(selectedLab.id, flag.flagKey)}
                            disabled={isSubmitting}
                          />
                          <Button onClick={() => submitFlag(selectedLab.id, flag.flagKey)} className="shrink-0 gap-2" disabled={isSubmitting}>
                            {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                            Отправить
                          </Button>
                        </div>
                      )}

                      {result && !found && (
                        <div className={`flex items-center gap-2 text-sm ${result.correct ? 'text-emerald-600' : 'text-red-600'}`}>
                          {result.correct ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          {result.message}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Инструменты</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedLab.tools.split(', ').map(tool => (
                    <Badge key={tool} variant="secondary" className="gap-1">
                      <Terminal className="w-3 h-3" />{tool}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ваш прогресс</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Флаги</span>
                  <span className="font-medium">{foundCount}/{selectedLab.flags.length}</span>
                </div>
                <Progress value={selectedLab.flags.length > 0 ? Math.round((foundCount / selectedLab.flags.length) * 100) : 0} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Макс. баллов</span>
                  <span className="font-medium">{totalPoints}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ваши баллы</span>
                  <span className="font-bold text-cyan-600">{myProgress?.score ?? 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Сложность</span>
                  <DifficultyBadge level={selectedLab.difficulty} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Категория</span>
                  <CategoryBadge category={selectedLab.category} />
                </div>
              </CardContent>
            </Card>

            {/* Quick tips */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Подсказка</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Формат всех флагов: <code className="px-1 py-0.5 bg-muted rounded font-mono">CYBER{'{...}'}</code>.
                  Подсказки доступны, но за флаги с подсказками баллы не снижаются — используйте смело!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  /* ---- DASHBOARD with Charts ---- */
  const DashboardView = () => {
    if (!dashboard) return null
    const currentStat = dashboard.studentStats.find(s => s.id === selectedStudent?.id)

    // Bar chart data: points per lab for selected student
    const barChartData = labs.map(lab => {
      const prog = progressRecords.find(p => p.labId === lab.id)
      return {
        name: `ЛР${lab.number}`,
        points: prog?.score ?? 0,
        maxPoints: lab.flags.reduce((sum, f) => sum + f.points, 0),
      }
    })

    // Pie chart data: completion status distribution
    const completedCount = progressRecords.filter(p => p.status === 'completed').length
    const inProgressCount = progressRecords.filter(p => p.status === 'in_progress').length
    const notStartedCount = Math.max((dashboard.totalLabs) - completedCount - inProgressCount, 0)
    const pieChartData = [
      { name: 'Выполнено', value: completedCount, color: '#10b981' },
      { name: 'В процессе', value: inProgressCount, color: '#f59e0b' },
      { name: 'Не начато', value: notStartedCount, color: '#94a3b8' },
    ].filter(d => d.value > 0)

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Панель управления</h2>

        {/* Student selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">Активный студент:</span>
              {students.map((s, idx) => (
                <Button key={s.id} variant={selectedStudentIdx === idx ? 'default' : 'outline'} size="sm" onClick={() => setSelectedStudentIdx(idx)} className="gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {s.name}
                  <Badge variant="secondary" className="ml-1">{s.group}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Student stats */}
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

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Bar chart: points per lab */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-500" /> Баллы по лабораторным</CardTitle>
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

          {/* Pie chart: completion status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-emerald-500" /> Статус выполнения</CardTitle>
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
                    <FileSearch className="w-10 h-10 mx-auto mb-2 opacity-50" />
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

        {/* Lab progress table */}
        <Card>
          <CardHeader>
            <CardTitle>Прогресс по лабораторным</CardTitle>
            <CardDescription>Статистика выполнения работ студентами группы</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Лабораторная</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Сложность</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Выполнили</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">В процессе</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Прогресс</th>
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
                          <CheckCircle2 className="w-4 h-4" />{ls.completed}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                          <Clock className="w-4 h-4" />{ls.inProgress}
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

        {/* Recent submissions feed */}
        {dashboard.recentSubmissions && dashboard.recentSubmissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-500" /> Последние отправки</CardTitle>
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
                        <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                          {sub.flagKey}: {sub.flagValue}
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

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Рейтинг студентов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.studentStats.sort((a, b) => b.totalScore - a.totalScore).map((s, idx) => (
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

  /* ---- TOOLS REFERENCE ---- */
  const ToolsReference = () => {
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

  /* ---- ABOUT PAGE ---- */
  const AboutPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">О проекте</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-500" /> CyberLab
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
              <GraduationCap className="w-5 h-5 text-emerald-500" /> Разработчик
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10">
                  <Users className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <div className="font-semibold">Дуплей Максим Игоревич</div>
                  <div className="text-sm text-muted-foreground">Студент</div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Университет</div>
                  <div className="font-medium">МТУСИ</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Группа</div>
                  <div className="font-medium">УБВТ2404</div>
                </div>
                <div className="col-span-2">
                  <div className="text-muted-foreground mb-1">Дисциплина</div>
                  <div className="font-medium">Защита информации от вредоносного ПО</div>
                </div>
                <div className="col-span-2">
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
            <Code className="w-5 h-5 text-amber-500" /> Технологический стек
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
              <Shield className="w-5 h-5 text-cyan-400" />
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

  /* ---- MAIN LAYOUT ---- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Загрузка платформы...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabSwitch('home')}>
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 dark:bg-slate-100">
                <Shield className="w-5 h-5 text-cyan-400 dark:text-cyan-600" />
              </div>
              <span className="font-bold text-lg hidden sm:inline">CyberLab</span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_TABS.map(tab => (
                <Button key={tab.id} variant={activeTab === tab.id ? 'secondary' : 'ghost'} size="sm" className="gap-2" onClick={() => handleTabSwitch(tab.id)}>
                  {tab.icon}{tab.label}
                </Button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setDarkMode(prev => !prev)} title={darkMode ? 'Светлая тема' : 'Тёмная тема'}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              {selectedStudent && (
                <Badge variant="outline" className="hidden sm:flex gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {selectedStudent.name}
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-1">
              {NAV_TABS.map(tab => (
                <Button key={tab.id} variant={activeTab === tab.id ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => { handleTabSwitch(tab.id); setMobileMenuOpen(false) }}>
                  {tab.icon}{tab.label}
                </Button>
              ))}
              <Separator className="my-2" />
              <div className="px-4">
                <span className="text-sm text-muted-foreground">Студент:</span>
                <div className="flex gap-2 mt-2">
                  {students.map((s, idx) => (
                    <Button key={s.id} variant={selectedStudentIdx === idx ? 'default' : 'outline'} size="sm" onClick={() => { setSelectedStudentIdx(idx); setMobileMenuOpen(false) }}>
                      {s.name.split(' ')[0]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8">
        <div key={animKey} className="animate-fade-in">
          {activeTab === 'home' && (
            <div className="space-y-8">
              <HeroSection />
              <StatsSection />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Лабораторные работы</h2>
                  <Button variant="ghost" className="gap-2" onClick={() => handleTabSwitch('labs')}>Все работы <ArrowRight className="w-4 h-4" /></Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {labs.slice(0, 3).map(lab => {
                    const totalPoints = lab.flags.reduce((sum, f) => sum + f.points, 0)
                    const foundCount = lab.flags.filter(f => isFlagFound(lab.id, f.flagKey)).length
                    const myProgress = getLabProgress(lab.id)
                    return (
                      <Card key={lab.id} className="hover:shadow-md transition-all cursor-pointer group" onClick={() => { setSelectedLab(lab); handleTabSwitch('lab-detail') }}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="font-mono text-xs">ЛР №{lab.number}</Badge>
                            <CategoryBadge category={lab.category} />
                            {myProgress?.status === 'completed' && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 gap-1 text-xs"><CheckCircle2 className="w-3 h-3" />Готово</Badge>
                            )}
                          </div>
                          <CardTitle className="text-base group-hover:text-cyan-600 transition-colors line-clamp-2">{lab.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">{lab.description}</p>
                        </CardContent>
                        <CardFooter className="pt-0 text-xs text-muted-foreground flex-wrap gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1"><Flag className="w-3 h-3" />{foundCount}/{lab.flags.length}</span>
                          <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{totalPoints} б.</span>
                          <DifficultyBadge level={lab.difficulty} />
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'labs' && <LabCatalog />}
          {activeTab === 'lab-detail' && <LabDetail />}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'tools' && <ToolsReference />}
          {activeTab === 'about' && <AboutPage />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>CyberLab — МТУСИ, Кафедра информационной безопасности</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <span className="font-medium">Дуплей Максим Игоревич · УБВТ2404</span>
              <span className="hidden sm:inline">·</span>
              <span>Защита информации от вредоносного ПО · 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
