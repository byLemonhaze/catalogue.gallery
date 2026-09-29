import { createClient } from '@sanity/client'
// Local previews read the public API through Vite; production uses Sanity's CDN.
const localPreview = typeof window !== 'undefined' && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
export const client = createClient({
    projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'ebj9kqfo',
    dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: !localPreview,
    ...(localPreview ? { apiHost: `${window.location.origin}/__catalogue_sanity`, useProjectHostname: false } : {}),
})
