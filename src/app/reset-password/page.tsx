'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

function ResetForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const token = searchParams.get('token')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({ title: 'Ошибка', description: 'Пароли не совпадают', variant: 'destructive' })
      return
    }

    if (password.length < 10) {
      toast({ title: 'Ошибка', description: 'Минимум 10 символов', variant: 'destructive' })
      return
    }

    if (!/[A-Z]/.test(password)) {
      toast({ title: 'Ошибка', description: 'Нужна хотя бы одна заглавная буква', variant: 'destructive' })
      return
    }

    if (!/[a-z]/.test(password)) {
      toast({ title: 'Ошибка', description: 'Нужна хотя бы одна строчная буква', variant: 'destructive' })
      return
    }

    if (!/[0-9]/.test(password)) {
      toast({ title: 'Ошибка', description: 'Нужна хотя бы одна цифра', variant: 'destructive' })
      return
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      toast({ title: 'Ошибка', description: 'Нужен хотя бы один специальный символ', variant: 'destructive' })
      return
    }

    if (!token) {
      toast({ title: 'Ошибка', description: 'Токен не указан', variant: 'destructive' })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: 'Ошибка', description: data.error, variant: 'destructive' })
        return
      }

      toast({ title: 'Пароль изменён', description: 'Теперь войдите с новым паролем' })
      router.push('/login')
    } catch {
      toast({ title: 'Ошибка', description: 'Что-то пошло не так.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!token && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Токен из email</label>
          <Input
            type="text"
            placeholder="Вставьте токен сюда"
            className="bg-slate-800 border-slate-700"
            onChange={(e) => {
              const url = new URL(window.location.href)
              url.searchParams.set('token', e.target.value)
              window.history.replaceState({}, '', url)
            }}
          />
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium">Новый пароль</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Минимум 10 символов, A-Z, a-z, 0-9, спецсимвол"
          required
          minLength={10}
          className="bg-slate-800 border-slate-700"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Подтвердите пароль</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Повторите пароль"
          required
          minLength={10}
          className="bg-slate-800 border-slate-700"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Сброс...' : 'Сбросить пароль'}
      </Button>
      <div className="text-center text-sm text-slate-400">
        <Link href="/login" className="hover:text-white transition-colors">
          Вернуться ко входу
        </Link>
      </div>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Сброс пароля</CardTitle>
          <CardDescription className="text-slate-400">
            Введите новый пароль
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-slate-400">Загрузка...</div>}>
            <ResetForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
