-- Add views column to blogs table
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Initialize existing blogs with random view counts between 1000 and 11000
UPDATE blogs SET views = floor(random() * 10000 + 1000)::integer WHERE views IS NULL OR views = 0;
