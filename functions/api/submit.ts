type EnvVars = Record<string, unknown>;
type WorkerContext = { request: Request; env: EnvVars };
type SubmissionType = 'artist' | 'gallery';

type SanityErrorResponse = {
    error?: {
        message?: string;
    };
};

type SanityAssetResponse = {
    _id?: string;
    document?: {
        _id?: string;
    };
};

type SanityDuplicateQueryResponse = {
    result?: {
        _id?: string;
    };
};

type SubmissionPayload = {
    name: string;
    subtitle: string;
    websiteUrlInput: string;
    type: SubmissionType;
    thumbnail: FormDataEntryValue | null;
};

type SanityConfig = {
    sanityWriteToken: string;
    projectId: string;
    dataset: string;
    baseUrl: string;
};

const jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
};
const allowedTypes = new Set<SubmissionType>(['artist', 'gallery']);

function readEnvString(env: EnvVars, key: string) {
    const value = env[key];
    return typeof value === 'string' ? value : '';
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: jsonHeaders,
    });
}

function normalizeWebsiteUrl(rawUrl: string) {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('Only http/https website URLs are supported');
    }
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
}

function createSlug(name: string) {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return base || `entry-${Date.now()}`;
}

function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : 'Internal Server Error';
}

function isFileEntry(value: FormDataEntryValue | null): value is File {
    return typeof File !== 'undefined' && value instanceof File;
}

function parseSubmissionPayload(formData: FormData): SubmissionPayload {
    const typeRaw = String(formData.get('type') || 'artist').trim() as SubmissionType

    return {
        name: String(formData.get('name') || '').trim(),
        subtitle: String(formData.get('subtitle') || '').trim(),
        websiteUrlInput: String(formData.get('websiteUrl') || '').trim(),
        type: typeRaw,
        thumbnail: formData.get('thumbnail'),
    }
}

function validateSubmissionPayload(payload: SubmissionPayload) {
    if (!payload.name || !payload.subtitle || !payload.websiteUrlInput) {
        return jsonResponse({ error: 'Missing required fields: name, subtitle, and websiteUrl are required.' }, 400)
    }
    if (!allowedTypes.has(payload.type)) {
        return jsonResponse({ error: 'Invalid type. Only "artist" and "gallery" submissions are accepted.' }, 400)
    }
    return null
}

function readSanityConfig(env: EnvVars): SanityConfig {
    const sanityWriteToken = readEnvString(env, 'SANITY_WRITE_TOKEN').trim()
    const projectId = (readEnvString(env, 'SANITY_PROJECT_ID') || readEnvString(env, 'VITE_SANITY_PROJECT_ID') || 'ebj9kqfo').trim()
    const dataset = (readEnvString(env, 'SANITY_DATASET') || readEnvString(env, 'VITE_SANITY_DATASET') || 'production').trim()

    if (!sanityWriteToken) {
        throw new Error('Server configuration error: SANITY_WRITE_TOKEN is missing.')
    }

    return {
        sanityWriteToken,
        projectId,
        dataset,
        baseUrl: `https://${projectId}.api.sanity.io/v2024-01-01`,
    }
}

async function uploadThumbnailAsset(
    thumbnail: FormDataEntryValue | null,
    config: SanityConfig
) {
    if (!isFileEntry(thumbnail) || thumbnail.size <= 0) {
        return null
    }

    const uploadResponse = await fetch(`${config.baseUrl}/assets/images/${config.dataset}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.sanityWriteToken}`,
            'Content-Type': thumbnail.type || 'application/octet-stream',
        },
        body: thumbnail,
    })

    if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json() as SanityErrorResponse
        throw new Error(`Image upload failed: ${errorData.error?.message || uploadResponse.statusText}`)
    }

    const asset = await uploadResponse.json() as SanityAssetResponse
    return asset.document?._id || asset._id || null
}

async function hasDuplicateWebsiteUrl(normalizedUrl: string, config: SanityConfig) {
    const duplicateQuery = '*[_type in ["artist", "gallery"] && (websiteUrl == $url || websiteUrl == $url + "/")][0]{_id}'
    const checkUrl = new URL(`${config.baseUrl}/data/query/${config.dataset}`)
    checkUrl.searchParams.set('query', duplicateQuery)
    checkUrl.searchParams.set('$url', normalizedUrl)

    const checkResponse = await fetch(checkUrl.toString(), {
        headers: {
            Authorization: `Bearer ${config.sanityWriteToken}`,
        },
    })

    if (!checkResponse.ok) {
        return false
    }

    const checkData = await checkResponse.json() as SanityDuplicateQueryResponse
    return Boolean(checkData.result?._id)
}

function buildPendingSubmissionDocument(
    payload: SubmissionPayload,
    normalizedUrl: string,
    imageAssetId: string | null
) {
    return {
        _type: payload.type,
        name: payload.name,
        slug: {
            _type: 'slug',
            current: createSlug(payload.name),
        },
        subtitle: payload.subtitle,
        websiteUrl: normalizedUrl,
        template: 'external',
        status: 'pending',
        thumbnail: imageAssetId
            ? {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: imageAssetId,
                },
            }
            : undefined,
    }
}

async function createPendingSubmissionDocument(doc: Record<string, unknown>, config: SanityConfig) {
    const mutateResponse = await fetch(`${config.baseUrl}/data/mutate/${config.dataset}?returnIds=true`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.sanityWriteToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mutations: [{ create: doc }],
        }),
    })

    if (!mutateResponse.ok) {
        const errorData = await mutateResponse.json() as SanityErrorResponse
        throw new Error(`Document creation failed: ${errorData.error?.message || mutateResponse.statusText}`)
    }
}

export const onRequestPost = async (context: WorkerContext) => {
    const { request, env } = context;

    try {
        const formData = await request.formData();
        const payload = parseSubmissionPayload(formData)
        const validationError = validateSubmissionPayload(payload)
        if (validationError) {
            return validationError
        }

        const config = readSanityConfig(env)
        const normalizedUrl = normalizeWebsiteUrl(payload.websiteUrlInput);
        const imageAssetId = await uploadThumbnailAsset(payload.thumbnail, config)
        if (await hasDuplicateWebsiteUrl(normalizedUrl, config)) {
            return jsonResponse({ error: 'This URL is already registered.' }, 400);
        }

        const doc = buildPendingSubmissionDocument(payload, normalizedUrl, imageAssetId)
        await createPendingSubmissionDocument(doc, config)

        return jsonResponse({ success: true });
    } catch (err: unknown) {
        console.error('API Submit Error:', err);
        return jsonResponse({ error: getErrorMessage(err) }, 500);
    }
};
