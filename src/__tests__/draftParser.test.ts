import { describe, it, expect } from 'vitest'
import { parseAndNormalizeDraft } from '../../functions/api/_draftParser'

describe('parseAndNormalizeDraft', () => {
    it('parses clean JSON payload', () => {
        const result = parseAndNormalizeDraft(
            JSON.stringify({
                title: 'Test title',
                excerpt: 'Short excerpt',
                content: '## Heading\nBody',
                tags: ['Ordinals', 'Digital Art'],
            })
        )

        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.draft.title).toBe('Test title')
        expect(result.draft.tags).toEqual(['ordinals', 'digital-art'])
    })

    it('parses JSON inside markdown fences', () => {
        const payload = [
            '```json',
            '{',
            '  "title": "Fenced",',
            '  "excerpt": "Works",',
            '  "content": "body",',
            '  "tags": ["A"]',
            '}',
            '```',
        ].join('\n')

        const result = parseAndNormalizeDraft(payload)
        expect(result.ok).toBe(true)
    })

    it('parses JSON wrapped in extra prose', () => {
        const payload = [
            'Here is your draft:',
            '{',
            '  "title": "Wrapped",',
            '  "excerpt": "Still parseable",',
            '  "content": "some markdown",',
            '  "tags": ["test-tag"]',
            '}',
            'Hope this helps!',
        ].join('\n')

        const result = parseAndNormalizeDraft(payload)
        expect(result.ok).toBe(true)
    })

    it('repairs literal newlines inside JSON strings', () => {
        const payload = `{
  "title": "Newline case",
  "excerpt": "Has raw newline",
  "content": "line one
line two",
  "tags": ["a"]
}`

        const result = parseAndNormalizeDraft(payload)
        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.draft.content).toContain('line one')
        expect(result.draft.content).toContain('line two')
    })

    it('repairs trailing commas', () => {
        const payload = `{
  "title": "Comma case",
  "excerpt": "Fix commas",
  "content": "ok",
  "tags": ["x",],
}`

        const result = parseAndNormalizeDraft(payload)
        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.draft.tags).toEqual(['x'])
    })

    it('returns invalid_shape when required fields are missing', () => {
        const result = parseAndNormalizeDraft(
            JSON.stringify({
                title: 'Only title',
                content: 'No excerpt',
                tags: [],
            })
        )

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.failure.reason).toBe('invalid_shape')
    })

    it('returns no_json_object when response is prose only', () => {
        const result = parseAndNormalizeDraft('This is plain prose without JSON.')

        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(result.failure.reason).toBe('no_json_object')
    })
})
