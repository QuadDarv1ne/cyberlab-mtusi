import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 100

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, 'Минимум 10 символов')
  .max(PASSWORD_MAX_LENGTH, 'Максимум 100 символов')
  .regex(/[A-Z]/, 'Нужна хотя бы одна заглавная буква')
  .regex(/[a-z]/, 'Нужна хотя бы одна строчная буква')
  .regex(/[0-9]/, 'Нужна хотя бы одна цифра')
  .regex(/[^A-Za-z0-9]/, 'Нужен хотя бы один специальный символ (!@#$%^&* и т.д.)')

export function validatePassword(password: string): string | null {
  const result = passwordSchema.safeParse(password)
  if (result.success) return null
  return result.error.issues[0]?.message ?? 'Неверный пароль'
}
