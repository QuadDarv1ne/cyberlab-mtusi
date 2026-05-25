import Link from 'next/link'
import { Shield, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 dark:bg-slate-100">
              <Shield className="w-8 h-8 text-cyan-400 dark:text-cyan-600" />
            </div>
          </div>
          <CardTitle className="text-4xl">404</CardTitle>
          <CardDescription className="text-lg mt-2">Страница не найдена</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Запрашиваемая страница не существует или была перемещена. Вернитесь на главную страницу CyberLab.
          </p>
          <Link href="/">
            <Button className="gap-2">
              <Home className="w-4 h-4" /> На главную
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
