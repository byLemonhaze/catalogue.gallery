import { createClient } from '@sanity/client'

export const client = createClient({
    projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'ebj9kqfo',
    dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
})
