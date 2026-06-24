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
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD not defined in .env.local");
  process.exit(1);
}

const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
if (!match) {
  console.error("❌ ERROR: Could not parse project ref from NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const projectRef = match[1];
const dbHost = `db.${projectRef}.supabase.co`;

async function run() {
  const client = new Client({
    host: dbHost,
    port: 6543,
    user: "postgres",
    password: dbPassword,
    database: "postgres",
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log(`🔌 Connecting to Supabase Postgres database at ${dbHost}...`);
    await client.connect();
    console.log("✅ Connected successfully!");

    const migPath = path.resolve(process.cwd(), "supabase/migrations/20260624020000_add_blog_media_jsonb.sql");
    console.log(`\n📄 Reading migration: ${migPath}...`);
    const sql = fs.readFileSync(migPath, "utf-8");
    
    console.log("🚀 Executing SQL migration...");
    await client.query(sql);
    console.log("✅ Migration applied successfully!");
  } catch (err) {
    console.error("❌ Database migration failed:", err.message);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
