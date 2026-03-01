import { describe, it, expect } from 'vitest'
import { processArticleContent } from '../utils/linkUtils'

describe('processArticleContent', () => {
    it('returns content unchanged when entities array is empty', () => {
        expect(processArticleContent('Hello world', [])).toBe('Hello world')
    })

    it('links an artist name to /artist/:id', () => {
        const result = processArticleContent('Check out XCOPY today.', [
            { name: 'XCOPY', id: 'xcopy', type: 'artist' },
        ])
        expect(result).toBe('Check out [XCOPY](/artist/xcopy) today.')
    })

    it('links a gallery name to /gallery/:id', () => {
        const result = processArticleContent('Visit Suburbs Gallery for more.', [
            { name: 'Suburbs Gallery', id: 'suburbs-gallery', type: 'gallery' },
        ])
        expect(result).toBe('Visit [Suburbs Gallery](/gallery/suburbs-gallery) for more.')
    })

    it('links a collection name to /collection/:id', () => {
        const result = processArticleContent('Part of Counterfeit Cards collection.', [
            { name: 'Counterfeit Cards', id: 'counterfeit-cards', type: 'collection' },
        ])
        expect(result).toBe('Part of [Counterfeit Cards](/collection/counterfeit-cards) collection.')
    })

    it('defaults to /artist/:id when type is undefined', () => {
        const result = processArticleContent('XCOPY is legendary.', [
            { name: 'XCOPY', id: 'xcopy' },
        ])
        expect(result).toContain('/artist/xcopy')
    })

    it('does not double-link a name already wrapped in a markdown link', () => {
        const content = 'Check out [XCOPY](/artist/xcopy) here.'
        const result = processArticleContent(content, [
            { name: 'XCOPY', id: 'xcopy', type: 'artist' },
        ])
        // The already-linked XCOPY should not become [[XCOPY](/artist/xcopy)](/artist/xcopy)
        expect(result).toBe('Check out [XCOPY](/artist/xcopy) here.')
    })

    it('sorts entities by name length so longer names are matched first', () => {
        // "Counterfeit Cards" must be linked before "Counterfeit" is processed,
        // otherwise "Counterfeit" would greedily match inside "Counterfeit Cards".
        const result = processArticleContent(
            'I love Counterfeit Cards and also standalone Counterfeit.',
            [
                { name: 'Counterfeit', id: 'counterfeit', type: 'artist' },
                { name: 'Counterfeit Cards', id: 'counterfeit-cards', type: 'collection' },
            ]
        )
        expect(result).toContain('[Counterfeit Cards](/collection/counterfeit-cards)')
    })

    it('escapes special regex characters in entity names without throwing', () => {
        expect(() =>
            processArticleContent('Some text mentioning Art (Ltd.) here.', [
                { name: 'Art (Ltd.)', id: 'art-ltd', type: 'gallery' },
            ])
        ).not.toThrow()
    })

    it('matches entity names case-insensitively', () => {
        // Lowercase "xcopy" in content, uppercase "XCOPY" in entity list
        const result = processArticleContent('xcopy is legendary.', [
            { name: 'XCOPY', id: 'xcopy', type: 'artist' },
        ])
        expect(result).toContain('/artist/xcopy')
    })
})
