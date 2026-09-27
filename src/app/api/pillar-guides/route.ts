import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { invalidateServerCache } from "@/utils/serverCache";
import { slugify } from "@/utils/slugify";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const headers = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

/**
 * GET Handler - Retrieves pillar guides directly from Supabase database
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const adminView = searchParams.get("admin_view");

    let pillarGuides: any[] = [];

    // 1. Fetch from Supabase pillar_guides table (if table exists)
    try {
      const { data: supaGuides, error: supaErr } = await supabaseServer
        .from("pillar_guides")
        .select("*");
      if (!supaErr && supaGuides && supaGuides.length > 0) {
        supaGuides.forEach((sg: any) => {
          if (sg.status === "deleted" || sg.approval_status === "deleted") return;
          if (!pillarGuides.some((g: any) => g.id === sg.id)) {
            pillarGuides.unshift(sg);
          }
        });
      }
    } catch {
      // Ignore
    }

    // 2. Fetch from Supabase blogs table for blogs marked as pillar or content_type pillar_guide
    try {
      let blogQuery = supabaseServer
        .from("blogs")
        .select("*")
        .neq("approval_status", "deleted");

      if (adminView !== "true") {
        blogQuery = blogQuery.eq("approval_status", "published");
      }

      const { data: pillarBlogs, error: blogErr } = await blogQuery.or(
        "category.ilike.%pillar%,section.ilike.%pillar%"
      );

      if (!blogErr && pillarBlogs && pillarBlogs.length > 0) {
        pillarBlogs.forEach((pb: any) => {
          if (pb.approval_status === "deleted") return;

          let parsedArticles = [];
          if (pb.tldr && typeof pb.tldr === "string" && pb.tldr.trim().startsWith("[")) {
            try {
              parsedArticles = JSON.parse(pb.tldr);
            } catch {
              parsedArticles = [];
            }
          }

          if (!parsedArticles || parsedArticles.length === 0) {
            parsedArticles = [
              {
                title: pb.title,
                link: `/blog/${pb.slug || pb.id}`,
                readTime: pb.read_time || pb.readTime || "5 Min Read",
              },
            ];
          }

          const blogPillarId = pb.id;
          if (
            !pillarGuides.some(
              (g: any) =>
                g.id === blogPillarId ||
                (pb.slug && g.id === pb.slug) ||
                g.title?.toLowerCase() === pb.title?.toLowerCase()
            )
          ) {
            pillarGuides.push({
              id: pb.id,
              slug: pb.slug || pb.id,
              title: pb.title,
              description:
                pb.content ? pb.content.replace(/<[^>]*>/g, " ").substring(0, 160) : "",
              category: pb.category || "Pillar Guide",
              readTime: pb.read_time || `${parsedArticles.length} Articles`,
              image: pb.image || "",
              articles: parsedArticles,
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
        return NextResponse.json(
          { success: false, error: "Pillar Guide not found" },
          { status: 404, headers }
        );
      }
      return NextResponse.json({ success: true, data: guide }, { headers });
    }

    return NextResponse.json({ success: true, data: pillarGuides }, { headers });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to read pillar guides" },
      { status: 500, headers }
    );
  }
}

/**
 * POST Handler - Creates a new pillar guide directly in Supabase database
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, category, image, articles } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400, headers }
      );
    }

    const pillarId = `pl-pillar-${Math.random().toString(36).substring(2, 9)}`;
    const cleanSlug = slugify(title);
    const formattedArticles = Array.isArray(articles)
      ? articles.map((art: any) => ({
          title: art.title?.trim() || "Untitled Sub-article",
          link: art.link?.trim() || "#",
          readTime: art.readTime?.trim() || "5 Min Read",
        }))
      : [];

    const newGuide = {
      id: pillarId,
      slug: cleanSlug,
      title: title.trim(),
      description: description.trim(),
      category: category?.trim() || "General",
      readTime: `${formattedArticles.length} Articles`,
      image: image?.trim() || "",
      articles: formattedArticles,
    };

    let savedData = null;
    let supaSuccess = false;

    // 1. Try to insert into Supabase pillar_guides table
    try {
      const { data, error } = await supabaseServer
        .from("pillar_guides")
        .insert([newGuide])
        .select()
        .single();
      if (!error && data) {
        savedData = data;
        supaSuccess = true;
      }
    } catch {
      // Ignore if table does not exist
    }

    // 2. If pillar_guides table doesn't exist or insert failed, save into Supabase blogs table!
    if (!supaSuccess) {
      const blogPillarRecord = {
        id: pillarId,
        slug: cleanSlug,
        title: title.trim(),
        category: category?.trim() || "Pillar Guide",
        section: "pillar",
        content_type: "normal",
        author: "Admin",
        content: description.trim(),
        date: new Date().toISOString().split("T")[0],
        read_time: `${formattedArticles.length} Articles`,
        image: image?.trim() || "",
        tldr: JSON.stringify(formattedArticles),
        approval_status: "published",
      };

      const { data: blogData, error: blogErr } = await supabaseServer
        .from("blogs")
        .insert([blogPillarRecord])
        .select()
        .single();

      if (blogErr) {
        console.error("Supabase blogs table insert error for pillar guide:", blogErr);
        return NextResponse.json(
          { success: false, error: `Supabase save failed: ${blogErr.message}` },
          { status: 500, headers }
        );
      }
      savedData = newGuide;
    }

    invalidateServerCache("pillar");
    invalidateServerCache("blog");

    return NextResponse.json({ success: true, data: savedData || newGuide }, { status: 201, headers });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create pillar guide in Supabase" },
      { status: 500, headers }
    );
  }
}

/**
 * PUT Handler - Updates an existing pillar guide directly in Supabase database
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, category, image, articles } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Pillar Guide ID is required" },
        { status: 400, headers }
      );
    }

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400, headers }
      );
    }

    const cleanSlug = slugify(title);
    const formattedArticles = Array.isArray(articles)
      ? articles.map((art: any) => ({
          title: art.title?.trim() || "Untitled Sub-article",
          link: art.link?.trim() || "#",
          readTime: art.readTime?.trim() || "5 Min Read",
        }))
      : [];

    const updatedGuide = {
      id,
      slug: cleanSlug,
      title: title.trim(),
      description: description.trim(),
      category: category?.trim() || "General",
      readTime: `${formattedArticles.length} Articles`,
      image: image?.trim() || "",
      articles: formattedArticles,
    };

    let supaSuccess = false;

    // 1. Upsert into Supabase pillar_guides table if present
    try {
      const { data, error } = await supabaseServer
        .from("pillar_guides")
        .upsert([updatedGuide])
        .select()
        .single();
      if (!error && data) {
        supaSuccess = true;
      }
    } catch {
      // Ignore
    }

    // 2. Also upsert into Supabase blogs table
    const blogPillarRecord = {
      id,
      slug: cleanSlug,
      title: title.trim(),
      category: category?.trim() || "Pillar Guide",
      section: "pillar",
      content_type: "normal",
      author: "Admin",
      content: description.trim(),
      read_time: `${formattedArticles.length} Articles`,
      image: image?.trim() || "",
      tldr: JSON.stringify(formattedArticles),
      approval_status: "published",
      updated_at: new Date().toISOString(),
    };

    const { error: blogErr } = await supabaseServer
      .from("blogs")
      .upsert([blogPillarRecord]);

    if (blogErr && !supaSuccess) {
      console.error("Supabase blogs table update error for pillar guide:", blogErr);
      return NextResponse.json(
        { success: false, error: `Supabase update failed: ${blogErr.message}` },
        { status: 500, headers }
      );
    }

    invalidateServerCache("pillar");
    invalidateServerCache("blog");

    return NextResponse.json({ success: true, data: updatedGuide }, { headers });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update pillar guide in Supabase" },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE Handler - Deletes a pillar guide directly from Supabase database
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Pillar Guide ID is required" },
        { status: 400, headers }
      );
    }

    // 1. Delete from Supabase pillar_guides table
    try {
      await supabaseServer.from("pillar_guides").delete().eq("id", id);
      await supabaseServer.from("pillar_guides").delete().eq("slug", id);
    } catch {
      // Ignore if table does not exist
    }

    // 2. Delete from Supabase blogs table
    const { error: blogErr } = await supabaseServer
      .from("blogs")
      .delete()
      .eq("id", id);

    if (blogErr) {
      await supabaseServer.from("blogs").delete().eq("slug", id);
    }

    invalidateServerCache("pillar");
    invalidateServerCache("blog");

    return NextResponse.json(
      { success: true, message: "Pillar Guide removed successfully from Supabase" },
      { headers }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete pillar guide from Supabase" },
      { status: 500, headers }
    );
  }
}


