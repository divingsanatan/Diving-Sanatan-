-- Create Keywords Table
CREATE TABLE IF NOT EXISTS keywords (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Keyword Categories Join Table
CREATE TABLE IF NOT EXISTS keyword_categories (
    keyword_id TEXT REFERENCES keywords(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (keyword_id, category_id)
);

-- Create Keyword Chakras Join Table
CREATE TABLE IF NOT EXISTS keyword_chakras (
    keyword_id TEXT REFERENCES keywords(id) ON DELETE CASCADE,
    chakra TEXT NOT NULL,
    PRIMARY KEY (keyword_id, chakra)
);

-- Alter Services Table to add new fields
ALTER TABLE services ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS process JSONB DEFAULT '[]'::jsonb;

-- Enable RLS
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_chakras ENABLE ROW LEVEL SECURITY;

-- Security Policies for Keywords
DROP POLICY IF EXISTS "Allow public SELECT keywords" ON keywords;
CREATE POLICY "Allow public SELECT keywords" ON keywords FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write keywords" ON keywords;
CREATE POLICY "Allow admin write keywords" ON keywords FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Security Policies for Keyword Categories
DROP POLICY IF EXISTS "Allow public SELECT keyword_categories" ON keyword_categories;
CREATE POLICY "Allow public SELECT keyword_categories" ON keyword_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write keyword_categories" ON keyword_categories;
CREATE POLICY "Allow admin write keyword_categories" ON keyword_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Security Policies for Keyword Chakras
DROP POLICY IF EXISTS "Allow public SELECT keyword_chakras" ON keyword_chakras;
CREATE POLICY "Allow public SELECT keyword_chakras" ON keyword_chakras FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write keyword_chakras" ON keyword_chakras;
CREATE POLICY "Allow admin write keyword_chakras" ON keyword_chakras FOR ALL TO authenticated USING (true) WITH CHECK (true);
