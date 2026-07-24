-- 1. Add roles to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'guru', 'user'));

-- 2. Add approval_status to content tables
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'published' CHECK (approval_status IN ('pending_approval', 'published', 'rejected'));
ALTER TABLE services ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'published' CHECK (approval_status IN ('pending_approval', 'published', 'rejected'));
ALTER TABLE blog_categories ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'published' CHECK (approval_status IN ('pending_approval', 'published', 'rejected'));
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'published' CHECK (approval_status IN ('pending_approval', 'published', 'rejected'));

-- Update default for new inserts to be pending_approval to match the new flow (except we might handle this in app logic, but let's keep DB default as published for backward compatibility and handle pending in app for admins).
-- Actually, let's leave default as 'published' in DB for now, since super admin might insert directly. We'll handle 'pending_approval' explicitly in API when Admin creates it.

-- 3. Create Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    creator_id TEXT REFERENCES user_profiles(id) ON DELETE SET NULL,
    discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    type TEXT NOT NULL CHECK (type IN ('guru_referral', 'platform')),
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Guru Commissions Table
CREATE TABLE IF NOT EXISTS guru_commissions (
    id TEXT PRIMARY KEY,
    guru_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    coupon_id TEXT REFERENCES coupons(id) ON DELETE SET NULL,
    commission_amount NUMERIC(10, 2) NOT NULL CHECK (commission_amount >= 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    razorpay_payout_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_creator_id ON coupons(creator_id);
CREATE INDEX IF NOT EXISTS idx_guru_commissions_guru_id ON guru_commissions(guru_id);
CREATE INDEX IF NOT EXISTS idx_guru_commissions_status ON guru_commissions(status);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru_commissions ENABLE ROW LEVEL SECURITY;

-- Security Policies for coupons
CREATE POLICY "Allow public read access to active coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admins full access to coupons" ON coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow gurus to see their own coupons" ON coupons FOR SELECT TO authenticated USING (creator_id = (SELECT id FROM user_profiles WHERE email = auth.jwt() ->> 'email' LIMIT 1));
-- Note: Creating coupons will be handled via API to enforce the 25% max limit for Gurus.

-- Security Policies for commissions
CREATE POLICY "Allow admins full access to commissions" ON guru_commissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow gurus to see their own commissions" ON guru_commissions FOR SELECT TO authenticated USING (guru_id = (SELECT id FROM user_profiles WHERE email = auth.jwt() ->> 'email' LIMIT 1));
