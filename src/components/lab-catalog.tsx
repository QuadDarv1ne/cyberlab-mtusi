'use client'

import { Search, X, FileSearch, ChevronRight, Flag, Trophy, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { CategoryBadge, DifficultyBadge } from '@/components/ui/badges'
import { CATEGORY_META, DIFFICULTY_META } from '@/constants/index'
import type { Lab, DashboardData, ProgressRecord } from '@/types'

export function LabCatalog({
  filteredLabs,
  labs,
  dashboard,
  getLabProgress,
  isFlagFound,
  setSelectedLab,
  handleTabSwitch,
  catalogSearch,
  setCatalogSearch,
  catalogCategoryFilter,
  setCatalogCategoryFilter,
  catalogDifficultyFilter,
  setCatalogDifficultyFilter,
}: {
  filteredLabs: Lab[]
  labs: Lab[]
  dashboard: DashboardData | null
  getLabProgress: (labId: string) => ProgressRecord | undefined
  isFlagFound: (labId: string, flagKey: string) => boolean
  setSelectedLab: (lab: Lab) => void
  handleTabSwitch: (tab: string) => void
  catalogSearch: string
  setCatalogSearch: (v: string) => void
  catalogCategoryFilter: string
  setCatalogCategoryFilter: (v: string) => void
  catalogDifficultyFilter: string
  setCatalogDifficultyFilter: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Каталог лабораторных работ</h2>
        <Badge variant="secondary" className="text-sm">{filteredLabs.length} из {labs.length} работ</Badge>
      </div>

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
              {Array.from({ length: meta.stars }).map((_, i) => <Search key={i} className="w-3 h-3 fill-current" />)}
              {meta.label}
            </Button>
          ))}
        </div>
      </div>

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
              <Card
                key={lab.id}
                className="hover:shadow-md transition-all cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`Открыть лабораторную работу: ${lab.title}`}
                onClick={() => { setSelectedLab(lab); handleTabSwitch('lab-detail') }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedLab(lab); handleTabSwitch('lab-detail') } }}
              >
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
}
