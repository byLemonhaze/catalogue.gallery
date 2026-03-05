type EnvVars = Record<string, unknown>;

type SanityArtistRow = {
    id: string;
    slug?: string;
    type: 'artist' | 'gallery' | 'collector';
    name: string;
    subtitle?: string;
    websiteUrl?: string;
    thumbnailAssetUrl?: string;
};

function readEnvString(env: EnvVars, key: string) {
    const value = env[key];
    return typeof value === 'string' ? value : '';
}

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
    };
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
            ...corsHeaders(),
        },
    });
}

export const onRequestOptions: PagesFunction = async () => {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(),
    });
};

export const onRequestGet: PagesFunction<EnvVars> = async ({ request, env }) => {
    const requestUrl = new URL(request.url);
    const typeFilter = requestUrl.searchParams.get('type')?.trim().toLowerCase() || '';
    const limitParam = requestUrl.searchParams.get('limit')?.trim() || '';
    const allowedTypes = new Set(['artist', 'gallery', 'collector']);

    if (typeFilter && !allowedTypes.has(typeFilter)) {
        return jsonResponse({
            error: 'Invalid type. Use one of: artist, gallery, collector.',
        }, 400);
    }

    const parsedLimit = Number.parseInt(limitParam, 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 500) : 200;

    const projectId = (readEnvString(env, 'SANITY_PROJECT_ID') || readEnvString(env, 'VITE_SANITY_PROJECT_ID') || 'ebj9kqfo').trim();
    const dataset = (readEnvString(env, 'SANITY_DATASET') || readEnvString(env, 'VITE_SANITY_DATASET') || 'production').trim();
    const apiVersion = 'v2024-01-01';
    const siteOrigin = requestUrl.origin;

    const typeClause = typeFilter ? ` && _type == "${typeFilter}"` : '';
    const query = `*[_type in ["artist", "gallery", "collector"] && (status == "published" || !defined(status))${typeClause}] | order(name asc)[0...${limit}]{
        "id": coalesce(slug.current, _id),
        "slug": slug.current,
        "type": _type,
        name,
        subtitle,
        websiteUrl,
        "thumbnailAssetUrl": thumbnail.asset->url
    }`;

    const sanityUrl = new URL(`https://${projectId}.api.sanity.io/${apiVersion}/data/query/${dataset}`);
    sanityUrl.searchParams.set('query', query);

    try {
        const sanityRes = await fetch(sanityUrl.toString(), {
            headers: { accept: 'application/json' },
        });

        if (!sanityRes.ok) {
            return jsonResponse({
                error: `Sanity request failed (${sanityRes.status})`,
            }, 502);
        }

        const body = await sanityRes.json() as { result?: SanityArtistRow[] };
        const rows = Array.isArray(body.result) ? body.result : [];

        const artists = rows.map((row) => {
            const slug = row.slug || row.id;
            const route = row.type === 'gallery'
                ? `/gallery/${encodeURIComponent(slug)}`
                : row.type === 'artist'
                    ? `/artist/${encodeURIComponent(slug)}`
                    : '';

            return {
                id: row.id,
                slug,
                type: row.type,
                name: row.name,
                subtitle: row.subtitle || '',
                websiteUrl: row.websiteUrl || '',
                thumbnailUrl: row.thumbnailAssetUrl || `${siteOrigin}/logo.png`,
                profileUrl: route ? `${siteOrigin}${route}` : '',
            };
        });

        return jsonResponse({
            generatedAt: new Date().toISOString(),
            count: artists.length,
            artists,
        });
    } catch (error) {
        console.error('[api/artists] unexpected error:', error);
        return jsonResponse({ error: 'Unexpected server error.' }, 500);
    }
};
