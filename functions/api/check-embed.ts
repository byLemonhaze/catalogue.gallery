import { checkIframeCompat, IFRAME_FIX_HINT } from './_iframeCompat';

const jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

async function runCheck(rawUrl: string) {
    const trimmed = String(rawUrl || '').trim();
    if (!trimmed) {
        return jsonResponse({ ok: false, error: 'websiteUrl is required', hint: IFRAME_FIX_HINT }, 400);
    }

    const result = await checkIframeCompat(trimmed);
    return jsonResponse({
        ok: result.ok,
        url: result.url,
        reason: result.reason || null,
        hint: result.ok ? null : IFRAME_FIX_HINT,
        xFrameOptions: result.xFrameOptions ?? null,
        frameAncestors: result.frameAncestors ?? null,
    });
}

export const onRequestGet = async (context: { request: Request }) => {
    const url = new URL(context.request.url);
    return runCheck(url.searchParams.get('url') || '');
};

export const onRequestPost = async (context: { request: Request }) => {
    let rawUrl = '';
    const contentType = context.request.headers.get('content-type') || '';
    try {
        if (contentType.includes('application/json')) {
            const body = await context.request.json() as { url?: string; websiteUrl?: string };
            rawUrl = body.url || body.websiteUrl || '';
        } else if (contentType.includes('form')) {
            const form = await context.request.formData();
            rawUrl = String(form.get('url') || form.get('websiteUrl') || '');
        } else {
            rawUrl = new URL(context.request.url).searchParams.get('url') || '';
        }
    } catch {
        return jsonResponse({ ok: false, error: 'Invalid request body' }, 400);
    }
    return runCheck(rawUrl);
};
