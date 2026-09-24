import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/utils/db";
import { supabaseServer } from "@/utils/supabaseServer";
import { invalidateServerCache } from "@/utils/serverCache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const headers = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

/**
 * GET Handler - Retrieves pillar guides
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const adminView = searchParams.get("admin_view");

    const db = getDb();
    let pillarGuides: any[] = db.pillarGuides || [];

    // Try fetching from Supabase pillar_guides table if available
    try {
      const { data: supaGuides } = await supabaseServer.from("pillar_guides").select("*");
      if (supaGuides && supaGuides.length > 0) {
        supaGuides.forEach((sg: any) => {
          if (sg.status === "deleted" || sg.approval_status === "deleted") return;
          if (!pillarGuides.some((g: any) => g.id === sg.id)) {
            pillarGuides.unshift(sg);
          }
        });
      }
    } catch {
      // Ignore if table doesn't exist
    }

    // Also include blogs marked as Pillar Guide / Pillar Blog from Supabase blogs table
    try {
      let blogQuery = supabaseServer
        .from("blogs")
        .select("*")
        .neq("status", "deleted")
        .neq("approval_status", "deleted");

      if (adminView !== "true") {
        blogQuery = blogQuery.eq("approval_status", "published");
      }

      const { data: pillarBlogs } = await blogQuery.or("category.ilike.%pillar%,section.ilike.%pillar%");
      
      if (pillarBlogs && pillarBlogs.length > 0) {
        pillarBlogs.forEach((pb: any) => {
          if (pb.status === "deleted" || pb.approval_status === "deleted") return;
          const blogPillarId = pb.id;
          if (!pillarGuides.some((g: any) => g.id === blogPillarId || (pb.slug && g.id === pb.slug) || g.title?.toLowerCase() === pb.title?.toLowerCase())) {
            pillarGuides.push({
              id: pb.id,
              slug: pb.slug || pb.id,
              title: pb.title,
              description: pb.content ? pb.content.replace(/<[^>]*>/g, " ").substring(0, 160) + "..." : "",
              category: pb.category || "Pillar Guide",
              readTime: pb.read_time || pb.readTime || "1 Articles",
              image: pb.image || "",
              articles: [
                {
                  title: pb.title,
                  link: `/blog/${pb.slug || pb.id}`,
                  readTime: pb.read_time || pb.readTime || "5 Min Read"
                }
              ]
            });
          }
        });
      }
    } catch {
      // Ignore
    }

    if (id) {
      const guide = pillarGuides.find((g: any) => g.id === id || g.slug === id);
      if (!guide) {
        return NextResponse.json({ success: false, error: "Pillar Guide not found" }, { status: 404, headers });
      }
      return NextResponse.json({ success: true, data: guide }, { headers });
    }

    return NextResponse.json({ success: true, data: pillarGuides }, { headers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to read pillar guides" }, { status: 500, headers });
  }
}

/**
 * POST Handler - Creates a new pillar guide
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, category, image, articles } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ success: false, error: "Title and description are required" }, { status: 400, headers });
    }

    const db = getDb();
    db.pillarGuides = db.pillarGuides || [];

    const newGuide = {
      id: `pl-pillar-${Math.random().toString(36).substring(2, 9)}`,
      title: title.trim(),
      description: description.trim(),
      category: (category?.trim()) || "General",
      readTime: `${articles ? articles.length : 0} Articles`,
      image: image?.trim() || "",
      articles: Array.isArray(articles) ? articles.map((art: any) => ({
        title: art.title?.trim() || "Untitled Sub-article",
        link: art.link?.trim() || "#",
        readTime: art.readTime?.trim() || "5 Min Read"
      })) : []
    };

    db.pillarGuides.unshift(newGuide);
    saveDb(db);

    try {
      await supabaseServer.from("pillar_guides").insert([newGuide]);
    } catch {
      // Ignore
    }

    invalidateServerCache("pillar");
    invalidateServerCache("blog");

    return NextResponse.json({ success: true, data: newGuide }, { status: 201, headers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to create pillar guide" }, { status: 500, headers });
  }
}

/**
 * PUT Handler - Updates an existing pillar guide
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, category, image, articles } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Pillar Guide ID is required" }, { status: 400, headers });
    }

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ success: false, error: "Title and description are required" }, { status: 400, headers });
    }

    const db = getDb();
    db.pillarGuides = db.pillarGuides || [];

    const updatedGuide = {
      id,
      title: title.trim(),
      description: description.trim(),
      category: (category?.trim()) || "General",
      readTime: `${articles ? articles.length : 0} Articles`,
      image: image?.trim() || "",
      articles: Array.isArray(articles) ? articles.map((art: any) => ({
        title: art.title?.trim() || "Untitled Sub-article",
        link: art.link?.trim() || "#",
        readTime: art.readTime?.trim() || "5 Min Read"
      })) : []
    };

    const guideIdx = db.pillarGuides.findIndex((g: any) => g.id === id);
    if (guideIdx !== -1) {
      db.pillarGuides[guideIdx] = updatedGuide;
    } else {
      db.pillarGuides.unshift(updatedGuide);
    }

    saveDb(db);

    try {
      await supabaseServer.from("pillar_guides").upsert([updatedGuide]);
    } catch {
      // Ignore
    }

    invalidateServerCache("pillar");
    invalidateServerCache("blog");

    return NextResponse.json({ success: true, data: updatedGuide }, { headers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to update pillar guide" }, { status: 500, headers });
  }
}

/**
 * DELETE Handler - Deletes a pillar guide
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Pillar Guide ID is required" }, { status: 400, headers });
    }

    // 1. Delete from local db.json
    const db = getDb();
    db.pillarGuides = db.pillarGuides || [];
    db.pillarGuides = db.pillarGuides.filter((g: any) => g.id !== id && g.slug !== id);
    saveDb(db);

    // 2. Delete/soft-delete from Supabase pillar_guides table if present
    try {
      await supabaseServer.from("pillar_guides").delete().eq("id", id);
      await supabaseServer.from("pillar_guides").delete().eq("slug", id);
      await supabaseServer.from("pillar_guides").update({ status: "deleted", approval_status: "deleted" }).eq("id", id);
      await supabaseServer.from("pillar_guides").update({ status: "deleted", approval_status: "deleted" }).eq("slug", id);
    } catch {
      // Ignore
    }

    // 3. Delete/soft-delete from Supabase blogs table in case it was stored as a blog post
    try {
      await supabaseServer.from("blogs").delete().eq("id", id);
      await supabaseServer.from("blogs").delete().eq("slug", id);
      await supabaseServer.from("blogs").update({ status: "deleted", approval_status: "deleted" }).eq("id", id);
      await supabaseServer.from("blogs").update({ status: "deleted", approval_status: "deleted" }).eq("slug", id);
    } catch {
      // Ignore
    }

    invalidateServerCache("pillar");
    invalidateServerCache("blog");

    return NextResponse.json({ success: true, message: "Pillar Guide removed successfully" }, { headers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to delete pillar guide" }, { status: 500, headers });
  }
}

