/** Public editorial images accept HTTPS or site-relative paths, never executable/data URLs. */
export function safeImageUrl(value: unknown): string | undefined {
    if (typeof value !== 'string' || !/^(https:\/\/|\/(?!\/))/.test(value) || /[\\\s]/.test(value)) return undefined;
    try {
        const url = new URL(value, 'https://catalogue.gallery');
        if (url.protocol !== 'https:' || url.username || url.password) return undefined;
        return value.startsWith('/') ? url.pathname + url.search + url.hash : url.href;
    } catch { return undefined; }
}
