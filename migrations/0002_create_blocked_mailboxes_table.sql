-- Migration number: 0002 	 2026-10-20T00:00:00.000Z
-- D1 Migration: Create blocked_mailboxes table (mailbox tombstones)
--
-- When a mailbox is deleted, its name is recorded here. Incoming mail for a
-- blocked mailbox is discarded before MIME parsing/persistence, so senders can
-- no longer keep the mailbox alive or spam it after deletion.

CREATE TABLE IF NOT EXISTS blocked_mailboxes (
    mailbox TEXT PRIMARY KEY,
    blocked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Fast lookup for the email worker's per-message discard check.
CREATE INDEX IF NOT EXISTS idx_blocked_mailboxes_blocked_at ON blocked_mailboxes(blocked_at DESC);
