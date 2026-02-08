import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const projectId = process.env.VITE_SANITY_PROJECT_ID || 'ebj9kqfo';
const dataset = process.env.VITE_SANITY_DATASET || 'production';
const token = process.env.SANITY_WRITE_TOKEN;

if (!token) {
    console.error('Error: SANITY_WRITE_TOKEN environment variable is required.');
    process.exit(1);
}

const client = createClient({
    projectId,
    dataset,
    token,
    useCdn: false,
    apiVersion: '2024-01-01',
});

const artistsPath = path.join(__dirname, '../src/data/artists.json');
const publicDir = path.join(__dirname, '../public');

async function migrate() {
    console.log('Starting migration...');

    const artists = JSON.parse(fs.readFileSync(artistsPath, 'utf8'));

    for (const artist of artists) {
        console.log(`Migrating: ${artist.name}...`);

        try {
            // 1. Upload Thumbnail if it exists
            let imageAsset;
            if (artist.thumbnail && !artist.thumbnail.startsWith('http')) {
                const imagePath = path.join(publicDir, artist.thumbnail);
                if (fs.existsSync(imagePath)) {
                    const imageBuffer = fs.readFileSync(imagePath);
                    imageAsset = await client.assets.upload('image', imageBuffer, {
                        filename: path.basename(imagePath),
                    });
                    console.log(`  - Thumbnail uploaded: ${imageAsset._id}`);
                } else {
                    console.warn(`  - Warning: Thumbnail not found at ${imagePath}`);
                }
            }

            // 2. Prepare Document
            const type = artist.type === 'collection' ? 'gallery' : 'artist';

            // Generate a deterministic ID based on the original ID
            const sanityId = `migrated-${artist.id}`;

            const doc = {
                _type: type,
                _id: sanityId,
                name: artist.name,
                subtitle: artist.subtitle || '',
                websiteUrl: artist.websiteUrl,
                status: 'published',
                template: artist.template || 'external',
                slug: {
                    _type: 'slug',
                    current: artist.id,
                },
                thumbnail: imageAsset ? {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: imageAsset._id,
                    },
                } : undefined,
            };

            // 3. Create or Update
            await client.createOrReplace(doc);
            console.log(`  - Successfully synced: ${artist.name}`);

        } catch (error) {
            console.error(`  - Failed to migrate ${artist.name}:`, error);
        }
    }

    console.log('Migration complete!');
}

migrate();
