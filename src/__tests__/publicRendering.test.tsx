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
    expect(directory).not.toContain('hidden id="S:');
    const article = await renderPublicPage('/stories/test-story/', data);
    expect(article).toContain('The complete article body');
    const byline = article.match(/<a\b(?=[^>]*rel="author")[^>]*>/)?.[0];
    expect(byline).toContain('href="/"');
    expect(article).not.toContain('href="/info/"');
    expect(article).toContain('href="/artist/test-artist/"');
    expect(article).not.toContain('Loading the story');
    expect(article).not.toContain('<script>');
    expect(article).not.toContain('hidden id="S:');
});
it('renders homepage discovery without accessing browser storage', async () => {
    const html = await renderPublicPage('/', data);
    expect(html).toContain('href="/artist/test-artist/"');
    expect(html).toContain('A place to begin digital art in the independent world');
    expect(html).not.toContain('hidden id="S:');
});
it('uses recorded dates without substituting creation dates or fabricating missing dates', () => {
    expect(publicationDate(undefined, 'September 27, 2026')).toBe('2026-09-27');
    expect(publicationDate(undefined, 'February 31, 2026')).toBeUndefined();
    expect(publicationDate(undefined, 'September 2026')).toBeUndefined();
    expect(publicationDate()).toBeUndefined();
    const graph = pageSchema(articleMeta({ id: 'a', title: 'A', excerpt: 'B', displayDate: 'September 27, 2026', author: 'CATALOGUE' }))['@graph'];
    expect(graph.find(item => item['@type'] === 'Article')?.datePublished).toBe('2026-09-27');
});
it('renders the public profile biography and entry link without mounting an iframe', async () => {
    const profileData = {...data, artists: data.artists.map(artist => ({...artist, shortBio: 'Approved public artist biography.'}))};
    const html = await renderPublicPage('/artist/test-artist/', profileData);
    expect(html).toContain('Approved public artist biography.');
    expect(html).toContain('href="/artist/test-artist/world/"');
    expect(html).not.toContain('<iframe');
    expect(html).toContain('<h1');
});

import dispatchArchive from '../data/dispatch-archive.json';
it('renders the full dispatch and every edition image without JavaScript',async()=>{
    const html=await renderPublicPage('/dispatch/2026-11-11/',{...data,dispatches:dispatchArchive});
    expect(html).toContain('In 1785 the young United States');
    expect(html).toContain('A palace turned into a camera.');
    expect(html).toContain('Expand plate 03');
    expect(html).toContain('href="/dispatch/2026-11-10/"');
    expect(html).not.toContain('hidden id="S:');
    expect(html).not.toContain('Loading page');
});
