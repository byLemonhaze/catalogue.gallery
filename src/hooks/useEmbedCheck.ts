import { useCallback, useEffect, useState } from 'react';
import { normalizeWebsiteUrl, type EmbedCheckResult } from '../../shared/submission';

type CheckState = { url: string; attempt: number; result: EmbedCheckResult };

export function useEmbedCheck(input: string) {
    const [check, setCheck] = useState<CheckState | null>(null);
    const [attempt, setAttempt] = useState(0);
    const recheck = useCallback(() => setAttempt(value => value + 1), []);
    let url = '';
    try { url = normalizeWebsiteUrl(input); } catch { /* Wait for a complete public URL. */ }

    useEffect(() => {
        window.addEventListener('focus', recheck);
        return () => window.removeEventListener('focus', recheck);
    }, [recheck]);

    useEffect(() => {
        if (!url) return;
        const controller = new AbortController();
        let active = true;
        let deadline: ReturnType<typeof setTimeout>;
        const timer = setTimeout(async () => {
            deadline = setTimeout(() => controller.abort(), 12000);
            let result: EmbedCheckResult;
            try {
                const response = await fetch(`/api/check-embed?url=${encodeURIComponent(url)}`, { signal: controller.signal });
                const data = await response.json();
                if (!response.ok || !['compatible', 'blocked', 'unknown'].includes(data.status) || typeof data.message !== 'string') {
                    throw new Error('Could not check website');
                }
                result = data;
            } catch {
                result = { status: 'unknown', message: 'We couldn’t check your website. Check your connection; we’ll try again when you return to this page or leave the URL field.' };
            } finally {
                clearTimeout(deadline);
            }
            if (active) setCheck({ url, attempt, result });
        }, 600);
        return () => {
            active = false;
            clearTimeout(timer);
            clearTimeout(deadline);
            controller.abort();
        };
    }, [url, attempt]);

    if (!input.trim()) return { status: 'idle' as const, message: 'We’ll automatically check whether your website allows embedding on CATALOGUE.', recheck };
    if (!url) return { status: 'invalid' as const, message: 'Enter a complete public HTTPS website URL, such as https://your-website.com.', recheck };
    if (!check || check.url !== url || check.attempt !== attempt) return { status: 'checking' as const, message: 'Checking website embedding permissions…', recheck };
    return { ...check.result, recheck };
}
