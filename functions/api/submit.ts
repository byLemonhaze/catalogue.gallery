import { normalizeWebsiteUrl, isValidEmail, thumbnailError } from '../../shared/submission';
import { checkEmbedding } from './_embedCheck';
import { encryptEmail } from './_emailCipher';
import { createContact, type ContactStoreBindings } from './_contactStore';

type EnvVars = ContactStoreBindings & Record<string, unknown>;
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
    email: string;
    type: SubmissionType;
    thumbnail: FormDataEntryValue | null;
};

type SanityConfig = {
    sanityWriteToken: string;
    emailEncryptionKey: string;
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
    const textField = (key: string) => typeof formData.get(key) === 'string' ? String(formData.get(key)).trim() : '';
    const typeRaw = (textField('type') || 'artist') as SubmissionType

    return {
        name: textField('name'),
        subtitle: textField('subtitle'),
        websiteUrlInput: textField('websiteUrl'),
        email: textField('email').toLowerCase(),
        type: typeRaw,
        thumbnail: formData.get('thumbnail'),
    }
}

function validateSubmissionPayload(payload: SubmissionPayload) {
    if (!payload.name || !payload.subtitle || !payload.websiteUrlInput || !payload.email) {
        return jsonResponse({ error: 'Missing required fields: name, subtitle, websiteUrl, and email are required.' }, 400)
    }
    const imageError = thumbnailError(isFileEntry(payload.thumbnail) ? payload.thumbnail : null);
    if (imageError) return jsonResponse({ error: imageError }, 400);
    if (payload.subtitle.length > 35) return jsonResponse({ error: 'Keep the subtitle to 35 characters or fewer.' }, 400);
    if (!isValidEmail(payload.email)) {
        return jsonResponse({ error: 'Please provide a valid email address.' }, 400)
    }
    if (!allowedTypes.has(payload.type)) {
        return jsonResponse({ error: 'Invalid type. Only "artist" and "gallery" submissions are accepted.' }, 400)
    }
    return null
}

function readSanityConfig(env: EnvVars): SanityConfig {
    const sanityWriteToken = readEnvString(env, 'SANITY_WRITE_TOKEN').trim()
    const emailEncryptionKey = readEnvString(env, 'EMAIL_ENCRYPTION_KEY').trim()
    const projectId = (readEnvString(env, 'SANITY_PROJECT_ID') || readEnvString(env, 'VITE_SANITY_PROJECT_ID') || 'ebj9kqfo').trim()
    const dataset = (readEnvString(env, 'SANITY_DATASET') || readEnvString(env, 'VITE_SANITY_DATASET') || 'production').trim()

    if (!sanityWriteToken) {
        throw new Error('Server configuration error: SANITY_WRITE_TOKEN is missing.')
    }
    if (!emailEncryptionKey) {
        throw new Error('Server configuration error: EMAIL_ENCRYPTION_KEY is missing.')
    }

    return {
        sanityWriteToken,
        emailEncryptionKey,
        projectId,
        dataset,
        baseUrl: `https://${projectId}.api.sanity.io/v2024-01-01`,
    }
}

async function createSubmissionContactId(env: EnvVars, email: string, emailEncryptionKey: string) {
    const encryptedEmail = await encryptEmail(email, emailEncryptionKey)

    try {
        return await createContact(env, encryptedEmail)
    } catch (storeErr) {
        throw new Error(`Private contact storage failed: ${getErrorMessage(storeErr)}`)
    }
}

async function uploadThumbnailAsset(
    thumbnail: FormDataEntryValue | null,
    config: SanityConfig
) {
    if (!isFileEntry(thumbnail) || thumbnail.size <= 0) {
        throw new Error('A thumbnail image is required.');
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
    const assetId = asset.document?._id || asset._id;
    if (!assetId) throw new Error('Image upload did not return an asset. Please try again.');
    return assetId;
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
    contactId: string,
    imageAssetId: string
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
        contactId,
        template: 'external',
        status: 'pending',
        thumbnail: {
            _type: 'image',
            asset: {
                _type: 'reference',
                _ref: imageAssetId,
            },
        },
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

        let normalizedUrl: string;
        try {
            normalizedUrl = normalizeWebsiteUrl(payload.websiteUrlInput);
        } catch {
            return jsonResponse({ error: 'Enter a valid public HTTPS website URL.' }, 400);
        }
        const embedCheck = await checkEmbedding(normalizedUrl);
        if (embedCheck.status !== 'compatible') {
            return jsonResponse({ error: embedCheck.message, embedStatus: embedCheck.status }, embedCheck.status === 'blocked' ? 422 : 503);
        }
        const config = readSanityConfig(env)
        if (await hasDuplicateWebsiteUrl(normalizedUrl, config)) {
            return jsonResponse({ error: 'This URL is already registered.' }, 400);
        }
        const contactId = await createSubmissionContactId(env, payload.email, config.emailEncryptionKey)
        if (!contactId) {
            return jsonResponse({ error: 'Server configuration error: CONTACTS_DB binding is missing.' }, 500);
        }

        const imageAssetId = await uploadThumbnailAsset(payload.thumbnail, config)

        const doc = buildPendingSubmissionDocument(payload, normalizedUrl, contactId, imageAssetId)
        await createPendingSubmissionDocument(doc, config)

        return jsonResponse({ success: true });
    } catch (err: unknown) {
        console.error('API Submit Error:', err);
        return jsonResponse({ error: getErrorMessage(err) }, 500);
    }
};
