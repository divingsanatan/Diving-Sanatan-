-- Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Service Categories Join Table
CREATE TABLE IF NOT EXISTS service_categories (
    service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (service_id, category_id)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- Create Policies for Categories
CREATE POLICY "Allow public read access to categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow admin write to categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create Policies for Service Categories
CREATE POLICY "Allow public read access to service_categories" ON service_categories FOR SELECT USING (true);
CREATE POLICY "Allow admin write to service_categories" ON service_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Default Categories
INSERT INTO categories (id, name) VALUES 
('cat-1', 'Energy'),
('cat-2', 'Meditation'),
('cat-3', 'Counseling')
ON CONFLICT (name) DO NOTHING;

-- Seed Service Category Links (link existing services to their current categories)
-- Map:
-- 'Energy' -> 'cat-1'
-- 'Meditation' -> 'cat-2'
-- 'Counseling' -> 'cat-3'
INSERT INTO service_categories (service_id, category_id)
SELECT id, 'cat-1' FROM services WHERE LOWER(category) = 'energy'
ON CONFLICT DO NOTHING;

INSERT INTO service_categories (service_id, category_id)
SELECT id, 'cat-2' FROM services WHERE LOWER(category) = 'meditation'
ON CONFLICT DO NOTHING;

INSERT INTO service_categories (service_id, category_id)
SELECT id, 'cat-3' FROM services WHERE LOWER(category) = 'counseling'
ON CONFLICT DO NOTHING;
