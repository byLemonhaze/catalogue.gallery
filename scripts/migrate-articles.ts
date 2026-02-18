import { createClient } from '@sanity/client'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { articles as legacyArticles } from '../src/data/articles'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const publicDir = path.join(rootDir, 'public')

function parseEnvFile(filePath: string): Record<string, string> {
    if (!fs.existsSync(filePath)) return {}

    const parsed: Record<string, string> = {}
    const content = fs.readFileSync(filePath, 'utf-8')
    for (const rawLine of content.split('\n')) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue
        const [key, ...rest] = line.split('=')
        if (!key || rest.length === 0) continue
        parsed[key.trim()] = rest.join('=').trim().replace(/^"(.*)"$/, '$1')
    }
    return parsed
}

const localEnv = {
    ...parseEnvFile(path.join(rootDir, '.env')),
    ...parseEnvFile(path.join(rootDir, '.env.local')),
}

const getEnv = (key: string) => process.env[key] || localEnv[key]

function readSanityCliAuthToken() {
    try {
        const configPath = path.join(os.homedir(), '.config', 'sanity', 'config.json')
        if (!fs.existsSync(configPath)) return ''
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as { authToken?: string }
        return parsed.authToken || ''
    } catch {
        return ''
    }
}

const projectId = getEnv('SANITY_PROJECT_ID') || getEnv('VITE_SANITY_PROJECT_ID') || 'ebj9kqfo'
const dataset = getEnv('SANITY_DATASET') || getEnv('VITE_SANITY_DATASET') || 'production'
const token = getEnv('SANITY_WRITE_TOKEN') || getEnv('VITE_SANITY_TOKEN') || readSanityCliAuthToken()

if (!token) {
    console.error('Error: SANITY_WRITE_TOKEN (or VITE_SANITY_TOKEN / Sanity CLI auth token) is required.')
    process.exit(1)
}

const client = createClient({
    projectId,
    dataset,
    token,
    useCdn: false,
    apiVersion: '2024-01-01',
})

function parsePublishedDate(input: string) {
    const parsed = new Date(input)
    if (Number.isNaN(parsed.getTime())) return undefined
    return parsed.toISOString()
}

function resolveLocalImagePath(thumbnail: string | undefined) {
    if (!thumbnail) return null
    if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) return null

    const normalized = thumbnail.replace(/^\/+/, '')
    const fullPath = path.join(publicDir, normalized)
    return fs.existsSync(fullPath) ? fullPath : null
}

async function uploadImageAsset(thumbnail: string | undefined) {
    const localImage = resolveLocalImagePath(thumbnail)
    const fallback = path.join(publicDir, 'logo.png')
    const imagePath = localImage || (fs.existsSync(fallback) ? fallback : null)
    if (!imagePath) return null

    const imageBuffer = fs.readFileSync(imagePath)
    const imageAsset = await client.assets.upload('image', imageBuffer, {
        filename: path.basename(imagePath),
    })

    return imageAsset._id
}

async function migrate() {
    console.log(`Migrating ${legacyArticles.length} posts into Sanity (${projectId}/${dataset})...`)

    for (let index = 0; index < legacyArticles.length; index += 1) {
        const article = legacyArticles[index]
        const docId = `post-${article.id}`
        console.log(`\n[${index + 1}/${legacyArticles.length}] ${article.id}`)

        try {
            const imageAssetId = await uploadImageAsset(article.thumbnail)

            const doc: Record<string, unknown> = {
                _id: docId,
                _type: 'post',
                title: article.title,
                slug: {
                    _type: 'slug',
                    current: article.id,
                },
                type: article.type || 'Article',
                author: article.author || 'CATALOGUE',
                displayDate: article.date || '',
                publishedAt: parsePublishedDate(article.date),
                sortOrder: index,
                excerpt: article.excerpt || '',
                content: (article.content || '').trim(),
                thumbnailPath: article.thumbnail || undefined,
                migratedFromId: article.id,
            }

            if (imageAssetId) {
                doc.thumbnail = {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: imageAssetId,
                    },
                }
            }

            await client.createOrReplace(doc as any)
            console.log(`  ✓ Upserted ${docId}`)
        } catch (error) {
            console.error(`  ✗ Failed ${docId}`, error)
        }
    }

    console.log('\nArticle migration finished.')
}

migrate().catch((error) => {
    console.error('Article migration failed:', error)
    process.exit(1)
})
