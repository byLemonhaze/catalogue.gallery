/**
 * Content bank utilities — shared types and DB helpers
 */

export type DraftType = 'article' | 'blog' | 'wildcard';
export type DraftStatus = 'pending' | 'published' | 'dismissed';
export type DeployTarget = 'catalogue_article' | 'catalogue_blog' | 'catalogue_interview' | 'personal_blog';

export interface ContentDraft {
    id: string;
    type: DraftType;
    title: string;
    excerpt: string;
    content: string;
    tags: string[];
    source_artist_id: string | null;
    source_artist_name: string | null;
    status: DraftStatus;
    deploy_target: DeployTarget | null;
    revision_note: string | null;
    sanity_doc_id: string | null;
    generated_at: string;
    published_at: string | null;
}

export interface ContentBankBindings {
    CONTACTS_DB: D1Database; // reuse existing D1 — content_drafts lives alongside contacts
    CLAUDE_API_KEY: string;
    CONTENT_LAB_PASSWORD: string;
    VITE_SANITY_PROJECT_ID: string;
    VITE_SANITY_DATASET: string;
    SANITY_WRITE_TOKEN: string;
}

export function generateId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function getDrafts(db: D1Database, status?: DraftStatus, limit = 100): Promise<ContentDraft[]> {
    const query = status
        ? `SELECT * FROM content_drafts WHERE status = ? ORDER BY generated_at DESC LIMIT ?`
        : `SELECT * FROM content_drafts ORDER BY generated_at DESC LIMIT ?`;
    const args = status ? [status, limit] : [limit];
    const result = await db.prepare(query).bind(...args).all<ContentDraft>();
    return (result.results || []).map(row => ({
        ...row,
        tags: JSON.parse(row.tags as unknown as string || '[]'),
    }));
}

export async function updateDraftStatus(
    db: D1Database,
    id: string,
    status: DraftStatus,
    extra: Partial<Pick<ContentDraft, 'deploy_target' | 'revision_note' | 'sanity_doc_id' | 'published_at'>> = {}
): Promise<void> {
    const sets = ['status = ?'];
    const vals: unknown[] = [status];
    if (extra.deploy_target !== undefined) { sets.push('deploy_target = ?'); vals.push(extra.deploy_target); }
    if (extra.revision_note !== undefined) { sets.push('revision_note = ?'); vals.push(extra.revision_note); }
    if (extra.sanity_doc_id !== undefined) { sets.push('sanity_doc_id = ?'); vals.push(extra.sanity_doc_id); }
    if (extra.published_at !== undefined) { sets.push('published_at = ?'); vals.push(extra.published_at); }
    vals.push(id);
    await db.prepare(`UPDATE content_drafts SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
}

export async function pruneDrafts(db: D1Database, maxTotal = 100): Promise<void> {
    // Keep newest 100 pending/published, delete oldest beyond that
    await db.prepare(`
        DELETE FROM content_drafts
        WHERE id IN (
            SELECT id FROM content_drafts
            ORDER BY generated_at DESC
            LIMIT -1 OFFSET ?
        )
    `).bind(maxTotal).run();
}
