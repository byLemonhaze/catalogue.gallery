CREATE TABLE IF NOT EXISTS contact_notifications (
    contact_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('published', 'declined')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (contact_id, status),
    FOREIGN KEY (contact_id) REFERENCES submission_contacts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contact_notifications_status
ON contact_notifications(status);
