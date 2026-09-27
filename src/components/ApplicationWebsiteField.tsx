import type { useEmbedCheck } from '../hooks/useEmbedCheck';

type Props = {
    value: string;
    onChange: (value: string) => void;
    check: ReturnType<typeof useEmbedCheck>;
    error?: string;
};

export function ApplicationWebsiteField({ value, onChange, check, error }: Props) {
    const invalid = Boolean(error) || check.status === 'blocked' || check.status === 'invalid';
    const noteColor = invalid ? 'text-red-400' : check.status === 'compatible' ? 'text-emerald-400' : 'text-white/50';

    return (
        <div>
            <label htmlFor="website-url" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2">Website URL</label>
            <div data-invalid={invalid} className="flex gap-3 items-end border-b border-white/15 data-[invalid=true]:border-red-400/70 focus-within:border-white/50 transition-colors">
                <input
                    type="url"
                    required
                    aria-describedby="embed-status"
                    onBlur={() => { if (check.status === 'blocked' || check.status === 'unknown') check.recheck(); }}
                    id="website-url"
                    name="websiteUrl"
                    aria-invalid={invalid}
                    value={value}
                    onChange={event => onChange(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder-white/20"
                    placeholder="https://your-website.com"
                />
            </div>
            <p id="embed-status" role="status" aria-live="polite" className={`mt-3 text-xs leading-relaxed ${noteColor}`}>
                {error || check.message}
            </p>
        </div>
    );
}
