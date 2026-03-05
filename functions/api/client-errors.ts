type ClientErrorPayload = {
    type?: string;
    message?: string;
    stack?: string;
    source?: string;
    line?: number;
    column?: number;
    pageUrl?: string;
    userAgent?: string;
    timestamp?: string;
};

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
    };
}

function trimText(input: unknown, maxLength = 1000) {
    if (typeof input !== 'string') return '';
    return input.length > maxLength ? input.slice(0, maxLength) : input;
}

export const onRequestOptions: PagesFunction = async () => {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(),
    });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
    try {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.toLowerCase().includes('application/json')) {
            return new Response(JSON.stringify({ error: 'Expected application/json' }), {
                status: 415,
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    ...corsHeaders(),
                },
            });
        }

        const body = await request.json() as ClientErrorPayload;
        const requestUrl = new URL(request.url);
        const event = {
            type: trimText(body.type, 64) || 'error',
            message: trimText(body.message, 1000) || 'Unknown client error',
            stack: trimText(body.stack, 4000),
            source: trimText(body.source, 500),
            line: typeof body.line === 'number' ? body.line : undefined,
            column: typeof body.column === 'number' ? body.column : undefined,
            pageUrl: trimText(body.pageUrl, 500),
            userAgent: trimText(body.userAgent, 500),
            timestamp: trimText(body.timestamp, 64),
            receivedAt: new Date().toISOString(),
            requestPath: requestUrl.pathname,
            cfRay: trimText(request.headers.get('cf-ray'), 128),
            cfConnectingIp: trimText(request.headers.get('cf-connecting-ip'), 128),
        };

        console.error('[client-error]', JSON.stringify(event));

        return new Response(JSON.stringify({ ok: true }), {
            status: 202,
            headers: {
                'content-type': 'application/json; charset=utf-8',
                'cache-control': 'no-store',
                ...corsHeaders(),
            },
        });
    } catch (error) {
        console.error('[client-error] parse failure:', error);
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
            status: 400,
            headers: {
                'content-type': 'application/json; charset=utf-8',
                ...corsHeaders(),
            },
        });
    }
};
