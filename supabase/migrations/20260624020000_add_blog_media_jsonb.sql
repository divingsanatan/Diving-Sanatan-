-- Add multiple images and videos columns to blogs table
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;
