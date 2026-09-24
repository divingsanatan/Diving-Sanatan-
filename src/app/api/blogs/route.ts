import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { slugify } from "@/utils/slugify";
import { invalidateServerCache } from "@/utils/serverCache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_SUPABASE_BLOG_COLUMNS = new Set([
  "id", "slug", "title", "category", "author", "content", "date", "read_time",
  "image", "images", "videos", "section", "is_show_featured_page", "views",
  "approval_status", "content_type", "content_format", "meta_title",
  "meta_description", "focus_keyword", "canonical_url", "robots_directive",
  "author_bio", "reviewed_by", "faq_pairs", "tldr", "pillar_cluster",
  "og_image_override", "moderation_status", "video_embed_url",
  "video_transcript", "tags", "pinned_related_articles"
]);

function sanitizeForSupabase(obj: Record<string, any>) {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (VALID_SUPABASE_BLOG_COLUMNS.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * GET Handler - Retrieves blog posts directly from Supabase database
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const section = searchParams.get("section");
    const adminView = searchParams.get("admin_view");

    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    };

    if (id) {
      // 1. Query Supabase directly by ID (or fallback by slug for public single blog view)
      let query = supabaseServer.from("blogs").select("*").eq("id", id);
      if (adminView !== "true") {
        query = query.eq("approval_status", "published");
      }
      
      let { data, error } = await query.maybeSingle();

      if (!data) {
        // Fallback check by slug
        let slugQuery = supabaseServer.from("blogs").select("*").eq("slug", id);
        if (adminView !== "true") {
          slugQuery = slugQuery.eq("approval_status", "published");
        }
        const { data: slugData } = await slugQuery.maybeSingle();
        data = slugData;
      }

      if (error) {
        console.error("Supabase GET single blog error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
      }

      if (!data) {
        return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404, headers });
      }

      const formatted = {
        ...data,
        slug: data.slug || slugify(data.title) || data.id,
        readTime: data.read_time || data.readTime,
        images: Array.isArray(data.images) ? data.images : [],
        videos: Array.isArray(data.videos) ? data.videos : [],
      };

      return NextResponse.json({ success: true, data: formatted }, { headers });
    }

    // List query directly from Supabase
    let query = supabaseServer.from("blogs").select("*");
    if (adminView !== "true") {
      query = query.eq("approval_status", "published");
    }
    if (category && category !== "all") {
      query = query.ilike("category", category);
    }
    if (section) {
      query = query.ilike("section", section);
    }

    const { data: blogs, error } = await query.order("date", { ascending: false });

    if (error) {
      console.error("Supabase GET blogs list error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
    }

    const formattedBlogs = (blogs || []).map((blog: any) => ({
      ...blog,
      slug: blog.slug || slugify(blog.title) || blog.id,
      readTime: blog.read_time || blog.readTime,
      images: Array.isArray(blog.images) ? blog.images : [],
      videos: Array.isArray(blog.videos) ? blog.videos : [],
    }));

    return NextResponse.json({ success: true, data: formattedBlogs }, { headers });
  } catch (error: any) {
    console.error("GET BLOG ERROR:", error);
    return NextResponse.json({ success: false, error: String(error?.message || error) }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new blog post directly in Supabase database
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title, slug, category, author, content, date, readTime, image, images, videos, section, is_show_featured_page, role, approval_status,
      meta_title, meta_description, focus_keyword, canonical_url, robots_directive,
      author_bio, reviewed_by, tldr, content_type, content_format, schema_type, faq_pairs,
      featured_image_alt, og_image_override, video_embed_url, video_transcript, tags, pillar_cluster, pinned_related_articles, status
    } = body;
    
    if (!title || !category || !author || !content || !date || !readTime) {
      return NextResponse.json({ success: false, error: "Missing required blog fields" }, { status: 400 });
    }

    const finalSlug = slug ? slugify(slug) : slugify(title);
    const nowISO = new Date().toISOString();
    
    const newBlogDb = {
      id: `bl-${Math.random().toString(36).substring(2, 9)}`,
      slug: finalSlug,
      title,
      category,
      author,
      content,
      date,
      read_time: readTime,
      image: image || "",
      images: Array.isArray(images) ? images : [],
      videos: Array.isArray(videos) ? videos : [],
      section: section || null,
      is_show_featured_page: is_show_featured_page !== undefined ? is_show_featured_page : true,
      approval_status: role === "super_admin" ? (approval_status || "published") : "published",
      meta_title: meta_title || title,
      meta_description: meta_description || (content ? content.substring(0, 160) : ""),
      focus_keyword: focus_keyword || "",
      canonical_url: canonical_url || `https://divingsanatan.online/blog/${finalSlug}`,
      robots_directive: robots_directive || "index, follow",
      author_bio: author_bio || "",
      reviewed_by: reviewed_by || "",
      tldr: tldr || "",
      content_type: content_type || "normal",
      content_format: content_format || "plain_text",
      schema_type: schema_type || "Article",
      faq_pairs: Array.isArray(faq_pairs) ? faq_pairs : [],
      featured_image_alt: featured_image_alt || title,
      og_image_override: og_image_override || image || "",
      video_embed_url: video_embed_url || "",
      video_transcript: video_transcript || "",
      tags: Array.isArray(tags) ? tags : [],
      pillar_cluster: pillar_cluster || "",
      pinned_related_articles: Array.isArray(pinned_related_articles) ? pinned_related_articles : [],
      status: status || "published",
      updated_at: nowISO,
    };

    const sanitizedDb = sanitizeForSupabase(newBlogDb);
    
    const { data, error } = await supabaseServer
      .from("blogs")
      .insert([sanitizedDb])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({
        success: false,
        error: `Database insertion failed: ${error.message}`
      }, { status: 500 });
    }

    const mapped = {
      ...data,
      slug: data.slug || finalSlug,
      readTime: data.read_time || readTime,
    };

    invalidateServerCache("blog");
    return NextResponse.json({ success: true, data: mapped }, { status: 201 });
  } catch (error: any) {
    console.error("POST BLOG ERROR:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create blog" }, { status: 500 });
  }
}

/**
 * PUT Handler - Updates a blog post directly in Supabase database matched strictly by ID
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id, slug, title, category, author, content, date, readTime, image, images, videos, section, is_show_featured_page, role, approval_status,
      meta_title, meta_description, focus_keyword, canonical_url, robots_directive,
      author_bio, reviewed_by, tldr, content_type, content_format, schema_type, faq_pairs,
      featured_image_alt, og_image_override, video_embed_url, video_transcript, tags, pillar_cluster, pinned_related_articles, status
    } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Blog ID is required" }, { status: 400 });
    }
    
    const nowISO = new Date().toISOString();
    const updates: any = { updated_at: nowISO };

    if (slug !== undefined) updates.slug = slugify(slug);
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (author !== undefined) updates.author = author;
    if (content !== undefined) updates.content = content;
    if (date !== undefined) updates.date = date;
    if (readTime !== undefined) updates.read_time = readTime;
    if (image !== undefined) updates.image = image;
    if (images !== undefined) updates.images = Array.isArray(images) ? images : [];
    if (videos !== undefined) updates.videos = Array.isArray(videos) ? videos : [];
    if (section !== undefined) updates.section = section;
    if (is_show_featured_page !== undefined) updates.is_show_featured_page = is_show_featured_page;

    if (meta_title !== undefined) updates.meta_title = meta_title;
    if (meta_description !== undefined) updates.meta_description = meta_description;
    if (focus_keyword !== undefined) updates.focus_keyword = focus_keyword;
    if (canonical_url !== undefined) updates.canonical_url = canonical_url;
    if (robots_directive !== undefined) updates.robots_directive = robots_directive;
    if (author_bio !== undefined) updates.author_bio = author_bio;
    if (reviewed_by !== undefined) updates.reviewed_by = reviewed_by;
    if (tldr !== undefined) updates.tldr = tldr;
    if (content_type !== undefined) updates.content_type = content_type;
    if (content_format !== undefined) updates.content_format = content_format;
    if (schema_type !== undefined) updates.schema_type = schema_type;
    if (faq_pairs !== undefined) updates.faq_pairs = Array.isArray(faq_pairs) ? faq_pairs : [];
    if (featured_image_alt !== undefined) updates.featured_image_alt = featured_image_alt;
    if (og_image_override !== undefined) updates.og_image_override = og_image_override;
    if (video_embed_url !== undefined) updates.video_embed_url = video_embed_url;
    if (video_transcript !== undefined) updates.video_transcript = video_transcript;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
    if (pillar_cluster !== undefined) updates.pillar_cluster = pillar_cluster;
    if (pinned_related_articles !== undefined) updates.pinned_related_articles = Array.isArray(pinned_related_articles) ? pinned_related_articles : [];
    if (status !== undefined) updates.status = status;
    
    if (role === "super_admin" && approval_status) {
      updates.approval_status = approval_status;
    } else if (role !== "super_admin") {
      updates.approval_status = "published";
    }
    
    const sanitizedUpdates = sanitizeForSupabase(updates);

    // Update strictly by ID
    const { data, error } = await supabaseServer
      .from("blogs")
      .update(sanitizedUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({
        success: false,
        error: `Database update failed: ${error.message}`
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        error: `No blog found with ID: ${id}`
      }, { status: 44 });
    }

    const mapped = {
      ...data,
      slug: data.slug || updates.slug,
      readTime: data.read_time || readTime,
    };
    
    invalidateServerCache("blog");
    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error("PUT BLOG ERROR:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update blog" }, { status: 500 });
  }
}

/**
 * DELETE Handler - Removes a blog post directly from Supabase database matched strictly by ID
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Blog ID is required" }, { status: 400 });
    }

    // Delete by ID or slug
    let { data, error } = await supabaseServer
      .from("blogs")
      .delete()
      .eq("id", id)
      .select();

    if (!data || data.length === 0) {
      const slugRes = await supabaseServer
        .from("blogs")
        .delete()
        .eq("slug", id)
        .select();
      if (!slugRes.error && slugRes.data && slugRes.data.length > 0) {
        error = null;
      }
    }

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    invalidateServerCache("blog");
    return NextResponse.json({ success: true, message: "Blog post removed successfully from database" });
  } catch (error: any) {
    console.error("DELETE BLOG ERROR:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to remove blog" }, { status: 500 });
  }
}
