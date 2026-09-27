export const MAX_THUMBNAIL_BYTES = 10 * 1024 * 1024;
export const THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function thumbnailError(file: File | null): string | null {
    if (!file || file.size === 0) return 'Add a thumbnail or profile image.';
    if (!THUMBNAIL_TYPES.includes(file.type)) return 'Choose a JPG, PNG, WebP or GIF image.';
    if (file.size > MAX_THUMBNAIL_BYTES) return 'Choose an image smaller than 10 MB.';
    return null;
}

export function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function normalizeWebsiteUrl(value: string): string {
    const url = new URL(value.trim());
    // Directory frames run on HTTPS; insecure frames are blocked by browsers.
    if (url.protocol !== 'https:' || url.username || url.password || url.port) {
        throw new Error('Enter a public HTTPS website URL without a login or custom port.');
    }
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':') ||
        /(?:^|\.)(?:localhost|local|internal|test|invalid|example|onion)$/.test(host)) {
        throw new Error('Enter a public website domain.');
    }
    url.hostname = host;
    url.hash = '';
    return url.pathname === '/' && !url.search ? url.origin : url.toString();
}

export type EmbedCheckResult = {
    status: 'compatible' | 'blocked' | 'unknown';
    message: string;
};

export type ApplicationFields = { name: string; subtitle: string; websiteUrl: string; email: string };
export type ApplicationErrors = Partial<Record<keyof ApplicationFields | 'thumbnail', string>>;

export function applicationErrors(fields: ApplicationFields, image: File | null): ApplicationErrors {
    const errors: ApplicationErrors = {};
    const imageProblem = thumbnailError(image);
    if (imageProblem) errors.thumbnail = imageProblem;
    if (!fields.name.trim()) errors.name = 'Add your name.';
    if (!fields.subtitle.trim()) errors.subtitle = 'Add a subtitle.';
    else if (fields.subtitle.trim().length > 35) errors.subtitle = 'Keep the subtitle to 35 characters or fewer.';
    if (!fields.websiteUrl.trim()) errors.websiteUrl = 'Add your website URL.';
    else {
        try { normalizeWebsiteUrl(fields.websiteUrl); }
        catch { errors.websiteUrl = 'Enter a complete public HTTPS website URL.'; }
    }
    if (!fields.email.trim()) errors.email = 'Add your contact email.';
    else if (!isValidEmail(fields.email)) errors.email = 'Enter a valid contact email.';
    return errors;
}
