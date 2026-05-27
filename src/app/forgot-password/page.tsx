'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: 'Ошибка',
          description: data.error,
          variant: 'destructive',
        })
        return
      }

      // Mock: show token directly instead of sending email
      setToken(data.token)
      toast({
        title: 'Токен создан',
        description: 'Используйте токен для сброса пароля (см. ниже)',
      })
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Что-то пошло не так.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Восстановление пароля</CardTitle>
          <CardDescription className="text-slate-400">
            Введите email для получения токена сброса
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@mtusi.local"
                required
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Отправка...' : 'Получить токен'}
            </Button>
            {token && (
              <div className="p-3 bg-slate-800 rounded border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Ваш токен (скопируйте):</p>
                <code className="text-xs text-green-400 break-all">{token}</code>
                <div className="mt-2">
                  <Link
                    href={`/reset-password?token=${token}`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Перейти к сбросу пароля →
                  </Link>
                </div>
              </div>
            )}
            <div className="text-center text-sm text-slate-400">
              <Link href="/login" className="hover:text-white transition-colors">
                Вернуться ко входу
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
