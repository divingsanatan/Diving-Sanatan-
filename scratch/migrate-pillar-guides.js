const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'src', 'data', 'db.json');

// Read existing database
let db = { blogs: [], pillarGuides: [] };
if (fs.existsSync(dbPath)) {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

// 1. Remove mock pillar guides from the general blogs feed
db.blogs = (db.blogs || []).filter(blog => blog.section !== "Pillar Guides");

// 2. Define the new independent pillar guides
const initialPillarGuides = [
  {
    id: "pl-pillar-holistic-healing",
    title: "Understanding Holistic Healing",
    description: "Explore the foundations of holistic healing and how mind, body, and soul are interconnected.",
    category: "Holistic Wellness",
    readTime: "5 Articles",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267035182-skqpc64.jpg",
    articles: [
      { title: "What is Holistic Healing?", link: "/blog/what-is-healing", readTime: "5 Min Read" },
      { title: "The Mind-Body-Soul Connection", link: "/blog/the-mind-body-soul-connection", readTime: "10 Min Read" },
      { title: "Ancient Wisdom in Modern Healing", link: "/blog/ancient-wisdom-in-modern-healing", readTime: "9 Min Read" },
      { title: "Benefits of Holistic Healing", link: "/blog/benefits-of-holistic-healing", readTime: "7 Min Read" },
      { title: "Begin Your Healing Journey", link: "/blog/the-healing-journey-how-to-heal-emotionally-mentally-and-spiritually", link: "/blog/the-healing-journey-how-to-heal-emotionally-mentally-and-spiritually", readTime: "8 Min Read" }
    ]
  },
  {
    id: "pl-pillar-energy-healing",
    title: "Energy Healing & Chakras",
    description: "Dive deep into the world of energy healing and balance your chakras for optimal well-being.",
    category: "Energy Healing",
    readTime: "6 Articles",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267104691-55xlkgm.jpg",
    articles: [
      { title: "Introduction to Energy Healing", link: "/blog/introduction-to-energy-healing", readTime: "8 Min Read" },
      { title: "Understanding the 7 Chakras", link: "/blog/understanding-the-7-chakras", readTime: "12 Min Read" },
      { title: "Aura Balancing Techniques", link: "/blog/aura-balancing-techniques", readTime: "6 Min Read" },
      { title: "Reiki for Self-Healing", link: "/blog/reiki-for-self-healing", readTime: "10 Min Read" },
      { title: "Sound Therapy and Vibrations", link: "/blog/sound-therapy-and-vibrations", readTime: "7 Min Read" },
      { title: "Chakra Healing Practices", link: "/blog/chakra-healing-practices", readTime: "9 Min Read" }
    ]
  },
  {
    id: "pl-pillar-meditation-guide",
    title: "Meditation & Mindfulness",
    description: "Learn powerful meditation techniques and mindfulness practices to cultivate inner peace and clarity.",
    category: "Meditation & Mindfulness",
    readTime: "5 Articles",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1785336238738-83y5dvc.jpg",
    articles: [
      { title: "What is Meditation?", link: "/blog/what-is-meditation", readTime: "5 Min Read" },
      { title: "Mindfulness for Beginners", link: "/blog/mindfulness-for-beginners", readTime: "8 Min Read" },
      { title: "Guided Visualization Practices", link: "/blog/guided-visualization-practices", readTime: "6 Min Read" },
      { title: "Breathing Techniques for Stress", link: "/blog/breathing-techniques-for-stress", readTime: "7 Min Read" },
      { title: "Daily Mindfulness Habits", link: "/blog/daily-mindfulness-habits", readTime: "5 Min Read" }
    ]
  },
  {
    id: "pl-pillar-spiritual-growth",
    title: "Spiritual Growth & Transformation",
    description: "Embark on a journey of spiritual awakening and personal transformation through ancient practices.",
    category: "Spiritual Growth",
    readTime: "6 Articles",
    image: "https://zsfipvflmoppruxrieed.supabase.co/storage/v1/object/public/uploads/1783267123360-ej3m4ye.jpg",
    articles: [
      { title: "The Path of Spiritual Growth", link: "/blog/the-path-of-spiritual-growth", readTime: "8 Min Read" },
      { title: "Understanding Karma and Dharma", link: "/blog/understanding-karma-and-dharma", readTime: "11 Min Read" },
      { title: "Sacred Rituals for Daily Life", link: "/blog/sacred-rituals-for-daily-life", readTime: "9 Min Read" },
      { title: "Connecting with Your Higher Self", link: "/blog/connecting-with-your-higher-self", readTime: "10 Min Read" },
      { title: "Overcoming Spiritual Blocks", link: "/blog/overcoming-spiritual-blocks", readTime: "7 Min Read" },
      { title: "Transformational Mindset Shifts", link: "/blog/transformational-mindset-shifts", readTime: "6 Min Read" }
    ]
  }
];

db.pillarGuides = initialPillarGuides;

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log("Pillar guides migrated to separate database key!");
console.log("Total blogs count (clean):", db.blogs.length);
console.log("Total pillar guides count:", db.pillarGuides.length);
