import { describe, expect, it } from 'vitest'
import { normalizeWebsiteUrlInput } from '../utils/websiteUrl'

describe('normalizeWebsiteUrlInput', () => {
    it('prepends https when scheme is missing', () => {
        expect(normalizeWebsiteUrlInput('example.com')).toBe('https://example.com')
        expect(normalizeWebsiteUrlInput('www.example.com/path')).toBe('https://www.example.com/path')
    })

    it('keeps http and https schemes', () => {
        expect(normalizeWebsiteUrlInput('https://example.com/')).toBe('https://example.com')
        expect(normalizeWebsiteUrlInput('http://example.com')).toBe('http://example.com')
    })

    it('returns empty for invalid input', () => {
        expect(normalizeWebsiteUrlInput('')).toBe('')
        expect(normalizeWebsiteUrlInput('https://')).toBe('')
        expect(normalizeWebsiteUrlInput('://bad')).toBe('')
    })
})
