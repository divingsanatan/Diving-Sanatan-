-- Add social_links column to Practitioners Table
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
