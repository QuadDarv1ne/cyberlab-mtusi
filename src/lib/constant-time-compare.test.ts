import { describe, it, expect } from 'vitest'
import { constantTimeCompare } from '@/lib/constant-time-compare'

describe('constantTimeCompare', () => {
  it('returns true for identical strings', () => {
    expect(constantTimeCompare('hello', 'hello')).toBe(true)
  })

  it('returns false for different strings of same length', () => {
    expect(constantTimeCompare('hello', 'world')).toBe(false)
  })

  it('returns false for strings of different lengths', () => {
    expect(constantTimeCompare('hello', 'hell')).toBe(false)
    expect(constantTimeCompare('a', 'ab')).toBe(false)
    expect(constantTimeCompare('', 'a')).toBe(false)
  })

  it('handles empty strings', () => {
    expect(constantTimeCompare('', '')).toBe(true)
  })

  it('handles strings with single character difference', () => {
    expect(constantTimeCompare('flag123', 'flag124')).toBe(false)
    expect(constantTimeCompare('flag123', 'flag123')).toBe(true)
  })

  it('handles CTF-style flags correctly', () => {
    expect(constantTimeCompare('CYBER{osint_master}', 'CYBER{osint_master}')).toBe(true)
    expect(constantTimeCompare('CYBER{osint_master}', 'CYBER{osint_wrong}')).toBe(false)
    expect(constantTimeCompare('CYBER{sql_injection}', 'CYBER{sql_injection}')).toBe(true)
  })

  it('handles unicode characters', () => {
    expect(constantTimeCompare('привет', 'привет')).toBe(true)
    expect(constantTimeCompare('привет', 'Привет')).toBe(false)
  })

  it('handles strings differing at the beginning', () => {
    expect(constantTimeCompare('abcdef', 'xbcdef')).toBe(false)
  })

  it('handles strings differing at the end', () => {
    expect(constantTimeCompare('abcdef', 'abcdex')).toBe(false)
  })

  it('returns false for completely different strings', () => {
    expect(constantTimeCompare('correct_flag_value', 'completely_wrong')).toBe(false)
  })
})
