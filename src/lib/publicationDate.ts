// Preserve known publication dates. Creation/update timestamps are not publication dates.
export function publicationDate(iso?: string, display?: string) {
    if (iso && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(iso) && !Number.isNaN(Date.parse(iso))) return iso;
    const match = display?.match(/^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4})$/);
    if (!match) return undefined;
    const month = ['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(match[1]) + 1;
    const date = `${match[3]}-${String(month).padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    const parsed = new Date(`${date}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : undefined;
}
