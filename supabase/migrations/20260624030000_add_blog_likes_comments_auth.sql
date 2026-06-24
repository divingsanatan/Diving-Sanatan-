-- Add password column to user_profiles table (nullable to allow existing quiz leads without passwords)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- Create Blog Likes Table
CREATE TABLE IF NOT EXISTS blog_likes (
    id TEXT PRIMARY KEY,
    blog_id TEXT NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_blog_user_like UNIQUE (blog_id, profile_id)
);

-- Create Blog Comments Table
CREATE TABLE IF NOT EXISTS blog_comments (
    id TEXT PRIMARY KEY,
    blog_id TEXT NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_likes_blog_id ON blog_likes(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_profile_id ON blog_likes(profile_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_blog_id ON blog_comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_profile_id ON blog_comments(profile_id);

-- Enable RLS
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Setup policies (our API endpoints use supabaseServer with service_role, but public read is good)
CREATE POLICY "Allow public SELECT on blog_likes" ON blog_likes FOR SELECT USING (true);
CREATE POLICY "Allow public INSERT on blog_likes" ON blog_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public DELETE on blog_likes" ON blog_likes FOR DELETE USING (true);

CREATE POLICY "Allow public SELECT on blog_comments" ON blog_comments FOR SELECT USING (true);
CREATE POLICY "Allow public INSERT on blog_comments" ON blog_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public DELETE on blog_comments" ON blog_comments FOR DELETE USING (true);

-- Allow admin full write access
CREATE POLICY "Allow admin write blog_likes" ON blog_likes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write blog_comments" ON blog_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
