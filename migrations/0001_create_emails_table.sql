-- Migration number: 0001 	 2026-09-15T08:53:32.011Z
-- D1 Migration: Create emails table and indexes

CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    mailbox TEXT NOT NULL,
    domain TEXT NOT NULL,
    recipient TEXT NOT NULL,
    sender TEXT NOT NULL,
    sender_name TEXT,
    reply_to TEXT,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    has_attachments INTEGER NOT NULL DEFAULT 0,
    attachments TEXT,
    raw_size INTEGER NOT NULL DEFAULT 0,
    message_id TEXT,
    headers TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    is_junk INTEGER NOT NULL DEFAULT 0,
    received_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for querying or deleting by mailbox (e.g. 'junk', 'hi')
CREATE INDEX IF NOT EXISTS idx_emails_mailbox ON emails(mailbox);

-- Index for querying by full recipient address (e.g. 'junk@pratik.dev')
CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient);

-- Index for searching emails from a specific sender
CREATE INDEX IF NOT EXISTS idx_emails_sender ON emails(sender);

-- Composite index for fast mailbox inbox listing ordered by date
CREATE INDEX IF NOT EXISTS idx_emails_mailbox_received_at ON emails(mailbox, received_at DESC);

-- Index for chronological listing across all mailboxes
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);

-- Index for message-id lookups and deduplication
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
