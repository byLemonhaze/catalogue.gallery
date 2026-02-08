import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
    }
});

const client = createClient({
    projectId: env.VITE_SANITY_PROJECT_ID || 'ebj9kqfo',
    dataset: env.VITE_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: env.VITE_SANITY_TOKEN,
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
