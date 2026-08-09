const supabaseUrl = "https://zsfipvflmoppruxrieed.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZmlwdmZsbW9wcHJ1eHJpZWVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDg0NDM3MSwiZXhwIjoyMDk2NDIwMzcxfQ.4Ve9Go6iCSDV5nx7sxKiWaOg_BNRj8whLdnTwgsJ2DI";

async function run() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/blogs?select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    const data = await response.json();
    console.log("Total blogs fetched:", data.length);
    const sections = data.map(b => ({ id: b.id, title: b.title, section: b.section, category: b.category }));
    console.log("Blogs list:", JSON.stringify(sections, null, 2));
  } catch (error) {
    console.error("Error fetching blogs:", error);
  }
}

run();
