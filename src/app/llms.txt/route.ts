import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

export async function GET() {
  const baseUrl = "https://divingsanatan.online";

  try {
    const [blogsRes, servicesRes] = await Promise.all([
      supabaseServer.from("blogs").select("id, slug, title, tldr").limit(50),
      supabaseServer.from("services").select("id, name, description").limit(20)
    ]);

    const blogList = (blogsRes.data || []).map(b => 
      `- [${b.title}](${baseUrl}/blog/${b.slug || b.id}): ${b.tldr || "Article on energy healing and mindfulness"}`
    ).join("\n");

    const serviceList = (servicesRes.data || []).map(s => 
      `- [${s.name}](${baseUrl}/services/${s.id}): ${s.description ? s.description.substring(0, 120) : "Holistic sanctuary service"}`
    ).join("\n");

    const content = `# Diving Sanatan Sanctuary

> Diving Sanatan Sanctuary is a spiritual, holistic energy healing and mindfulness center offering authentic Chakra Balancing, Reiki, Sound Healing, and Aura Scanning therapies.

## Core Pages
- [Home](${baseUrl}/): Main sanctuary overview and healing offerings.
- [Services](${baseUrl}/services): Full catalogue of energy healing services.
- [About Us](${baseUrl}/about): Our healers, lineage, credentials, and mission.
- [Blog & Guides](${baseUrl}/blog): Articles on spiritual growth, chakra alignment, and meditation.
- [Reviews](${baseUrl}/reviews): Verified testimonials from sanctuary seekers.

## Energy Healing Services
${serviceList || "- Chakra Balancing & Alignment\n- Sound Bath Healing\n- Usui Reiki Sessions"}

## Articles & Spiritual Guides
${blogList || "- Guides on Chakra Blocks, Energy Cleansing, and Meditation Practices"}

## Contact & Location
- Website: ${baseUrl}
- Contact Email: support@divingsanatan.online
`;

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
      }
    });
  } catch (err: any) {
    return new NextResponse(`# Diving Sanatan Sanctuary\nWebsite: ${baseUrl}`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
