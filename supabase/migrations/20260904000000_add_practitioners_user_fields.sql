-- Add user linkage and approval columns to practitioners table
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'published';
