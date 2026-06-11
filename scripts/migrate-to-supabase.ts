import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// 1. Manually parse .env.local to load keys
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

// 2. Read local db.json
const dbJsonPath = path.resolve(process.cwd(), "src", "data", "db.json");
if (!fs.existsSync(dbJsonPath)) {
  console.error("❌ ERROR: db.json file not found at " + dbJsonPath);
  process.exit(1);
}

const dbData = JSON.parse(fs.readFileSync(dbJsonPath, "utf-8"));

async function runMigration() {
  console.log("🚀 Starting migration from db.json to Supabase...");

  // 1. Migrate Practitioners
  if (dbData.practitioners && dbData.practitioners.length > 0) {
    console.log(`\n👨‍⚕️ Migrating ${dbData.practitioners.length} practitioners...`);
    const mappedPractitioners = dbData.practitioners.map((p: any) => ({
      id: p.id,
      name: p.name,
      specialty: p.specialty,
      bio: p.bio,
      rating: p.rating,
      reviews_count: p.reviewsCount,
      image: p.image
    }));

    const { error } = await supabase.from("practitioners").upsert(mappedPractitioners);
    if (error) {
      console.error("❌ Failed to migrate practitioners:", error.message);
    } else {
      console.log("✅ Practitioners migrated successfully!");
    }
  }

  // 2. Migrate Services
  if (dbData.services && dbData.services.length > 0) {
    console.log(`\n💼 Migrating ${dbData.services.length} services...`);
    const mappedServices = dbData.services.map((s: any) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      duration: s.duration,
      rating: s.rating,
      practitioner: s.practitioner,
      category: s.category,
      image: s.image,
      description: s.description
    }));

    const { error } = await supabase.from("services").upsert(mappedServices);
    if (error) {
      console.error("❌ Failed to migrate services:", error.message);
    } else {
      console.log("✅ Services migrated successfully!");
    }
  }

  // 3. Migrate Bookings
  if (dbData.bookings && dbData.bookings.length > 0) {
    console.log(`\n📅 Migrating ${dbData.bookings.length} bookings...`);
    const mappedBookings = dbData.bookings.map((b: any) => ({
      id: b.id,
      service_id: b.serviceId,
      service_name: b.serviceName,
      practitioner_id: b.practitionerId,
      practitioner_name: b.practitionerName,
      date: b.date,
      time_slot: b.timeSlot,
      price: b.price,
      client_name: b.clientName,
      client_email: b.clientEmail,
      client_phone: b.clientPhone,
      notes: b.notes,
      status: b.status,
      payment_status: b.paymentStatus
    }));

    const { error } = await supabase.from("bookings").upsert(mappedBookings);
    if (error) {
      console.error("❌ Failed to migrate bookings:", error.message);
    } else {
      console.log("✅ Bookings migrated successfully!");
    }
  }

  // 4. Migrate Reviews
  if (dbData.reviews && dbData.reviews.length > 0) {
    console.log(`\n⭐️ Migrating ${dbData.reviews.length} reviews...`);
    const mappedReviews = dbData.reviews.map((r: any) => ({
      id: r.id,
      service_id: r.serviceId,
      service_name: r.serviceName,
      practitioner_id: r.practitionerId,
      practitioner_name: r.practitionerName,
      client_name: r.clientName,
      rating: r.rating,
      comment: r.comment,
      date: r.date
    }));

    const { error } = await supabase.from("reviews").upsert(mappedReviews);
    if (error) {
      console.error("❌ Failed to migrate reviews:", error.message);
    } else {
      console.log("✅ Reviews migrated successfully!");
    }
  }

  // 5. Migrate Blogs
  if (dbData.blogs && dbData.blogs.length > 0) {
    console.log(`\n✍️ Migrating ${dbData.blogs.length} blogs...`);
    const mappedBlogs = dbData.blogs.map((bl: any) => ({
      id: bl.id,
      title: bl.title,
      category: bl.category,
      author: bl.author,
      content: bl.content,
      date: bl.date,
      read_time: bl.readTime,
      image: bl.image
    }));

    const { error } = await supabase.from("blogs").upsert(mappedBlogs);
    if (error) {
      console.error("❌ Failed to migrate blogs:", error.message);
    } else {
      console.log("✅ Blogs migrated successfully!");
    }
  }

  console.log("\n🏁 Migration task finished!");
}

runMigration().catch((err) => {
  console.error("❌ Migration crashed:", err);
});
