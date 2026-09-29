import { describe, it, expect } from 'vitest';
import { selectEditorial, previewImage } from '../lib/editorial';
import type { ArticleRecord } from '../types/article';
const article = (id: string): ArticleRecord => ({ id, title: id, excerpt: id, type: 'Article', content: '', source: 'sanity', thumbnailUrl: '/logo.png', date: '', author: 'CATALOGUE' });
describe('editorial placement', () => {
    it('retains selected older writing after a new post is published', () => {
        const stories = ['new', 'old', 'other', 'four', 'five', 'six', 'seven'].map(article);
        const selection = { lead: 'old', selected: ['other'] };
        const before = selectEditorial(stories, selection);
        const after = selectEditorial([article('newest'), ...stories], selection);
        expect(after.lead?.id).toBe('old'); expect(after.selected.map(a => a.id)).toEqual(before.selected.map(a => a.id));
        expect(after.recent[0].id).toBe('newest');
    });
    it('ignores missing references and duplicates without repeating the lead', () => {
        const result = selectEditorial(['one', 'two', 'three'].map(article), { lead: 'deleted', selected: ['deleted', 'one', 'two', 'two'] });
        expect(result.lead?.id).toBe('one'); expect(result.selected.map(a => a.id)).toEqual(['two', 'three']); expect(result.recent).toEqual([]);
        expect(selectEditorial([])).toEqual({ lead: undefined, selected: [], recent: [] });
    });
    it('transforms only Sanity images and preserves external image addresses', () => {
        expect(previewImage('https://artist.example/a.png', 400)).toBe('https://artist.example/a.png');
        expect(previewImage('https://cdn.sanity.io/images/a/b/c.png', 400)).toContain('auto=format');
    });
});
