const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

// Parse env variables from .env.local
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
const dbPassword = process.env.SUPABASE_DB_PASSWORD || "";

if (!supabaseUrl || !dbPassword) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD not defined");
  process.exit(1);
}

const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
const projectRef = match ? match[1] : "";
const dbHost = `db.${projectRef}.supabase.co`;

const termsToUpsert = [
  {
    id: "gloss-aura",
    word: "Aura",
    phonetic: "(aw-rah)",
    category: "Bio-Energy",
    definition: "The subtle energy field that surrounds the body and reflects your physical, emotional, mental, and spiritual state.",
    illustration: "aura-chart"
  },
  {
    id: "gloss-chakra",
    word: "Chakra",
    phonetic: "(chak-ruh)",
    category: "Energy Center",
    definition: "Energy centers in the body that regulate the flow of life energy (prana). There are seven primary chakras aligned along the spine.",
    illustration: "chakra-system"
  },
  {
    id: "gloss-karma",
    word: "Karma",
    phonetic: "(kahr-muh)",
    category: "Metaphysics",
    definition: "The law of cause and effect. Your thoughts, actions, and intentions influence your future experiences.",
    illustration: "karma"
  },
  {
    id: "gloss-meditation",
    word: "Meditation",
    phonetic: "(med-i-tey-shuhn)",
    category: "Meditation",
    definition: "A practice that trains the mind to achieve focus, clarity, and inner peace through techniques like breath awareness and visualization.",
    illustration: "meditation"
  },
  {
    id: "gloss-prana",
    word: "Prana",
    phonetic: "(prah-nuh)",
    category: "Vital force",
    definition: "Life force energy that flows through all living beings and sustains vital functions.",
    illustration: "prana"
  },
  {
    id: "gloss-reiki",
    word: "Reiki",
    phonetic: "(ray-key)",
    category: "Healing",
    definition: "A Japanese energy healing technique that promotes relaxation, balance, and healing by channeling universal life energy.",
    illustration: "reiki"
  }
];

async function run() {
  const client = new Client({
    host: dbHost,
    port: 6543,
    user: "postgres",
    password: dbPassword,
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to DB, upserting terms...");

    for (const term of termsToUpsert) {
      const query = `
        INSERT INTO glossary_terms (id, word, phonetic, category, definition, illustration)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) 
        DO UPDATE SET 
          word = EXCLUDED.word,
          phonetic = EXCLUDED.phonetic,
          category = EXCLUDED.category,
          definition = EXCLUDED.definition,
          illustration = EXCLUDED.illustration;
      `;
      await client.query(query, [term.id, term.word, term.phonetic, term.category, term.definition, term.illustration]);
      console.log(`Upserted: ${term.word}`);
    }

    console.log("All terms seeded successfully!");
  } catch (err) {
    console.error("Error connecting or querying:", err);
  } finally {
    await client.end();
  }
}

run();
