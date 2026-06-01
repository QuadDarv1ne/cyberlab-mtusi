'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/password-validation'

const passwordRules: { regex: RegExp; message: string }[] = [
  { regex: /[A-Z]/, message: 'Нужна хотя бы одна заглавная буква' },
  { regex: /[a-z]/, message: 'Нужна хотя бы одна строчная буква' },
  { regex: /[0-9]/, message: 'Нужна хотя бы одна цифра' },
  { regex: /[^A-Za-z0-9]/, message: 'Нужен хотя бы один специальный символ' },
]

function getPasswordErrors(password: string): string[] {
  const errors: string[] = []
  if (password.length < PASSWORD_MIN_LENGTH) errors.push('Минимум 10 символов')
  if (password.length > PASSWORD_MAX_LENGTH) errors.push('Максимум 100 символов')
  for (const rule of passwordRules) {
    if (!rule.regex.test(password)) errors.push(rule.message)
  }
  return errors
}

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive',
      })
      return
    }

    const errors = getPasswordErrors(password)
    if (errors.length > 0) {
      toast({
        title: 'Ошибка',
        description: errors.join('. '),
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: 'Ошибка регистрации',
          description: data.error,
          variant: 'destructive',
        })
        return
      }

      toast({ title: 'Регистрация успешна', description: 'Теперь войдите в систему' })
      router.push('/login')
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
          <CardTitle className="text-2xl">Регистрация</CardTitle>
          <CardDescription className="text-slate-400">
            Создайте аккаунт для доступа к CyberLab
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Имя</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                required
                className="bg-slate-800 border-slate-700"
              />
            </div>
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
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
            <div className="text-center text-sm text-slate-400">
              <Link href="/login" className="hover:text-white transition-colors">
                Уже есть аккаунт? Войти
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
