import { renderToReadableStream } from 'react-dom/server.browser';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppContent } from './App';
import { PublicPageContext, type PublicPageData } from './lib/publicPageData';
export async function renderPublicPage(path: string, data: PublicPageData) {
    let renderError: unknown;
    const stream = await renderToReadableStream(
        <HelmetProvider><PublicPageContext.Provider value={data}><StaticRouter location={path}><AppContent /></StaticRouter></PublicPageContext.Provider></HelmetProvider>,
        { onError(error) { renderError = error; } },
    );
    await stream.allReady;
    if (renderError) throw renderError;
    return new Response(stream).text();
}
