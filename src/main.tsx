import { PublicPageContext, readPublicPageData } from './lib/publicPageData'
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HelmetProvider } from 'react-helmet-async'
import { initCloudflareWebAnalytics, initObservability } from './utils/observability'

initObservability()
initCloudflareWebAnalytics()

const publicData = readPublicPageData();
const app = (
  <StrictMode>
    <HelmetProvider>
      <PublicPageContext.Provider value={publicData}><App /></PublicPageContext.Provider>
    </HelmetProvider>
  </StrictMode>
)

const root = document.getElementById('root')!;
if (publicData && root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
