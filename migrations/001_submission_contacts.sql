CREATE TABLE IF NOT EXISTS submission_contacts (
    id TEXT PRIMARY KEY,
    email_ciphertext TEXT NOT NULL,
    notification_count INTEGER NOT NULL DEFAULT 0,
    last_notified_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_submission_contacts_created_at
ON submission_contacts(created_at);
