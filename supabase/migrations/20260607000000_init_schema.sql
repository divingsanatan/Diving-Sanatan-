-- 1. Create Practitioners Table
CREATE TABLE IF NOT EXISTS practitioners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    bio TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Services Table
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    duration TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    practitioner TEXT NOT NULL, -- Practitioner's name string for direct display compatibility
    category TEXT NOT NULL,
    image TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    practitioner_id TEXT REFERENCES practitioners(id) ON DELETE SET NULL,
    practitioner_name TEXT NOT NULL,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    practitioner_id TEXT REFERENCES practitioners(id) ON DELETE SET NULL,
    practitioner_name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL,
    read_time TEXT NOT NULL,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_bookings_client_email ON bookings(client_email);
CREATE INDEX IF NOT EXISTS idx_reviews_practitioner_id ON reviews(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);

-- Enable Row Level Security (RLS)
ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Create Security Policies

-- Public SELECT access (Storefront operations)
CREATE POLICY "Allow public read access to practitioners" ON practitioners FOR SELECT USING (true);
CREATE POLICY "Allow public read access to services" ON services FOR SELECT USING (true);
CREATE POLICY "Allow public read access to reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public read access to blogs" ON blogs FOR SELECT USING (true);

-- Allow public insertion for Bookings (Clients booking a session) and Reviews (Clients leaving feedback)
CREATE POLICY "Allow public insert to bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to reviews" ON reviews FOR INSERT WITH CHECK (true);

-- Authenticated/Admin role full access (All operations on all tables)
-- Note: Service role (admin) automatically bypasses RLS policies in Supabase,
-- but adding policies for administrative authentication is a best practice.
CREATE POLICY "Allow admin write to practitioners" ON practitioners FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to services" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to bookings" ON bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to reviews" ON reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write to blogs" ON blogs FOR ALL TO authenticated USING (true) WITH CHECK (true);
