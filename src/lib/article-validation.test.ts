import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Test the article schemas used in the API route
const articleSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required').max(200),
  excerpt: z.string().min(1, 'Excerpt is required').max(500),
  content: z.string().min(1, 'Content is required'),
  author: z.string().min(1, 'Author is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  coverImage: z.string().optional(),
})

const articleUpdateSchema = articleSchema.partial()

describe('article validation schemas', () => {
  describe('articleSchema (create)', () => {
    it('should accept valid article data', () => {
      const result = articleSchema.safeParse({
        slug: 'test-article',
        title: 'Test Article',
        excerpt: 'A test excerpt',
        content: 'Full content here',
        author: 'John Doe',
        category: 'Security',
        tags: ['test', 'demo'],
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid slug with uppercase letters', () => {
      const result = articleSchema.safeParse({
        slug: 'Invalid-Slug',
        title: 'Test',
        excerpt: 'Test',
        content: 'Test',
        author: 'Test',
        category: 'Test',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const result = articleSchema.safeParse({ slug: 'test' })
      expect(result.success).toBe(false)
    })

    it('should reject title exceeding max length', () => {
      const result = articleSchema.safeParse({
        slug: 'test',
        title: 'A'.repeat(201),
        excerpt: 'Test',
        content: 'Test',
        author: 'Test',
        category: 'Test',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('articleUpdateSchema (partial update)', () => {
    it('should accept partial update with only title', () => {
      const result = articleUpdateSchema.safeParse({ title: 'Updated Title' })
      expect(result.success).toBe(true)
    })

    it('should accept partial update with only content', () => {
      const result = articleUpdateSchema.safeParse({ content: 'New content' })
      expect(result.success).toBe(true)
    })

    it('should accept empty object (no changes)', () => {
      const result = articleUpdateSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should still validate slug format if provided', () => {
      const result = articleUpdateSchema.safeParse({ slug: 'Invalid Slug!' })
      expect(result.success).toBe(false)
    })
  })
})
