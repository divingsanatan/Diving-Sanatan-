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
    const res = await client.query("SELECT * FROM glossary_terms ORDER BY word ASC");
    console.log("Glossary Terms in DB:", res.rows);
  } catch (err) {
    console.error("Error connecting or querying:", err);
  } finally {
    await client.end();
  }
}

run();
