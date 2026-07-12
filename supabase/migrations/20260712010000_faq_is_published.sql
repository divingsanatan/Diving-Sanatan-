-- FAQ Category removal and is_published flag addition
ALTER TABLE faqs DROP COLUMN IF EXISTS category;
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
