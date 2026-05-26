'use client'

import { Target, BookOpen, Flag, CheckCircle2, AlertCircle, Lightbulb, Send, X, Search, Award, Trophy, Terminal } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { CategoryBadge, DifficultyBadge } from '@/components/ui/badges'
import type { Lab, ProgressRecord } from '@/types'

export function LabDetail({
  selectedLab,
  getLabProgress,
  isFlagFound,
  flagInputs,
  flagResults,
  revealedHints,
  submitting,
  handleTabSwitch,
  setSelectedLab,
  setFlagInputs,
  setRevealedHints,
  submitFlag,
}: {
  selectedLab: Lab
  getLabProgress: (labId: string) => ProgressRecord | undefined
  isFlagFound: (labId: string, flagKey: string) => boolean
  flagInputs: Record<string, string>
  flagResults: Record<string, { correct: boolean; message: string; alreadyFound?: boolean }>
  revealedHints: Record<string, boolean>
  submitting: Record<string, boolean>
  handleTabSwitch: (tab: string) => void
  setSelectedLab: (lab: Lab | null) => void
  setFlagInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setRevealedHints: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  submitFlag: (labId: string, flagKey: string) => Promise<void>
}) {
  const totalPoints = selectedLab.flags.reduce((sum, f) => sum + f.points, 0)
  const foundCount = selectedLab.flags.filter(f => isFlagFound(selectedLab.id, f.flagKey)).length
  const myProgress = getLabProgress(selectedLab.id)
  const noneFound = foundCount === 0 && selectedLab.flags.length > 0

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => { handleTabSwitch('labs'); setSelectedLab(null) }}>
        <X className="w-4 h-4 rotate-180" /> Назад к каталогу
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
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-cyan-500" aria-hidden="true" /> Цель работы</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{selectedLab.goal}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-cyan-500" aria-hidden="true" /> Описание</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{selectedLab.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Flag className="w-5 h-5 text-amber-500" aria-hidden="true" /> Задания и флаги</CardTitle>
              <CardDescription>Найдите флаги, чтобы получить баллы. Формат: CYBER{'{...}'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {noneFound && selectedLab.flags.length > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-dashed mb-4">
                  <Search className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
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
                        <Trophy className="w-3 h-3" aria-hidden="true" />{flag.points} б.
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

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Инструменты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedLab.tools.split(', ').map(tool => (
                  <Badge key={tool} variant="secondary" className="gap-1">
                    <Terminal className="w-3 h-3" aria-hidden="true" />{tool}
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

          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" aria-hidden="true" />
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
