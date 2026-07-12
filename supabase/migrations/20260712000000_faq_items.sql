-- FAQ items table
CREATE TABLE IF NOT EXISTS faqs (
    id TEXT PRIMARY KEY,
    category TEXT DEFAULT '',
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS faqs_question_idx ON faqs (question);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public SELECT faqs" ON faqs;
CREATE POLICY "Allow public SELECT faqs" ON faqs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write faqs" ON faqs;
CREATE POLICY "Allow admin write faqs" ON faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default FAQ items (idempotent)
INSERT INTO faqs (id, category, question, answer, verified) VALUES
  ('prac-1', 'practices', 'How do I choose the right healing practice for me?', 'Choosing the right healing practice begins with identifying your primary goals—whether physical, emotional, or spiritual. We recommend starting with a holistic consultation or trying gentle practices like yoga or meditation to see what resonates with you.', true),
  ('prac-2', 'practices', 'Are your practices safe for beginners?', 'Yes, all of our guided practices are designed to be accessible to beginners. Our healers provide step-by-step guidance, and we encourage you to go at your own comfortable pace.', true),
  ('prac-3', 'practices', 'What is the difference between meditation and pranayama?', 'Meditation focuses on quietening the mind and cultivating mindfulness, whereas pranayama is the yogic practice of breath control. Breathwork is often used as a powerful precursor to deepen meditation states.', false),
  ('prac-4', 'practices', 'How often should I engage in guided practices?', 'For optimal benefits, we recommend daily practice, even if only for 10-15 minutes. Consistency is much more effective than doing long, infrequent sessions.', true),
  ('prac-5', 'practices', 'Do I need any special equipment for breathwork?', 'No special equipment is needed. A comfortable, quiet space to sit or lie down, a yoga mat or cushion, and comfortable clothing are all you need to start.', false),
  ('prac-6', 'practices', 'Can I practice chakra alignment on my own?', 'Yes, while professional sessions provide deep diagnostics and clearing, you can maintain your energy flow through daily meditation, using seed mantras, and visualization techniques.', true),

  ('heal-1', 'healing', 'What is holistic healing?', 'Holistic healing is an approach that considers the whole person—body, mind, emotions, and spirit. It aims to restore balance and promote overall well-being through natural practices, energy work, and mindful living.', true),
  ('heal-2', 'healing', 'What can I expect in a healing session?', 'In a standard healing session, you will discuss your history and goals, followed by a non-invasive energetic scan or alignment technique. You''ll remain fully clothed and comfortable, feeling deep relaxation, gentle warmth, or emotional release.', true),
  ('heal-3', 'healing', 'How long does it take to see results?', 'While many clients report immediate feelings of peace, stress relief, or clarity after their first session, long-term healing is a journey. Committing to a consistent 3 to 6-week practice typically yields the most profound, lasting shifts.', true),
  ('heal-4', 'healing', 'Can energy healing help with physical ailments?', 'Energy healing is a complementary therapy that helps release somatic tension and lower stress. While it does not replace medical treatment, it supports the body''s natural healing systems and improves recovery times.', false),
  ('heal-5', 'healing', 'How does distance healing work?', 'Distance healing operates on the principle that energy is not bound by space or time. The practitioner establishes a conscious connection with your energy field through focused intention and conducts the session remotely.', true),

  ('spirit-1', 'spirituality', 'What is spiritual well-being?', 'Spiritual well-being involves finding meaning, purpose, and connection in life. It doesn''t require adhering to a specific religion; it''s about connecting with your inner self, nature, or a higher consciousness.', true),
  ('spirit-2', 'spirituality', 'How does grounding help my spiritual growth?', 'Grounding anchors your energy to the Earth, helping to discharge excess emotional or mental static. It provides a stable foundation, allowing you to explore higher spiritual states without feeling spaced out.', true),
  ('spirit-3', 'spirituality', 'What is the meaning of the lotus symbol in spiritual traditions?', 'The lotus represents purity, spiritual awakening, and resilience. Just as the lotus grows in muddy water and blooms untarnished, it symbolizes the soul''s path to overcoming challenges and achieving enlightenment.', false),
  ('spirit-4', 'spirituality', 'What are Solfeggio frequencies?', 'Solfeggio frequencies are an ancient 6-tone scale of sound vibrations used in sacred music and healing. Each frequency (like 528Hz or 432Hz) is associated with specific energetic qualities, such as emotional release or transformation.', true),
  ('spirit-5', 'spirituality', 'How can I identify my primary chakra blockage?', 'Blockages often manifest physically or emotionally in areas corresponding to the chakra. For instance, difficulty speaking your truth indicates a Throat Chakra block, while feeling anxious about survival points to the Root Chakra.', true),
  ('spirit-6', 'spirituality', 'What is the role of crystals in spiritual practice?', 'Crystals act as energetic amplifiers. Their stable mineral structures vibrate at specific frequencies, which can help align and stabilize our own energy fields when held, worn, or placed nearby.', false),
  ('spirit-7', 'spirituality', 'How do I connect with my intuition?', 'Connecting with intuition requires quietening the analytical mind. Meditation, spending time in silence, journaling, and learning to trust your initial gut feelings are all effective ways to strengthen this inner guidance.', true),

  ('book-1', 'booking', 'How do I book a consultation?', 'You can book a session by clicking the ''Book a Consultation'' button at the top of the page, choosing your preferred practitioner and time slot, and completing the secure checkout process.', true),
  ('book-2', 'booking', 'What is your cancellation policy?', 'We allow free cancellations or rescheduling up to 24 hours before your scheduled session. Within 24 hours, cancellations may be subject to a 50% reservation fee.', true),
  ('book-3', 'booking', 'Can I book a session for someone else?', 'Yes, you can purchase a session as a gift. Just enter the recipient''s details during booking, or contact our support team to issue a personalized gift voucher.', false),
  ('book-4', 'booking', 'Do you offer package discounts?', 'Yes! We offer discounted bundles for 3, 5, or 10 sessions. You can browse these package options in our Services section or discuss them during your initial consultation.', true),

  ('gen-1', 'general', 'How do I contact customer support?', 'You can reach our support team by clicking ''Contact Support'' at the bottom of the page, or by emailing us directly at support@divingsanatan.com. We aim to respond within 24 hours.', true),
  ('gen-2', 'general', 'Where are you located?', 'We offer both online virtual sessions worldwide and in-person consultations at our serene wellness center in Rishikesh, India.', true),
  ('gen-3', 'general', 'Are my sessions confidential?', 'Yes, absolute confidentiality is a cornerstone of our practice. Any information shared during consultations or healing sessions remains completely private between you and your practitioner.', true),
  ('gen-4', 'general', 'Is holistic wellness suitable for all ages?', 'Yes, our gentle practices are safe and beneficial for individuals of all ages, from children to seniors. We adapt our techniques to suit the specific physical and emotional needs of each client.', false),
  ('gen-5', 'general', 'Do you offer custom wellness plans?', 'Yes, we specialize in tailoring holistic packages that combine energy healing, guided meditation, and lifestyle guidance based on your personal wellness assessment.', true)
ON CONFLICT (id) DO NOTHING;
