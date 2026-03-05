type ErrorPayload = {
    type: 'error' | 'unhandledrejection';
    message: string;
    stack?: string;
    source?: string;
    line?: number;
    column?: number;
    pageUrl: string;
    userAgent: string;
    timestamp: string;
};

const OBS_ENDPOINT = '/api/client-errors';
let initialized = false;

function trim(input: string, max = 1000) {
    return input.length > max ? input.slice(0, max) : input;
}

function toMessage(reason: unknown) {
    if (reason instanceof Error) return reason.message;
    if (typeof reason === 'string') return reason;
    try {
        return JSON.stringify(reason);
    } catch {
        return 'Unknown rejection';
    }
}

function sendErrorPayload(payload: ErrorPayload) {
    const body = JSON.stringify(payload);
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
            const blob = new Blob([body], { type: 'application/json' });
            navigator.sendBeacon(OBS_ENDPOINT, blob);
            return;
        }
    } catch {
        // Ignore beacon failures and fall back to fetch below.
    }

    fetch(OBS_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
    }).catch(() => {
        // Avoid cascading errors if reporting itself fails.
    });
}

function basePayload(type: ErrorPayload['type']): ErrorPayload {
    const pageUrl = `${window.location.origin}${window.location.pathname}`;
    return {
        type,
        message: '',
        pageUrl,
        userAgent: navigator.userAgent || 'unknown',
        timestamp: new Date().toISOString(),
    };
}

export function initObservability() {
    if (!import.meta.env.PROD || initialized || typeof window === 'undefined') return;
    initialized = true;

    window.addEventListener('error', (event) => {
        const payload = basePayload('error');
        payload.message = trim(event.message || 'Unknown error');
        payload.stack = trim(event.error?.stack || '');
        payload.source = event.filename;
        payload.line = event.lineno;
        payload.column = event.colno;
        sendErrorPayload(payload);
    });

    window.addEventListener('unhandledrejection', (event) => {
        const payload = basePayload('unhandledrejection');
        payload.message = trim(toMessage(event.reason));
        if (event.reason instanceof Error && event.reason.stack) {
            payload.stack = trim(event.reason.stack);
        }
        sendErrorPayload(payload);
    });
}

export function initCloudflareWebAnalytics() {
    if (!import.meta.env.PROD || typeof document === 'undefined') return;

    const token = ((import.meta.env as Record<string, unknown>).VITE_CF_WEB_ANALYTICS_TOKEN || '').toString().trim();
    if (!token) return;

    const existing = document.querySelector('script[src*="static.cloudflareinsights.com/beacon.min.js"]');
    if (existing) return;

    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.setAttribute('data-cf-beacon', JSON.stringify({ token, spa: true }));
    document.head.appendChild(script);
}
