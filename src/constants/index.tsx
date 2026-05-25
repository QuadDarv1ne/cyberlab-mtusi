import React from 'react'
import { Search, Zap, Bug, Network, Shield, BookOpen, BarChart3, Terminal, FileText, Info } from 'lucide-react'

export const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  reconnaissance: { label: 'Разведка', icon: <Search className="w-4 h-4" />, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  exploitation: { label: 'Эксплуатация', icon: <Zap className="w-4 h-4" />, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  web_security: { label: 'Веб-безопасность', icon: <Bug className="w-4 h-4" />, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  network_attacks: { label: 'Сетевые атаки', icon: <Network className="w-4 h-4" />, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
}

export const DIFFICULTY_META: Record<string, { label: string; color: string; stars: number }> = {
  easy: { label: 'Лёгкий', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', stars: 1 },
  medium: { label: 'Средний', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', stars: 2 },
  hard: { label: 'Сложный', color: 'bg-red-500/10 text-red-600 border-red-500/20', stars: 3 },
}

export const NAV_TABS = [
  { id: 'home', label: 'Главная', icon: <Shield className="w-4 h-4" /> },
  { id: 'labs', label: 'Лабораторные', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'dashboard', label: 'Дашборд', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'tools', label: 'Инструменты', icon: <Terminal className="w-4 h-4" /> },
  { id: 'blog', label: 'Блог', icon: <FileText className="w-4 h-4" /> },
  { id: 'about', label: 'О проекте', icon: <Info className="w-4 h-4" /> },
]
