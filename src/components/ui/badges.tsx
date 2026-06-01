import { Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_META, DIFFICULTY_META } from '@/constants/index'

const DEFAULT_CATEGORY = CATEGORY_META.reconnaissance!
const DEFAULT_DIFFICULTY = DIFFICULTY_META.medium!

export function CategoryBadge({ category }: { category: string }) {
  const meta = CATEGORY_META[category] || DEFAULT_CATEGORY
  return (
    <Badge variant="outline" className={`${meta.color} gap-1`}>
      {meta.icon}
      {meta.label}
    </Badge>
  )
}

export function DifficultyBadge({ level }: { level: string }) {
  const meta = DIFFICULTY_META[level] || DEFAULT_DIFFICULTY
  return (
    <Badge variant="outline" className={`${meta.color} gap-1`}>
      {Array.from({ length: meta.stars }).map((_, i) => (
        <Star key={i} className="w-3 h-3 fill-current" />
      ))}
      {meta.label}
    </Badge>
  )
}
