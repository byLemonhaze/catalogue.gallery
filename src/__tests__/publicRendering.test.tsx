// @vitest-environment node
import { expect, it } from 'vitest';
import { renderPublicPage } from '../entry-server';
import type { PublicPageData } from '../lib/publicPageData';
import { publicationDate } from '../lib/publicationDate';
import { articleMeta, pageSchema } from '../lib/seo';
const data: PublicPageData = { artists: [{ id: 'test-artist', type: 'artist', name: 'Test Artist', subtitle: 'Digital art', websiteUrl: 'https://artist.example', thumbnail: null }], articles: [{ id: 'test-story', title: 'Test story', excerpt: 'A real story.', content: '## The work\n\nThe complete article body with an [artist link](/artist/test-artist/).', author: 'CATALOGUE', date: 'September 27, 2026', publishedAt: '2026-09-27', type: 'Article', thumbnailUrl: '/logo.png', source: 'sanity' }], editorial: null };
it('renders directory links and complete editorial text before JavaScript runs', async () => {
    const directory = await renderPublicPage('/artists/', data);
    expect(directory).toContain('href="/artist/test-artist/"');
    expect(directory).toContain('Test Artist');
    const article = await renderPublicPage('/blog/test-story/', data);
    expect(article).toContain('The complete article body');
    expect(article).toContain('href="/artist/test-artist/"');
    expect(article).not.toContain('Loading the story');
    expect(article).not.toContain('<script>');
});
it('renders homepage discovery without accessing browser storage', async () => {
    const html = await renderPublicPage('/', data);
    expect(html).toContain('href="/artist/test-artist/"');
    expect(html).toContain('A directory of digital artists');
});
it('uses recorded dates without substituting creation dates or fabricating missing dates', () => {
    expect(publicationDate(undefined, 'September 27, 2026')).toBe('2026-09-27');
    expect(publicationDate(undefined, 'February 31, 2026')).toBeUndefined();
    expect(publicationDate(undefined, 'September 2026')).toBeUndefined();
    expect(publicationDate()).toBeUndefined();
    const graph = pageSchema(articleMeta({ id: 'a', title: 'A', excerpt: 'B', displayDate: 'September 27, 2026', author: 'CATALOGUE' }))['@graph'];
    expect(graph.find(item => item['@type'] === 'Article')?.datePublished).toBe('2026-09-27');
});
