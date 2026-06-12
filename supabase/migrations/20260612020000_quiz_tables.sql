-- Create Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'text', -- 'text' or 'choice'
    options JSONB DEFAULT '[]'::jsonb, -- Array of string options for 'choice' questions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create User Profiles (Leads) Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL, -- WhatsApp / Mobile
    gender TEXT NOT NULL,
    dob DATE NOT NULL,
    category TEXT NOT NULL, -- Selected emotion category
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create User Answers Table
CREATE TABLE IF NOT EXISTS user_answers (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    question_id TEXT REFERENCES quiz_questions(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_answers_profile_id ON user_answers(profile_id);

-- Enable RLS
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Allow public SELECT quiz_questions" ON quiz_questions FOR SELECT USING (true);
CREATE POLICY "Allow public INSERT user_profiles" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public SELECT user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public INSERT user_answers" ON user_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public SELECT user_answers" ON user_answers FOR SELECT USING (true);

-- Admin security policies (Allow all roles)
CREATE POLICY "Allow admin write quiz_questions" ON quiz_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write user_profiles" ON user_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write user_answers" ON user_answers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed initial questions for standard categories: Anxiety, Stress, Loss, Health
INSERT INTO quiz_questions (id, category, question_text, question_type, options) VALUES
('q-1', 'Anxiety', 'How long have you been experiencing this persistent anxiety?', 'choice', '["Less than a month", "1 to 6 months", "Over 6 months", "It has been years"]'),
('q-2', 'Anxiety', 'Which trigger affects your anxiety levels the most?', 'choice', '["Social gatherings", "Work deadlines / pressure", "Unclear future / uncertainty", "No specific trigger / constant anxiety"]'),
('q-3', 'Anxiety', 'Do you experience physical symptoms like palpitations or breathing difficulties?', 'choice', '["Rarely or never", "Occasionally", "Frequently", "Almost every day"]'),

('q-4', 'Stress', 'How frequently do you feel overwhelmed by your daily responsibilities?', 'choice', '["Rarely", "A few times a week", "Every day", "Constantly, even while resting"]'),
('q-5', 'Stress', 'How is stress currently impacting your sleep cycles?', 'choice', '["No impact", "Difficulty falling asleep", "Waking up in the middle of the night", "Severe insomnia"]'),
('q-6', 'Stress', 'What is your primary method for dealing with stress right now?', 'choice', '["Medication / Supplements", "Resting / Distractions", "Exercise / Yoga", "I have no effective coping method"]'),

('q-7', 'Loss', 'Since when have you been dealing with this grief or loss?', 'choice', '["Recently (less than 3 months)", "3 to 12 months ago", "More than a year ago", "It is an old grief that remains unresolved"]'),
('q-8', 'Loss', 'How is this loss affecting your connection with friends and family?', 'choice', '["I am connecting normally", "I feel slightly distant", "I am actively isolating myself", "No one around me understands"]'),
('q-9', 'Loss', 'What kind of support do you feel you need the most right now?', 'choice', '["Gentle emotional healing", "Somatic release / crying space", "Practical guidance on moving on", "Just silent listening and company"]'),

('q-10', 'Health', 'What is the primary nature of the health issue you are experiencing?', 'choice', '["Chronic physical pain", "Lack of energy / constant fatigue", "Digestive / metabolic issues", "Emotional / somatic health problems"]'),
('q-11', 'Health', 'How long have you been dealing with these physical constraints?', 'choice', '["A few weeks", "1 to 6 months", "1 to 3 years", "More than 3 years"]'),
('q-12', 'Health', 'Have you tried conventional medical treatments for this issue?', 'choice', '["Yes, and they helped slightly", "Yes, but they had no effect", "No, I prefer natural/holistic healing", "I am currently undergoing treatment"]');
