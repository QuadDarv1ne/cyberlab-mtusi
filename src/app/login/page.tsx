'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: 'Ошибка входа',
          description: 'Неверный email или пароль',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Успешный вход', description: 'Добро пожаловать!' })
        router.push('/')
        router.refresh()
      }
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Что-то пошло не так. Попробуйте снова.',
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
          <CardTitle className="text-2xl">Вход в CyberLab</CardTitle>
          <CardDescription className="text-slate-400">
            Введите email и пароль для входа
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Пароль</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
            <div className="flex justify-between text-sm text-slate-400">
              <Link href="/register" className="hover:text-white transition-colors">
                Нет аккаунта? Регистрация
              </Link>
              <Link href="/forgot-password" className="hover:text-white transition-colors">
                Забыли пароль?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
