import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';

function parseEnvFile(filePath: string): Record<string, string> {
    if (!fs.existsSync(filePath)) return {};

    const parsed: Record<string, string> = {};
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const rawLine of content.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const [key, ...rest] = line.split('=');
        if (!key || rest.length === 0) continue;
        parsed[key.trim()] = rest.join('=').trim().replace(/^"(.*)"$/, '$1');
    }
    return parsed;
}

const rootDir = process.cwd();
const localEnv = {
    ...parseEnvFile(path.join(rootDir, '.env')),
    ...parseEnvFile(path.join(rootDir, '.env.local')),
};
const getEnv = (key: string) => process.env[key] || localEnv[key];

const projectId = getEnv('SANITY_PROJECT_ID') || getEnv('VITE_SANITY_PROJECT_ID') || 'ebj9kqfo';
const dataset = getEnv('SANITY_DATASET') || getEnv('VITE_SANITY_DATASET') || 'production';
const token = getEnv('SANITY_WRITE_TOKEN') || getEnv('VITE_SANITY_TOKEN');

if (!token) {
    console.error('Error: SANITY_WRITE_TOKEN (or VITE_SANITY_TOKEN) environment variable is required.');
    process.exit(1);
}

const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: false,
    token,
});

async function purgeArtists() {
    try {
        console.log('Fetching all artist documents...');
        const query = '*[_type == "artist"]';
        const artists = await client.fetch(query);

        console.log(`Found ${artists.length} documents.`);

        for (const artist of artists) {
            console.log(`Deleting artist: ${artist.name} (${artist._id})`);
            await client.delete(artist._id);
        }

        console.log('Purge complete.');
    } catch (err) {
        console.error('Purge failed:', err);
    }
}

purgeArtists();
