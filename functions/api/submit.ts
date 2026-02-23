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

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : 'Internal Server Error';
}

function isFileEntry(value: FormDataEntryValue | null): value is File {
    return typeof File !== 'undefined' && value instanceof File;
}

export const onRequestPost = async (context: WorkerContext) => {
    const { request, env } = context;

    try {
        const formData = await request.formData();
        const name = String(formData.get('name') || '').trim();
        const subtitle = String(formData.get('subtitle') || '').trim();
        const websiteUrlInput = String(formData.get('websiteUrl') || '').trim();
        const email = String(formData.get('email') || '').trim().toLowerCase();
        const typeRaw = String(formData.get('type') || 'artist').trim();
        const thumbnail = formData.get('thumbnail');

        if (!name || !subtitle || !websiteUrlInput || !email) {
            return jsonResponse({ error: 'Missing required fields: name, subtitle, websiteUrl, and email are required.' }, 400);
        }
        if (!isValidEmail(email)) {
            return jsonResponse({ error: 'Please provide a valid email address.' }, 400);
        }
        if (!allowedTypes.has(typeRaw as SubmissionType)) {
            return jsonResponse({ error: 'Invalid type. Only "artist" and "gallery" submissions are accepted.' }, 400);
        }
        const type = typeRaw as SubmissionType;

        const sanityWriteToken = readEnvString(env, 'SANITY_WRITE_TOKEN').trim();
        const emailEncryptionKey = readEnvString(env, 'EMAIL_ENCRYPTION_KEY').trim();
        const projectId = (readEnvString(env, 'SANITY_PROJECT_ID') || readEnvString(env, 'VITE_SANITY_PROJECT_ID') || 'ebj9kqfo').trim();
        const dataset = (readEnvString(env, 'SANITY_DATASET') || readEnvString(env, 'VITE_SANITY_DATASET') || 'production').trim();

        if (!sanityWriteToken) {
            return jsonResponse({ error: 'Server configuration error: SANITY_WRITE_TOKEN is missing.' }, 500);
        }
        if (!emailEncryptionKey) {
            return jsonResponse({ error: 'Server configuration error: EMAIL_ENCRYPTION_KEY is missing.' }, 500);
        }

        const apiVersion = 'v2024-01-01';
        const baseUrl = `https://${projectId}.api.sanity.io/${apiVersion}`;

        const normalizedUrl = normalizeWebsiteUrl(websiteUrlInput);
        const slug = createSlug(name);
        const encryptedEmail = await encryptEmail(email, emailEncryptionKey);

        let contactId: string | null = null;
        try {
            contactId = await createContact(env, encryptedEmail);
        } catch (storeErr) {
            throw new Error(`Private contact storage failed: ${getErrorMessage(storeErr)}`);
        }
        if (!contactId) {
            return jsonResponse({ error: 'Server configuration error: CONTACTS_DB binding is missing.' }, 500);
        }

        let imageAssetId: string | null = null;

        // 1. Upload image to Sanity when provided
        if (isFileEntry(thumbnail) && thumbnail.size > 0) {
            const uploadResponse = await fetch(`${baseUrl}/assets/images/${dataset}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${sanityWriteToken}`,
                    'Content-Type': thumbnail.type || 'application/octet-stream',
                },
                body: thumbnail,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json() as SanityErrorResponse;
                throw new Error(`Image upload failed: ${errorData.error?.message || uploadResponse.statusText}`);
            }

            const asset = await uploadResponse.json() as SanityAssetResponse;
            imageAssetId = asset.document?._id || asset._id;
        }

        // 2. Check for duplicate URL across artists + galleries
        const duplicateQuery = '*[_type in ["artist", "gallery"] && (websiteUrl == $url || websiteUrl == $url + "/")][0]{_id}';
        const checkUrl = new URL(`${baseUrl}/data/query/${dataset}`);
        checkUrl.searchParams.set('query', duplicateQuery);
        checkUrl.searchParams.set('$url', normalizedUrl);

        const checkResponse = await fetch(checkUrl.toString(), {
            headers: {
                Authorization: `Bearer ${sanityWriteToken}`,
            },
        });

        if (checkResponse.ok) {
            const checkData = await checkResponse.json() as SanityDuplicateQueryResponse;
            if (checkData.result?._id) {
                return jsonResponse({ error: 'This URL is already registered.' }, 400);
            }
        }

        // 3. Create a pending review document in Sanity
        const doc = {
            _type: type,
            name,
            slug: {
                _type: 'slug',
                current: slug,
            },
            subtitle,
            websiteUrl: normalizedUrl,
            contactId,
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
        };

        const mutateResponse = await fetch(`${baseUrl}/data/mutate/${dataset}?returnIds=true`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${sanityWriteToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mutations: [{ create: doc }],
            }),
        });

        if (!mutateResponse.ok) {
            const errorData = await mutateResponse.json() as SanityErrorResponse;
            throw new Error(`Document creation failed: ${errorData.error?.message || mutateResponse.statusText}`);
        }

        return jsonResponse({ success: true });
    } catch (err: unknown) {
        console.error('API Submit Error:', err);
        return jsonResponse({ error: getErrorMessage(err) }, 500);
    }
};
