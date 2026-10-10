import { prerender } from 'react-dom/static.browser';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppContent } from './App';
import { PublicPageContext, type PublicPageData } from './lib/publicPageData';
export async function renderPublicPage(path: string, data: PublicPageData) {
    let renderError: unknown;
    const { prelude } = await prerender(
        <HelmetProvider><PublicPageContext.Provider value={data}><StaticRouter location={path}><AppContent /></StaticRouter></PublicPageContext.Provider></HelmetProvider>,
        // Return one complete document: large Suspense boundaries must not be
        // emitted as hidden segments that need an inline script to reveal them.
        { progressiveChunkSize: Infinity, onError(error) { renderError = error; } },
    );
    if (renderError) throw renderError;
    return new Response(prelude).text();
}
