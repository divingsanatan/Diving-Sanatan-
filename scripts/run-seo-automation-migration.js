const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

// 1. Parse env variables from .env.local if present
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
  console.log("ℹ️ Note: Database migration script ready. Running requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD in .env.local.");
}

const match = supabaseUrl ? supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/) : null;
const projectRef = match ? match[1] : null;
const dbHost = projectRef ? `db.${projectRef}.supabase.co` : null;

async function run() {
  if (!dbHost || !dbPassword) {
    console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD missing.");
    process.exit(1);
  }

  const client = new Client({
    host: dbHost,
    port: 6543,
    user: "postgres",
    password: dbPassword,
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`🔌 Connecting to Supabase Postgres database at ${dbHost}...`);
    await client.connect();
    console.log("✅ Connected successfully!");

    const migPath = path.resolve(process.cwd(), "supabase/migrations/20260730000000_seo_automation_schema.sql");
    console.log(`\n📄 Reading migration: ${migPath}...`);
    const sql = fs.readFileSync(migPath, "utf-8");
    
    console.log("🚀 Executing SQL migration...");
    await client.query(sql);
    console.log("✅ Schema migration applied successfully!");

    // Backfill content_type and content_format for existing blogs if null or default
    console.log("\n🔄 Backfilling content_type and content_format for existing blogs...");
    const backfillQuery = `
      UPDATE blogs 
      SET 
        content_type = CASE 
          WHEN category ILIKE '%faq%' THEN 'faq'
          WHEN category ILIKE '%comparison%' OR title ILIKE '%vs%' THEN 'comparison'
          WHEN category ILIKE '%case study%' OR category ILIKE '%story%' THEN 'case_study'
          WHEN category ILIKE '%glossary%' OR title ILIKE '%definition%' THEN 'glossary'
          WHEN category ILIKE '%video%' OR content ILIKE '%<iframe%' THEN 'video'
          WHEN category ILIKE '%quora%' OR category ILIKE '%q&a%' THEN 'qa_style'
          ELSE 'normal'
        END,
        content_format = CASE
          WHEN content ILIKE '%<p>%' OR content ILIKE '%<div>%' OR content ILIKE '%<h%' THEN 'html'
          ELSE 'plain_text'
        END
      WHERE content_type IS NULL OR content_format IS NULL;
    `;
    await client.query(backfillQuery);
    console.log("✅ Backfill completed successfully!");

  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  run().catch(console.error);
}
