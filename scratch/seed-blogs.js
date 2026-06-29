const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

const demoBlogs = [
  {
    id: "demo-blog-1",
    title: "7 Signs Your Heart Chakra Needs Healing",
    category: "Chakra Healing",
    author: "Elena Rostova",
    content: "Simple practices to open your heart and invite more love. When your heart chakra is blocked, you might struggle with building connections, feel isolated, or hold onto past grudges. By integrating gentle chest-opening stretches, focusing on loving-kindness meditations, and using rose quartz crystals, you can begin to restore energy flow to the Anahata center and welcome emotional abundance.",
    date: "2026-06-27",
    read_time: "5 min read",
    image: "/images/service_chakra_healing.png",
    images: [],
    videos: [],
    section: "latest"
  },
  {
    id: "demo-blog-2",
    title: "Morning Meditation Rituals for Inner Peace",
    category: "Meditation & Mindfulness",
    author: "Anara Singh",
    content: "Start your day with clarity, gratitude and calm. Creating a consistent morning meditation space helps lower baseline stress and resets your nervous system before the rush of daily demands. Spend just ten minutes focusing on diaphragmatic breaths, visualizing golden light surrounding your auric field, and setting a daily intention to ground yourself throughout lifecycle changes.",
    date: "2026-06-26",
    read_time: "4 min read",
    image: "/images/meditation_bg.png",
    images: [],
    videos: [],
    section: "latest"
  },
  {
    id: "demo-blog-3",
    title: "How Sound Frequencies Heal the Body",
    category: "Sound Healing",
    author: "Rohan Mehta",
    content: "The science and magic behind sound healing. Vibrational therapy utilizing Tibetan bowls, gongs, and tuning forks works by entraining hyperactive brainwaves to deep alpha and theta frequencies. This process triggers nitric oxide release, reduces cortisol production, and stimulates cellular-level restoration, making sound immersion one of the fastest ways to activate natural recovery.",
    date: "2026-06-25",
    read_time: "6 min read",
    image: "/images/service_sound_healing.png",
    images: [],
    videos: [],
    section: "latest"
  },
  {
    id: "demo-blog-4",
    title: "Manifest with Clarity and Compassion",
    category: "Manifestation",
    author: "Elena Rostova",
    content: "Align your intentions with your higher self. True manifestation is not just wishing for material items; it is tuning your internal energetic resonance to match abundance. Clear limiting childhood beliefs, embrace compassion for your current lifecycle, and construct clear physical checklists to manifest your visions with authentic spiritual alignment.",
    date: "2026-06-24",
    read_time: "5 min read",
    image: "/images/service_manifestation_program.png",
    images: [],
    videos: [],
    section: "latest"
  }
];

async function seed() {
  console.log("🧹 Clearing old blogs from Supabase...");
  const { error: deleteError } = await supabase.from("blogs").delete().neq("id", "keep-none");
  if (deleteError) {
    console.error("❌ Failed to clear blogs:", deleteError.message);
    process.exit(1);
  }

  console.log("🌱 Inserting 4 mockup articles...");
  const { data, error } = await supabase.from("blogs").insert(demoBlogs).select();
  if (error) {
    console.error("❌ Failed to seed demo blogs:", error.message);
  } else {
    console.log(`✅ Successfully seeded ${data.length} demo blogs!`);
  }
}

seed();
