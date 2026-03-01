-- Content drafts table for the AI content bank
CREATE TABLE IF NOT EXISTS content_drafts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('article', 'blog', 'wildcard')),
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',       -- JSON array stored as text
    source_artist_id TEXT,                 -- Sanity artist ID if artist-based
    source_artist_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'dismissed')),
    deploy_target TEXT,                    -- 'catalogue_article' | 'catalogue_blog' | 'catalogue_interview' | 'personal_blog'
    revision_note TEXT,                    -- user note for revision request
    sanity_doc_id TEXT,                    -- set after publishing to Sanity
    generated_at TEXT NOT NULL,            -- ISO timestamp
    published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_content_drafts_status ON content_drafts(status);
CREATE INDEX IF NOT EXISTS idx_content_drafts_generated_at ON content_drafts(generated_at DESC);
