-- Create Expertise Table
CREATE TABLE IF NOT EXISTS expertise (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Default Expertise Options
INSERT INTO expertise (id, name) VALUES 
('exp-1', 'Astrology'),
('exp-2', 'Numerology'),
('exp-3', 'Pranic Healing'),
('exp-4', 'Reiki'),
('exp-5', 'Sound Healing'),
('exp-6', 'Crystal Healing')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS for Expertise
ALTER TABLE expertise ENABLE ROW LEVEL SECURITY;

-- Create Policies for Expertise
DROP POLICY IF EXISTS "Allow public read access to expertise" ON expertise;
CREATE POLICY "Allow public read access to expertise" ON expertise FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write to expertise" ON expertise;
CREATE POLICY "Allow admin write to expertise" ON expertise FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add fields to Practitioners Table
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS expertise JSONB DEFAULT '[]'::jsonb;
