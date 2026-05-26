'use client'

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  Shield, FileText, Menu, X, Moon, Sun, GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger'
import { NAV_TABS } from '@/constants/index'
import type { Lab, StudentDb, DashboardData, FoundFlag, ProgressRecord, BlogArticle } from '@/types'

import { HeroSection } from '@/components/hero-section'
import { StatsSection } from '@/components/stats-section'
import { LabCatalog } from '@/components/lab-catalog'
import { LabDetail } from '@/components/lab-detail'
import { DashboardView } from '@/components/dashboard-view'
import { ToolsReference } from '@/components/tools-reference'
import { AboutPage } from '@/components/about-page'

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
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberlab-dark-mode')
      return saved === 'true'
    } catch {
      return false
    }
  })
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all')
  const [catalogDifficultyFilter, setCatalogDifficultyFilter] = useState<string>('all')
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null)
  const [blogSearch, setBlogSearch] = useState('')
  const [debouncedBlogSearch, setDebouncedBlogSearch] = useState('')
  const blogSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [blogCategory, setBlogCategory] = useState<string>('all')
  const [blogLoading, setBlogLoading] = useState(false)
  const [blogPage, setBlogPage] = useState(1)
  const [blogTotalPages, setBlogTotalPages] = useState(1)
  const statsRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('cyberlab-dark-mode', String(darkMode))
  }, [darkMode])

  // Debounce blog search - wait 400ms before updating search term
  useEffect(() => {
    if (blogSearchTimerRef.current) clearTimeout(blogSearchTimerRef.current)
    blogSearchTimerRef.current = setTimeout(() => {
      setDebouncedBlogSearch(blogSearch)
      setBlogPage(1)
    }, 400)
    return () => {
      if (blogSearchTimerRef.current) clearTimeout(blogSearchTimerRef.current)
    }
  }, [blogSearch])

  const selectedStudent = students[selectedStudentIdx] || null

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) observer.disconnect() },
      { threshold: 0.2 }
    )
    observer.observe(el)
    // eslint-disable-next-line consistent-return
    return () => { observer.disconnect() }
  }, [])

  const fetchLabs = useCallback(async () => {
    try {
      const res = await fetch('/api/labs')
      if (!res.ok) throw new Error(`Failed to fetch labs: ${res.status}`)
      const data = await res.json()
      setLabs(data)
    } catch (error) {
      logger.error('Failed to fetch labs:', error)
      toast({ title: 'Ошибка загрузки', description: 'Не удалось загрузить лабораторные работы.', variant: 'destructive' })
    }
  }, [toast])

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error(`Failed to fetch dashboard: ${res.status}`)
      const data = await res.json()
      setDashboard(data)
    } catch (error) {
      logger.error('Failed to fetch dashboard:', error)
      toast({ title: 'Ошибка загрузки', description: 'Не удалось загрузить статистику.', variant: 'destructive' })
    }
  }, [toast])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students')
      if (!res.ok) throw new Error(`Failed to fetch students: ${res.status}`)
      const data = await res.json()
      setStudents(data)
    } catch (error) {
      logger.error('Failed to fetch students:', error)
      toast({ title: 'Ошибка загрузки', description: 'Не удалось загрузить список студентов.', variant: 'destructive' })
    }
  }, [toast])

  const fetchProgress = useCallback(async () => {
    if (!selectedStudent) return
    try {
      const res = await fetch(`/api/progress?studentId=${selectedStudent.id}`)
      if (!res.ok) throw new Error(`Failed to fetch progress: ${res.status}`)
      const data = await res.json()
      setFoundFlags(data.found || [])
      setProgressRecords(data.progress || [])
    } catch (error) {
      logger.error('Failed to fetch progress:', error)
      toast({ title: 'Ошибка загрузки', description: 'Не удалось загрузить прогресс студента.', variant: 'destructive' })
    }
  }, [selectedStudent, toast])

  const handleTabSwitch = useCallback((tabId: string) => {
    setActiveTab(tabId)
  }, [])

  useEffect(() => {
    if (activeTab === 'dashboard' && selectedStudent) {
      fetchProgress()
    }
  }, [activeTab, selectedStudent, fetchProgress])

  const fetchArticles = useCallback(async (page: number = 1, search: string = '', category: string = 'all') => {
    setBlogLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '6' })
      if (search) params.set('search', search)
      if (category !== 'all') params.set('category', category)
      const res = await fetch(`/api/articles?${params}`)
      if (!res.ok) throw new Error(`Failed to fetch articles: ${res.status}`)
      const data = await res.json()
      setArticles(data.articles)
      setBlogPage(data.page)
      setBlogTotalPages(data.totalPages)
    } catch (error) {
      logger.error('Failed to fetch articles:', error)
      toast({ title: 'Ошибка загрузки', description: 'Не удалось загрузить статьи.', variant: 'destructive' })
    }
    setBlogLoading(false)
  }, [toast])

  useEffect(() => {
    const init = async () => {
      await fetchStudents()
      await fetchLabs()
      await fetchDashboard()
      setLoading(false)
    }
    init()
  }, [fetchLabs, fetchDashboard, fetchStudents])

  const handleBlogFetch = useCallback(async (page: number, search: string, category: string) => {
    await fetchArticles(page, search, category)
  }, [fetchArticles])

  useEffect(() => {
    if (activeTab === 'blog') {
      handleBlogFetch(blogPage, debouncedBlogSearch, blogCategory)
    }
  }, [activeTab, blogPage, debouncedBlogSearch, blogCategory, handleBlogFetch])

  const submitFlag = useCallback(async (labId: string, flagKey: string) => {
    const resultKey = `${labId}-${flagKey}`
    const flagValue = flagInputs[resultKey]
    if (!flagValue?.trim()) {
      toast({ title: 'Ошибка', description: 'Введите значение флага', variant: 'destructive' })
      return
    }
    const currentStudent = students[selectedStudentIdx]
    if (!currentStudent) {
      toast({ title: 'Ошибка', description: 'Выберите студента', variant: 'destructive' })
      return
    }

    setSubmitting(prev => ({ ...prev, [resultKey]: true }))

    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: currentStudent.id, labId, flagKey, flagValue: flagValue.trim() })
      })
      const data = await res.json()

      setFlagResults(prev => ({
        ...prev,
        [resultKey]: { correct: data.correct, message: data.message, alreadyFound: data.alreadyFound }
      }))

      if (data.correct && !data.alreadyFound) {
        toast({ title: 'Флаг принят!', description: data.message })
        await fetchProgress()
        await fetchDashboard()
      } else if (data.alreadyFound) {
        toast({ title: 'Уже найден', description: data.message })
      } else {
        toast({ title: 'Неверный флаг', description: data.message, variant: 'destructive' })
      }
    } catch (error) {
      logger.error('Flag submission error:', error)
      toast({ title: 'Ошибка', description: 'Не удалось отправить флаг', variant: 'destructive' })
    } finally {
      setSubmitting(prev => ({ ...prev, [resultKey]: false }))
    }
  }, [flagInputs, students, selectedStudentIdx, toast, fetchProgress, fetchDashboard])

  const isFlagFound = (labId: string, flagKey: string) =>
    foundFlags.some(f => f.labId === labId && f.flagKey === flagKey)

  const getLabProgress = (labId: string) =>
    progressRecords.find(p => p.labId === labId)

  const filteredLabs = useMemo(() => labs.filter(lab => {
    const matchesSearch = catalogSearch.trim() === '' ||
      lab.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      lab.description.toLowerCase().includes(catalogSearch.toLowerCase())
    const matchesCategory = catalogCategoryFilter === 'all' || lab.category === catalogCategoryFilter
    const matchesDifficulty = catalogDifficultyFilter === 'all' || lab.difficulty === catalogDifficultyFilter
    return matchesSearch && matchesCategory && matchesDifficulty
  }), [labs, catalogSearch, catalogCategoryFilter, catalogDifficultyFilter])

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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-3 cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label="Перейти на главную"
              onClick={() => handleTabSwitch('home')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTabSwitch('home') } }}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 dark:bg-slate-100">
                <Shield className="w-5 h-5 text-cyan-400 dark:text-cyan-600" aria-hidden="true" />
              </div>
              <span className="font-bold text-lg hidden sm:inline">CyberLab</span>
            </div>

            <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Основная навигация">
              {NAV_TABS.map(tab => (
                <Button key={tab.id} variant={activeTab === tab.id ? 'secondary' : 'ghost'} size="sm" className="gap-2" onClick={() => handleTabSwitch(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}>
                  {tab.icon}{tab.label}
                </Button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setDarkMode(prev => !prev)} aria-label={darkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              {selectedStudent && (
                <Badge variant="outline" className="hidden sm:flex gap-1" aria-label={`Активный студент: ${selectedStudent.name}`}>
                  <GraduationCap className="w-3 h-3" aria-hidden="true" />
                  {selectedStudent.name}
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={mobileMenuOpen}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-1" role="navigation" aria-label="Мобильное меню">
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8">
        <div className="animate-fade-in">
          {activeTab === 'home' && (
            <div className="space-y-8">
              <HeroSection onNavigate={handleTabSwitch} />
              <StatsSection dashboard={dashboard} selectedStudent={selectedStudent} statsRef={statsRef} />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Лабораторные работы</h2>
                  <Button variant="ghost" className="gap-2" onClick={() => handleTabSwitch('labs')}>Все работы</Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {labs.slice(0, 3).map(lab => {
                    const totalPoints = lab.flags.reduce((sum, f) => sum + f.points, 0)
                    const foundCount = lab.flags.filter(f => isFlagFound(lab.id, f.flagKey)).length
                    const myProgress = getLabProgress(lab.id)
                    return (
                      <div
                        key={lab.id}
                        className="hover:shadow-md transition-all cursor-pointer group p-4 rounded-lg border bg-card"
                        role="button"
                        tabIndex={0}
                        aria-label={`Открыть лабораторную работу: ${lab.title}`}
                        onClick={() => { setSelectedLab(lab); handleTabSwitch('lab-detail') }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedLab(lab); handleTabSwitch('lab-detail') } }}
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs">ЛР №{lab.number}</Badge>
                          <span className="text-xs text-muted-foreground">{lab.category}</span>
                          {myProgress?.status === 'completed' && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 gap-1 text-xs">Готово</Badge>
                          )}
                        </div>
                        <h3 className="text-base font-semibold group-hover:text-cyan-600 transition-colors line-clamp-2">{lab.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{lab.description}</p>
                        <div className="pt-2 text-xs text-muted-foreground flex-wrap gap-x-3 gap-y-1 flex">
                          <span>{foundCount}/{lab.flags.length}</span>
                          <span>{totalPoints} б.</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'labs' && (
            <LabCatalog
              filteredLabs={filteredLabs}
              labs={labs}
              dashboard={dashboard}
              getLabProgress={getLabProgress}
              isFlagFound={isFlagFound}
              setSelectedLab={setSelectedLab}
              handleTabSwitch={handleTabSwitch}
              catalogSearch={catalogSearch}
              setCatalogSearch={setCatalogSearch}
              catalogCategoryFilter={catalogCategoryFilter}
              setCatalogCategoryFilter={setCatalogCategoryFilter}
              catalogDifficultyFilter={catalogDifficultyFilter}
              setCatalogDifficultyFilter={setCatalogDifficultyFilter}
            />
          )}
          {activeTab === 'lab-detail' && selectedLab && (
            <LabDetail
              selectedLab={selectedLab}
              getLabProgress={getLabProgress}
              isFlagFound={isFlagFound}
              flagInputs={flagInputs}
              flagResults={flagResults}
              revealedHints={revealedHints}
              submitting={submitting}
              handleTabSwitch={handleTabSwitch}
              setSelectedLab={setSelectedLab}
              setFlagInputs={setFlagInputs}
              setRevealedHints={setRevealedHints}
              submitFlag={submitFlag}
            />
          )}
          {activeTab === 'dashboard' && dashboard && (
            <DashboardView
              dashboard={dashboard}
              selectedStudent={selectedStudent}
              selectedStudentIdx={selectedStudentIdx}
              students={students}
              setSelectedStudentIdx={setSelectedStudentIdx}
              labs={labs}
              progressRecords={progressRecords}
            />
          )}
          {activeTab === 'tools' && <ToolsReference />}
          {activeTab === 'blog' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-cyan-600" aria-hidden="true" />
                <h2 className="text-2xl font-bold">Блог по информационной безопасности</h2>
              </div>
              <p className="text-muted-foreground">Статьи, учебные материалы и обзоры инструментов кибербезопасности</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    placeholder="Поиск статей..."
                    className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                    value={blogSearch}
                    onChange={(e) => setBlogSearch(e.target.value)}
                    aria-label="Поиск статей"
                    role="searchbox"
                  />
                </div>
                <div className="flex gap-2 flex-wrap" role="group" aria-label="Фильтр по категории">
                  {['all', 'Кибербезопасность', 'Учебные материалы', 'Новости и обзоры'].map(cat => (
                    <Badge
                      key={cat}
                      variant={blogCategory === cat ? 'default' : 'outline'}
                      className="cursor-pointer select-none"
                      onClick={() => { setBlogCategory(cat); setBlogPage(1) }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setBlogCategory(cat); setBlogPage(1) } }}
                      aria-pressed={blogCategory === cat}
                    >
                      {cat === 'all' ? 'Все' : cat}
                    </Badge>
                  ))}
                </div>
              </div>

              {blogLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 animate-pulse rounded-lg border bg-card p-4">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12 rounded-lg border bg-card p-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
                  <h3 className="text-lg font-semibold mb-1">Статей пока нет</h3>
                  <p className="text-muted-foreground">Загляните позже — мы добавляем новые материалы</p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {articles.map(article => (
                      <div
                        key={article.id}
                        className="hover:shadow-md transition-all cursor-pointer group rounded-lg border bg-card p-4"
                        role="button"
                        tabIndex={0}
                        aria-label={`Читать статью: ${article.title}`}
                        onClick={() => setSelectedArticle(article)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedArticle(article) } }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold group-hover:text-cyan-600 transition-colors line-clamp-2">{article.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{article.author} • {new Date(article.publishedAt).toLocaleDateString('ru-RU')}</p>
                        <p className="text-sm text-muted-foreground line-clamp-3 mt-2">{article.excerpt}</p>
                        <span className="text-sm text-cyan-600 font-medium group-hover:underline mt-2 inline-block">Читать далее →</span>
                      </div>
                    ))}
                  </div>

                  {blogTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button variant="outline" size="sm" disabled={blogPage <= 1} onClick={() => setBlogPage(p => p - 1)}>Назад</Button>
                      <span className="text-sm text-muted-foreground">Стр. {blogPage} из {blogTotalPages}</span>
                      <Button variant="outline" size="sm" disabled={blogPage >= blogTotalPages} onClick={() => setBlogPage(p => p + 1)}>Вперёд</Button>
                    </div>
                  )}
                </>
              )}

              {selectedArticle && (
                <div
                  className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="article-dialog-title"
                  onClick={() => setSelectedArticle(null)}
                >
                  <div className="max-w-3xl w-full my-8 rounded-lg border bg-card" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{selectedArticle.category}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(null)} aria-label="Закрыть">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <h2 id="article-dialog-title" className="text-2xl font-bold mt-3">{selectedArticle.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{selectedArticle.author} • {new Date(selectedArticle.publishedAt).toLocaleDateString('ru-RU')}</p>
                      <div className="mt-4 space-y-3">
                        {selectedArticle.content.split('\n').map((paragraph, i) =>
                          paragraph.trim() ? <p key={`${selectedArticle.id}-p-${i}`} className="text-sm leading-relaxed">{paragraph}</p> : null
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'about' && <AboutPage />}
        </div>
      </main>

      <footer className="border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" aria-hidden="true" />
              <span>CyberLab — МТУСИ, Кафедра информационной безопасности</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <span className="font-medium">Дуплей Максим Игоревич</span>
              <span className="hidden sm:inline">·</span>
              <span>Защита информации от вредоносного ПО · 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
