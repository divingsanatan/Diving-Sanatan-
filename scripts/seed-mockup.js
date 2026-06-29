const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// 1. Parse env variables from .env.local
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

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in your .env.local file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  { id: "cat-chakra-healing", name: "Chakra Healing" },
  { id: "cat-aura-energy", name: "Aura & Energy" },
  { id: "cat-meditation-mindfulness", name: "Meditation & Mindfulness" },
  { id: "cat-reiki-healing", name: "Reiki Healing" },
  { id: "cat-sound-healing", name: "Sound Healing" },
  { id: "cat-manifestation", name: "Manifestation" },
  { id: "cat-spiritual-growth", name: "Spiritual Growth" },
  { id: "cat-sacred-rituals", name: "Sacred Rituals" },
  { id: "cat-holistic-wellness", name: "Holistic Wellness" },
  { id: "cat-personal-guidance", name: "Personal Guidance" }
];

const services = [
  // --- FEATURED SERVICES ---
  {
    id: "srv-chakra-healing",
    name: "Chakra Healing",
    price: 120,
    duration: "1 Hour",
    rating: 4.9,
    practitioner: "Dr. Elara Vance",
    category: "Chakra Healing",
    image: "chakra_healing",
    description: "Balance and align your chakras for holistic well-being. Restore absolute energy flow and somatic harmony.",
    benefits: ["Balances the 7 primary energy centers", "Releases somatic tension and physical blocks", "Calms the mental state and overthinking", "Restores general vitality and emotional resilience"],
    process: ["Auric scan to diagnose blockages", "Acoustic tuning and focal crystal placement", "Energy induction for specific chakras", "Post-session integration and centering advice"]
  },
  {
    id: "srv-aura-scanning",
    name: "Aura Scanning",
    price: 100,
    duration: "1 Hour",
    rating: 4.8,
    practitioner: "Dr. Elara Vance",
    category: "Aura & Energy",
    image: "aura_scanning",
    description: "Discover your energy field and its true potential. Maps thermal stress points and auric boundary strengths.",
    benefits: ["Reveals energy leaks and blockages", "Determines chakra flow percentages", "Identifies hidden stress or emotional holding patterns", "Assists in selecting appropriate healing programs"],
    process: ["Digital aura sensor evaluation", "Visual feedback analysis with the healer", "Focal point energy mapping", "Creation of a personalized healing routine"]
  },
  {
    id: "srv-reiki-healing",
    name: "Reiki Healing",
    price: 110,
    duration: "1 Hour",
    rating: 4.9,
    practitioner: "Dr. Elara Vance",
    category: "Reiki Healing",
    image: "reiki_healing",
    description: "Restore balance and activate your natural healing power. Gentle somatic hand placement targets key stress nodes.",
    benefits: ["Promotes deep relaxation and stress relief", "Enhances body's natural self-healing capabilities", "Clears emotional blockages", "Improves overall sleep quality and mental clarity"],
    process: ["Somatic state consultation", "Energy field clearance and reiki induction", "Deep tissue thermal balancing", "Grounding and integration advice"]
  },
  {
    id: "srv-sound-healing",
    name: "Sound Healing",
    price: 130,
    duration: "1.5 Hours",
    rating: 4.8,
    practitioner: "Master Zephyr",
    category: "Sound Healing",
    image: "sound_healing",
    description: "Heal with the vibration of sound frequencies. Includes Tibetan singing bowls, gongs, and tuning forks.",
    benefits: ["Reduces stress and anxiety levels", "Soothes the autonomic nervous system", "Aligns brainwave states to theta frequency", "Encourages deep physical cellular healing"],
    process: ["Vibrational evaluation", "Tibetan singing bowl placement and playing", "Gong sound immersion and acoustic tuning", "Gentle return and integration coaching"]
  },
  {
    id: "srv-personal-guidance",
    name: "Personal Guidance",
    price: 95,
    duration: "1 Hour",
    rating: 4.9,
    practitioner: "Dr. Celeste Thorne",
    category: "Personal Guidance",
    image: "personal_guidance",
    description: "1:1 sessions tailored to your unique journey. Synthesizes psychological-spiritual techniques for life navigation.",
    benefits: ["Provides clarity on life goals and purpose", "Identifies limiting mental blockages", "Guides through emotional or relationship transitions", "Enables daily mindfulness integrations"],
    process: ["Open dialogue on current lifecycle challenges", "Spiritual-psychological blocker scanning", "Co-creation of actionable growth targets", "Guided alignment and meditation closing"]
  },

  // --- HEALING PROGRAMS ---
  {
    id: "prg-7-chakra",
    name: "7 Chakra Balancing Program",
    price: 450,
    duration: "7 Sessions",
    rating: 5.0,
    practitioner: "Dr. Elara Vance",
    category: "Chakra Healing",
    image: "chakra_program",
    description: "A complete chakra healing journey to restore energy flow and balance. Progresses session-by-session from the Root to the Crown.",
    benefits: ["Thorough healing of all 7 energy centers", "Deep emotional clearing and trauma release", "Establishment of strong energy boundaries", "Permanent daily maintenance routine development"],
    process: ["Root & Sacral clearance", "Solar Plexus & Heart alignment", "Throat & Third Eye stabilization", "Crown integration and final full body scan"]
  },
  {
    id: "prg-21-days-meditation",
    name: "21 Days Meditation Program",
    price: 199,
    duration: "21 Days",
    rating: 4.9,
    practitioner: "Master Zephyr",
    category: "Meditation & Mindfulness",
    image: "meditation_program",
    description: "Build a consistent meditation habit and transform your inner world. Includes daily live guidance and breath techniques.",
    benefits: ["Instills a lifelong daily meditation practice", "Improves focus, attention, and emotional stability", "Reduces baseline cortisol and blood pressure", "Develops a calm center accessible at any moment"],
    process: ["Basic breathing & grounding (Days 1-7)", "Concentration & awareness expansion (Days 8-14)", "Transcendence & lifestyle integration (Days 15-21)"]
  },
  {
    id: "prg-full-moon",
    name: "Full Moon Healing Program",
    price: 299,
    duration: "4 Sessions",
    rating: 4.9,
    practitioner: "Dr. Elara Vance",
    category: "Aura & Energy",
    image: "full_moon_program",
    description: "Release, renew and realign with the powerful energy of the full moon. Harness lunar cycles to shed old karmic attachments.",
    benefits: ["Releases deep subconscious attachments", "Accentuates intuition and dream-state awareness", "Recharges emotional and spiritual energies", "Aligns actions to natural universal rhythms"],
    process: ["Intention setting & cord cutting (Waxing)", "Full Moon acoustic and reiki immersion", "Release & shadow work integration (Waning)", "New Moon renewal and seeding of targets"]
  },
  {
    id: "prg-manifestation",
    name: "Manifestation Mastery",
    price: 399,
    duration: "6 Sessions",
    rating: 5.0,
    practitioner: "Dr. Celeste Thorne",
    category: "Manifestation",
    image: "manifestation_program",
    description: "Align your energy and intentions to manifest your dream life. Focuses on rewiring belief systems and abundance tuning.",
    benefits: ["Rewrites limiting abundance beliefs", "Clarifies vision and goal alignments", "Tunes energy field to the frequency of abundance", "Provides concrete physical action checklists"],
    process: ["Identifying core abundance blockages", "Rewriting mental blueprints & shadow clearing", "Visual-auditory manifestation techniques", "Integration with physical daily planning"]
  }
];

const serviceCategoryMappings = [
  { service_id: "srv-chakra-healing", category_id: "cat-chakra-healing" },
  { service_id: "srv-aura-scanning", category_id: "cat-aura-energy" },
  { service_id: "srv-reiki-healing", category_id: "cat-reiki-healing" },
  { service_id: "srv-sound-healing", category_id: "cat-sound-healing" },
  { service_id: "srv-personal-guidance", category_id: "cat-personal-guidance" },
  
  { service_id: "prg-7-chakra", category_id: "cat-chakra-healing" },
  { service_id: "prg-21-days-meditation", category_id: "cat-meditation-mindfulness" },
  { service_id: "prg-full-moon", category_id: "cat-aura-energy" },
  { service_id: "prg-manifestation", category_id: "cat-manifestation" }
];

async function seed() {
  console.log("🌱 Starting Database Seed for Mockup...");

  // 1. Seed Categories
  console.log("\n📁 Seeding categories...");
  for (const cat of categories) {
    const { error } = await supabase
      .from("categories")
      .upsert(cat, { onConflict: "name" });
    if (error) {
      console.error(`❌ Failed to seed category ${cat.name}:`, error.message);
    } else {
      console.log(`✅ Category seeded: ${cat.name}`);
    }
  }

  // Fetch all categories to get accurate IDs if they differ (though we supply deterministic ids)
  const { data: dbCats, error: catFetchError } = await supabase.from("categories").select("*");
  if (catFetchError || !dbCats) {
    console.error("❌ Failed to fetch categories from database:", catFetchError?.message);
    process.exit(1);
  }

  // Create a mapping of category name to category ID
  const catNameToId = {};
  dbCats.forEach(c => {
    catNameToId[c.name.toLowerCase()] = c.id;
  });

  // 2. Seed Services
  console.log("\n💼 Seeding services...");
  for (const srv of services) {
    const dbSrv = {
      id: srv.id,
      name: srv.name,
      price: srv.price,
      duration: srv.duration,
      rating: srv.rating,
      practitioner: srv.practitioner,
      category: srv.category,
      image: srv.image,
      description: srv.description,
      benefits: srv.benefits,
      process: srv.process
    };

    const { error } = await supabase
      .from("services")
      .upsert(dbSrv, { onConflict: "id" });
      
    if (error) {
      console.error(`❌ Failed to seed service ${srv.name}:`, error.message);
    } else {
      console.log(`✅ Service seeded: ${srv.name}`);
    }
  }

  // 3. Seed Service Category mappings
  console.log("\n🔗 Seeding service category relations...");
  // Clear any existing category links for our seeded services to avoid duplicate relations issues
  const serviceIdsToClean = services.map(s => s.id);
  const { error: deleteRelError } = await supabase
    .from("service_categories")
    .delete()
    .in("service_id", serviceIdsToClean);
    
  if (deleteRelError) {
    console.warn("⚠️ Warning: Failed to clear old relations, may experience conflict:", deleteRelError.message);
  }

  // Prepare relations payload
  const relations = serviceCategoryMappings.map(mapping => {
    // Make sure we resolve the category_id correctly if it is dynamic
    // In our case we specified explicit IDs, but let's double check category name to ID
    const targetService = services.find(s => s.id === mapping.service_id);
    const catName = targetService ? targetService.category : "";
    const resolvedCatId = catNameToId[catName.toLowerCase()] || mapping.category_id;
    return {
      service_id: mapping.service_id,
      category_id: resolvedCatId
    };
  });

  const { error: relError } = await supabase
    .from("service_categories")
    .upsert(relations, { onConflict: "service_id,category_id" });

  if (relError) {
    console.error("❌ Failed to seed service category relations:", relError.message);
  } else {
    console.log("✅ Service category relations seeded successfully!");
  }

  console.log("\n🏁 Seeding complete!");
}

seed().catch((err) => {
  console.error("❌ Seeding crashed:", err);
  process.exit(1);
});
