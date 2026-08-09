const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'src', 'data', 'db.json');

// Read existing database
let db = { blogs: [] };
if (fs.existsSync(dbPath)) {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

// Define mock sub-blogs
const mockSubBlogs = [
  {
    id: "bl-mind-body-soul",
    slug: "the-mind-body-soul-connection",
    title: "The Mind-Body-Soul Connection",
    category: "Holistic Wellness",
    author: "Akshay Lowanshi",
    content: "<p>The connection between mind, body, and soul is the cornerstone of holistic wellness. When one aspect is out of balance, it ripples through our entire being.</p>",
    date: "2026-08-01",
    readTime: "10 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267035182-skqpc64.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-ancient-wisdom",
    slug: "ancient-wisdom-in-modern-healing",
    title: "Ancient Wisdom in Modern Healing",
    category: "Holistic Wellness",
    author: "Akshay Lowanshi",
    content: "<p>Discover how traditional healing methods from centuries ago are being validated by modern science to treat stress, chronic illness, and fatigue.</p>",
    date: "2026-08-02",
    readTime: "9 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1785336238738-83y5dvc.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-benefits-holistic",
    slug: "benefits-of-holistic-healing",
    title: "Benefits of Holistic Healing",
    category: "Holistic Wellness",
    author: "Akshay Lowanshi",
    content: "<p>Explore the long-term benefits of approaching your health from a physical, emotional, and spiritual perspective, including sustained vitality and peace.</p>",
    date: "2026-08-03",
    readTime: "7 Min Read",
    image: "https://media.cnn.com/api/v1/images/stellar/prod/220531190304-woman-meditation-stock.jpg?c=original",
    images: [],
    videos: [],
    section: null
  },
  
  // Energy & Chakras sub-blogs
  {
    id: "bl-intro-energy-healing",
    slug: "introduction-to-energy-healing",
    title: "Introduction to Energy Healing",
    category: "Energy Healing",
    author: "Akshay Lowanshi",
    content: "<p>Energy healing works on the subtle body fields to clear blockages and restore physical and mental vitality. Learn the basics today.</p>",
    date: "2026-08-04",
    readTime: "8 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267104691-55xlkgm.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-seven-chakras",
    slug: "understanding-the-7-chakras",
    title: "Understanding the 7 Chakras",
    category: "Energy Healing",
    author: "Akshay Lowanshi",
    content: "<p>Your body has seven primary energy centers. Balancing them from the Root to the Crown promotes optimal physical and emotional well-being.</p>",
    date: "2026-08-05",
    readTime: "12 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267123360-ej3m4ye.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-aura-balancing",
    slug: "aura-balancing-techniques",
    title: "Aura Balancing Techniques",
    category: "Energy Healing",
    author: "Akshay Lowanshi",
    content: "<p>An introduction to clearing your external energy field (aura) of negative influences and maintaining a positive vibrational frequency.</p>",
    date: "2026-08-06",
    readTime: "6 Min Read",
    image: "https://media.cnn.com/api/v1/images/stellar/prod/220531190304-woman-meditation-stock.jpg?c=original",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-reiki-self-healing",
    slug: "reiki-for-self-healing",
    title: "Reiki for Self-Healing",
    category: "Energy Healing",
    author: "Akshay Lowanshi",
    content: "<p>Learn simple hand positions and channeling methods to practice Reiki self-treatments for daily restoration and stress relief.</p>",
    date: "2026-08-07",
    readTime: "10 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267035182-skqpc64.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-sound-therapy",
    slug: "sound-therapy-and-vibrations",
    title: "Sound Therapy and Vibrations",
    category: "Energy Healing",
    author: "Akshay Lowanshi",
    content: "<p>Explore how acoustic frequencies and Tibetan singing bowls resonate with body water cells to induce deep meditation and healing.</p>",
    date: "2026-08-08",
    readTime: "7 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1785336238738-83y5dvc.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-chakra-practices",
    slug: "chakra-healing-practices",
    title: "Chakra Healing Practices",
    category: "Energy Healing",
    author: "Akshay Lowanshi",
    content: "<p>Daily practices including affirmations, crystals, and meditation to resolve physical and emotional blockages in active chakras.</p>",
    date: "2026-08-09",
    readTime: "9 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267104691-55xlkgm.jpg",
    images: [],
    videos: [],
    section: null
  },
  
  // Meditation sub-blogs
  {
    id: "bl-what-is-meditation",
    slug: "what-is-meditation",
    title: "What is Meditation?",
    category: "Meditation & Mindfulness",
    author: "Akshay Lowanshi",
    content: "<p>Demystifying the ancient practice of meditation: how training your awareness creates mental clarity and quietness.</p>",
    date: "2026-08-10",
    readTime: "5 Min Read",
    image: "https://media.cnn.com/api/v1/images/stellar/prod/220531190304-woman-meditation-stock.jpg?c=original",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-mindfulness-beginners",
    slug: "mindfulness-for-beginners",
    title: "Mindfulness for Beginners",
    category: "Meditation & Mindfulness",
    author: "Akshay Lowanshi",
    content: "<p>Learn how to live in the present moment throughout your busy workday using simple non-judgmental awareness exercises.</p>",
    date: "2026-08-11",
    readTime: "8 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267035182-skqpc64.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-guided-visualization",
    slug: "guided-visualization-practices",
    title: "Guided Visualization Practices",
    category: "Meditation & Mindfulness",
    author: "Akshay Lowanshi",
    content: "<p>Use creative mental imagery to reduce anxiety, manifest healing energy, and establish deep feelings of grounding.</p>",
    date: "2026-08-12",
    readTime: "6 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1785336238738-83y5dvc.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-breathing-stress",
    slug: "breathing-techniques-for-stress",
    title: "Breathing Techniques for Stress",
    category: "Meditation & Mindfulness",
    author: "Akshay Lowanshi",
    content: "<p>Science-backed pranayama and 4-7-8 breathing structures to quickly reset your nervous system and release daily stress.</p>",
    date: "2026-08-13",
    readTime: "7 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267123360-ej3m4ye.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-daily-mindfulness",
    slug: "daily-mindfulness-habits",
    title: "Daily Mindfulness Habits",
    category: "Meditation & Mindfulness",
    author: "Akshay Lowanshi",
    content: "<p>Establish small micro-habits throughout the day to remain centered, peaceful, and fully in control of your emotional reactions.</p>",
    date: "2026-08-14",
    readTime: "5 Min Read",
    image: "https://media.cnn.com/api/v1/images/stellar/prod/220531190304-woman-meditation-stock.jpg?c=original",
    images: [],
    videos: [],
    section: null
  },
  
  // Spiritual Growth sub-blogs
  {
    id: "bl-path-spiritual-growth",
    slug: "the-path-of-spiritual-growth",
    title: "The Path of Spiritual Growth",
    category: "Spiritual Growth",
    author: "Akshay Lowanshi",
    content: "<p>Understanding the stages of spiritual awakening and establishing connection with your true nature.</p>",
    date: "2026-08-15",
    readTime: "8 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267104691-55xlkgm.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-karma-dharma",
    slug: "understanding-karma-and-dharma",
    title: "Understanding Karma and Dharma",
    category: "Spiritual Growth",
    author: "Akshay Lowanshi",
    content: "<p>Demystifying Indian philosophies: how action (karma) and righteous path (dharma) shape our spiritual evolution.</p>",
    date: "2026-08-16",
    readTime: "11 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267035182-skqpc64.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-sacred-rituals",
    slug: "sacred-rituals-for-daily-life",
    title: "Sacred Rituals for Daily Life",
    category: "Spiritual Growth",
    author: "Akshay Lowanshi",
    content: "<p>Incorporate small, sacred rituals into your day to bring awareness, positive energy, and spiritual focus to your tasks.</p>",
    date: "2026-08-17",
    readTime: "9 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1785336238738-83y5dvc.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-higher-self",
    slug: "connecting-with-your-higher-self",
    title: "Connecting with Your Higher Self",
    category: "Spiritual Growth",
    author: "Akshay Lowanshi",
    content: "<p>Move past ego-driven thinking to access the intuitive wisdom and absolute peace of your higher self.</p>",
    date: "2026-08-18",
    readTime: "10 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267123360-ej3m4ye.jpg",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-spiritual-blocks",
    slug: "overcoming-spiritual-blocks",
    title: "Overcoming Spiritual Blocks",
    category: "Spiritual Growth",
    author: "Akshay Lowanshi",
    content: "<p>Learn to recognize and clear subconscious blockages, doubts, and emotional fatigue that hinder your spiritual progress.</p>",
    date: "2026-08-19",
    readTime: "7 Min Read",
    image: "https://media.cnn.com/api/v1/images/stellar/prod/220531190304-woman-meditation-stock.jpg?c=original",
    images: [],
    videos: [],
    section: null
  },
  {
    id: "bl-mindset-shifts",
    slug: "transformational-mindset-shifts",
    title: "Transformational Mindset Shifts",
    category: "Spiritual Growth",
    author: "Akshay Lowanshi",
    content: "<p>Unlock deep emotional healing by transitioning from victim mindset to conscious co-creator of your reality.</p>",
    date: "2026-08-20",
    readTime: "6 Min Read",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267104691-55xlkgm.jpg",
    images: [],
    videos: [],
    section: null
  }
];

// Define mock pillar guides linking to sub-blogs
const mockPillarGuides = [
  {
    id: "bl-pillar-holistic-healing",
    slug: "understanding-holistic-healing",
    title: "Understanding Holistic Healing",
    category: "Holistic Wellness",
    author: "Akshay Lowanshi",
    content: `
      <div>
        <p>Explore the foundations of holistic healing and how mind, body, and soul are interconnected.</p>
      </div>
      <h2>Chapters Overview</h2>
      <ul>
        <li><a href="/blog/what-is-healing">What is Holistic Healing?</a></li>
        <li><a href="/blog/the-mind-body-soul-connection">The Mind-Body-Soul Connection</a></li>
        <li><a href="/blog/ancient-wisdom-in-modern-healing">Ancient Wisdom in Modern Healing</a></li>
        <li><a href="/blog/benefits-of-holistic-healing">Benefits of Holistic Healing</a></li>
        <li><a href="/blog/the-healing-journey-how-to-heal-emotionally-mentally-and-spiritually">Begin Your Healing Journey</a></li>
      </ul>
    `,
    date: "2026-08-21",
    readTime: "5 Articles",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267035182-skqpc64.jpg",
    images: [],
    videos: [],
    section: "Pillar Guides"
  },
  {
    id: "bl-pillar-energy-healing",
    slug: "energy-healing-and-chakras",
    title: "Energy Healing & Chakras",
    category: "Energy Healing",
    author: "Akshay Lowanshi",
    content: `
      <div>
        <p>Dive deep into the world of energy healing and balance your chakras for optimal well-being.</p>
      </div>
      <h2>Chapters Overview</h2>
      <ul>
        <li><a href="/blog/introduction-to-energy-healing">Introduction to Energy Healing</a></li>
        <li><a href="/blog/understanding-the-7-chakras">Understanding the 7 Chakras</a></li>
        <li><a href="/blog/aura-balancing-techniques">Aura Balancing Techniques</a></li>
        <li><a href="/blog/reiki-for-self-healing">Reiki for Self-Healing</a></li>
        <li><a href="/blog/sound-therapy-and-vibrations">Sound Therapy and Vibrations</a></li>
        <li><a href="/blog/chakra-healing-practices">Chakra Healing Practices</a></li>
      </ul>
    `,
    date: "2026-08-22",
    readTime: "6 Articles",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267104691-55xlkgm.jpg",
    images: [],
    videos: [],
    section: "Pillar Guides"
  },
  {
    id: "bl-pillar-spiritual-growth",
    slug: "spiritual-growth-and-transformation",
    title: "Spiritual Growth & Transformation",
    category: "Spiritual Growth",
    author: "Akshay Lowanshi",
    content: `
      <div>
        <p>Embark on a journey of spiritual awakening and personal transformation through ancient practices.</p>
      </div>
      <h2>Chapters Overview</h2>
      <ul>
        <li><a href="/blog/the-path-of-spiritual-growth">The Path of Spiritual Growth</a></li>
        <li><a href="/blog/understanding-karma-and-dharma">Understanding Karma and Dharma</a></li>
        <li><a href="/blog/sacred-rituals-for-daily-life">Sacred Rituals for Daily Life</a></li>
        <li><a href="/blog/connecting-with-your-higher-self">Connecting with Your Higher Self</a></li>
        <li><a href="/blog/overcoming-spiritual-blocks">Overcoming Spiritual Blocks</a></li>
        <li><a href="/blog/transformational-mindset-shifts">Transformational Mindset Shifts</a></li>
      </ul>
    `,
    date: "2026-08-23",
    readTime: "6 Articles",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267123360-ej3m4ye.jpg",
    images: [],
    videos: [],
    section: "Pillar Guides"
  }
];

// Update Meditation & Mindfulness (bl-pillar-meditation-guide) content
const updateMeditationPillar = (blogs) => {
  const meditationPillar = blogs.find(b => b.id === "bl-pillar-meditation-guide");
  if (meditationPillar) {
    meditationPillar.title = "Meditation & Mindfulness";
    meditationPillar.category = "Meditation & Mindfulness";
    meditationPillar.readTime = "5 Articles";
    meditationPillar.content = `
      <div>
        <p>Learn powerful meditation techniques and mindfulness practices to cultivate inner peace and clarity.</p>
      </div>
      <h2>Chapters Overview</h2>
      <ul>
        <li><a href="/blog/what-is-meditation">What is Meditation?</a></li>
        <li><a href="/blog/mindfulness-for-beginners">Mindfulness for Beginners</a></li>
        <li><a href="/blog/guided-visualization-practices">Guided Visualization Practices</a></li>
        <li><a href="/blog/breathing-techniques-for-stress">Breathing Techniques for Stress</a></li>
        <li><a href="/blog/daily-mindfulness-habits">Daily Mindfulness Habits</a></li>
      </ul>
    `;
  }
};

// Filter out existing ones and push new ones
db.blogs = db.blogs || [];

// Insert sub-blogs
mockSubBlogs.forEach((blog) => {
  const exists = db.blogs.some(b => b.id === blog.id);
  if (!exists) {
    db.blogs.unshift(blog);
  }
});

// Insert pillar guides
mockPillarGuides.forEach((blog) => {
  const exists = db.blogs.some(b => b.id === blog.id);
  if (!exists) {
    db.blogs.unshift(blog);
  }
});

// Update the meditation pillar guide
updateMeditationPillar(db.blogs);

// Write database back
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log("Mock blogs added to db.json successfully!");
console.log("Total blogs now:", db.blogs.length);
