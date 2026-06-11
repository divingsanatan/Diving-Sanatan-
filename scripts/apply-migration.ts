import fs from "fs";
import path from "path";
import { Client } from "pg";
import readline from "readline";

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
if (!supabaseUrl) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL not defined in .env.local");
  process.exit(1);
}

const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
if (!match) {
  console.error("❌ ERROR: Could not parse project ref from NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const projectRef = match[1];
const dbHost = `db.${projectRef}.supabase.co`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askPassword = () => {
  return new Promise<string>((resolve) => {
    rl.question("🔑 Enter your Supabase Database Password: ", (answer) => {
      resolve(answer.trim());
    });
  });
};

async function run() {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || await askPassword();
  rl.close();

  if (!dbPassword) {
    console.error("❌ ERROR: Database password is required.");
    process.exit(1);
  }

  // Supabase defaults to port 6543 (transaction pooler) or 5432 (direct connection).
  // Using port 6543 is recommended.
  const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@${dbHost}:6543/postgres`;

  console.log(`🔌 Connecting to Supabase Postgres database at ${dbHost}...`);

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
    await client.connect();
    console.log("✅ Connected successfully!");

    // List of SQL migrations to apply in order
    const migrations = [
      "supabase/migrations/20260607010000_categories_m2m.sql"
    ];

    for (const mig of migrations) {
      const migPath = path.resolve(process.cwd(), mig);
      if (fs.existsSync(migPath)) {
        console.log(`\n📄 Applying migration: ${mig}...`);
        const sql = fs.readFileSync(migPath, "utf-8");
        await client.query(sql);
        console.log(`✅ Applied ${mig} successfully!`);
      } else {
        console.log(`⚠️ Warning: Migration file ${mig} not found, skipping.`);
      }
    }

    console.log("\n🚀 All migrations applied successfully!");
  } catch (err: any) {
    console.error("❌ Database migration failed:", err.message);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
