-- Blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public SELECT blog_categories" ON blog_categories;
CREATE POLICY "Allow public SELECT blog_categories" ON blog_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write blog_categories" ON blog_categories;
CREATE POLICY "Allow admin write blog_categories" ON blog_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default categories (idempotent)
INSERT INTO blog_categories (id, name) VALUES
  ('bcat-holisticwellness', 'Holistic Wellness'),
  ('bcat-meditationmindfulness', 'Meditation & Mindfulness'),
  ('bcat-spiritualgrowth', 'Spiritual Growth'),
  ('bcat-crystals', 'Crystals'),
  ('bcat-soundhealing', 'Sound Healing'),
  ('bcat-breathwork', 'Breathwork')
ON CONFLICT (name) DO NOTHING;
