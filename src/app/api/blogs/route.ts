import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { slugify, getDb, saveDb } from "@/utils/db";
import { getOrSetServerCache, invalidateServerCache } from "@/utils/serverCache";

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
 * GET Handler - Retrieves blog posts from Supabase / db.json
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const section = searchParams.get("section");
    const adminView = searchParams.get("admin_view");

    const headers = adminView === "true" ? {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    } : {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    };

    const cacheKey = `blog_${adminView === "true" ? "admin" : "pub"}_${id || "list"}_${category || "all"}_${section || "all"}`;

    const data = await getOrSetServerCache(cacheKey, adminView === "true" ? 0 : 60, async () => {
      if (id) {
        let blog: any = null;

        try {
          // 1. First try querying by exact ID
          let query = supabaseServer.from("blogs").select("*");
          if (adminView !== "true") {
            query = query.eq("approval_status", "published");
          }
          
          const { data: exactMatch } = await query.eq("id", id);
          if (exactMatch && exactMatch.length > 0) {
            blog = exactMatch[0];
          } else {
            let listQuery = supabaseServer.from("blogs").select("*");
            if (adminView !== "true") {
              listQuery = listQuery.eq("approval_status", "published");
            }
            const listRes = await listQuery;
            if (listRes.data && listRes.data.length > 0) {
              blog = listRes.data.find((b: any) =>
                b.id === id ||
                b.slug === id ||
                slugify(b.slug || b.title || "") === id
              );
            }
          }
        } catch (err) {
          console.warn("Supabase blog GET error:", err);
        }

        // Fallback: local db.json
        if (!blog) {
          try {
            const localDb = getDb();
            const found = localDb.blogs?.find((b: any) =>
              b.id === id ||
              b.slug === id ||
              slugify(b.slug || b.title || "") === id
            );
            if (found) {
              blog = {
                ...found,
                slug: found.slug || slugify(found.title) || found.id,
                read_time: found.readTime || (found as any).read_time,
                approval_status: "published",
              };
            }
          } catch (err) {
            console.error("Local DB fetch error:", err);
          }
        }

        if (!blog) return null;

        return {
          ...blog,
          slug: blog.slug || slugify(blog.title) || blog.id,
          readTime: blog.read_time || blog.readTime,
          images: Array.isArray(blog.images) ? blog.images : [],
          videos: Array.isArray(blog.videos) ? blog.videos : [],
        };
      }

      let blogs: any[] = [];
      try {
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
        
        const res = await query.order("date", { ascending: false });
        if (res.data && res.data.length > 0) {
          blogs = res.data;
        }
      } catch (err) {
        console.warn("Supabase GET blogs list error:", err);
      }

      try {
        const localDb = getDb();
        let localBlogs = localDb.blogs || [];
        if (category && category !== "all") {
          localBlogs = localBlogs.filter((b: any) => b.category?.toLowerCase() === category.toLowerCase());
        }
        if (section) {
          localBlogs = localBlogs.filter((b: any) => b.section?.toLowerCase() === section.toLowerCase());
        }
        
        localBlogs.forEach((localBlog: any) => {
          if (!blogs.some((b: any) => b.id === localBlog.id)) {
            blogs.push({
              ...localBlog,
              slug: localBlog.slug || slugify(localBlog.title) || localBlog.id,
              read_time: localBlog.readTime || (localBlog as any).read_time,
              approval_status: "published"
            });
          }
        });
      } catch (err) {
        console.error("Local DB fetch/merge error:", err);
      }
      
      return (blogs || []).map((blog: any) => ({
        ...blog,
        slug: blog.slug || slugify(blog.title) || blog.id,
        readTime: blog.read_time || blog.readTime,
        images: Array.isArray(blog.images) ? blog.images : [],
        videos: Array.isArray(blog.videos) ? blog.videos : [],
      }));
    });

    if (id && !data) {
      return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data }, { headers });
  } catch (error: any) {
    console.error("GET BLOG ERROR:", error);
    return NextResponse.json({ success: false, error: String(error?.stack || error?.message || error) }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new blog post
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
    
    let insertedData = null;
    let insertError = null;

    try {
      const { data, error } = await supabaseServer
        .from("blogs")
        .insert([sanitizedDb])
        .select("id, title")
        .maybeSingle();

      if (error) {
        console.warn("Supabase insert error (sanitized):", error.message);
        insertError = error;
        // Fallback: try minimal core fields without non-existent schema columns
        const minimalDb = sanitizeForSupabase({
          id: newBlogDb.id,
          title: newBlogDb.title,
          category: newBlogDb.category,
          author: newBlogDb.author,
          content: newBlogDb.content,
          date: newBlogDb.date,
          read_time: newBlogDb.read_time,
          image: newBlogDb.image,
          approval_status: newBlogDb.approval_status,
        });

        const { data: retryData, error: retryErr } = await supabaseServer
          .from("blogs")
          .insert([minimalDb])
          .select("id, title")
          .maybeSingle();

        if (!retryErr) {
          insertedData = retryData;
          insertError = null;
        } else {
          console.error("Supabase minimal insert fallback failed:", retryErr.message);
        }
      } else {
        insertedData = data;
      }
    } catch (sbInsertErr: any) {
      console.warn("Supabase insert exception:", sbInsertErr);
      insertError = sbInsertErr;
    }

    let localSaved = false;
    try {
      const db = getDb();
      db.blogs = db.blogs || [];
      db.blogs.unshift({
        id: newBlogDb.id,
        slug: newBlogDb.slug,
        title: newBlogDb.title,
        category: newBlogDb.category,
        author: newBlogDb.author,
        content: newBlogDb.content,
        date: newBlogDb.date,
        readTime: newBlogDb.read_time,
        image: newBlogDb.image,
        images: newBlogDb.images,
        videos: newBlogDb.videos,
        section: newBlogDb.section,
        is_show_featured_page: newBlogDb.is_show_featured_page,
        meta_title: newBlogDb.meta_title,
        meta_description: newBlogDb.meta_description,
        focus_keyword: newBlogDb.focus_keyword,
        canonical_url: newBlogDb.canonical_url,
        robots_directive: newBlogDb.robots_directive,
        author_bio: newBlogDb.author_bio,
        reviewed_by: newBlogDb.reviewed_by,
        tldr: newBlogDb.tldr,
        content_type: newBlogDb.content_type,
        content_format: newBlogDb.content_format,
        schema_type: newBlogDb.schema_type,
        faq_pairs: newBlogDb.faq_pairs,
        featured_image_alt: newBlogDb.featured_image_alt,
        og_image_override: newBlogDb.og_image_override,
        video_embed_url: newBlogDb.video_embed_url,
        video_transcript: newBlogDb.video_transcript,
        tags: newBlogDb.tags,
        pillar_cluster: newBlogDb.pillar_cluster,
        pinned_related_articles: newBlogDb.pinned_related_articles,
        status: newBlogDb.status,
      });
      saveDb(db);
      localSaved = true;
    } catch (dbErr) {
      console.error("Failed to sync db.json:", dbErr);
    }
    
    if (!insertedData && insertError && !localSaved) {
      return NextResponse.json({
        success: false,
        error: `Database insertion failed: ${insertError.message}`
      }, { status: 500 });
    }

    const resultObj = insertedData || newBlogDb;
    const mapped = {
      ...resultObj,
      slug: finalSlug,
      readTime: (resultObj as any).read_time || readTime,
    };

    invalidateServerCache("blog");
    return NextResponse.json({ success: true, data: mapped }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create blog" }, { status: 500 });
  }
}

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

    // Fetch existing blog safely to check slug change
    let oldSlug = "";
    try {
      const { data: existing } = await supabaseServer.from("blogs").select("title").eq("id", id).maybeSingle();
      if (existing) oldSlug = (existing as any).slug || slugify(existing.title || "");
    } catch (e) {
      // ignore
    }

    if (slug !== undefined) {
      const newSlug = slugify(slug);
      updates.slug = newSlug;

      // Auto-log 301 redirect if slug changed
      if (oldSlug && oldSlug !== newSlug) {
        try {
          await supabaseServer.from("redirects").upsert({
            source_path: `/blog/${oldSlug}`,
            target_path: `/blog/${newSlug}`,
            status_code: 301,
          });
        } catch (redirErr) {
          console.warn("Failed to create automatic redirect for slug change:", redirErr);
        }
      }
    }

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

    let updatedData = null;
    let updateError = null;

    try {
      const { data, error } = await supabaseServer
        .from("blogs")
        .update(sanitizedUpdates)
        .eq("id", id)
        .select("id, title")
        .maybeSingle();

      if (error) {
        console.warn("Supabase update error (sanitized):", error.message);
        updateError = error;
        const minimalUpdates = sanitizeForSupabase({
          title: updates.title,
          category: updates.category,
          author: updates.author,
          content: updates.content,
          date: updates.date,
          read_time: updates.read_time,
          image: updates.image,
        });

        const { data: retryData, error: retryErr } = await supabaseServer
          .from("blogs")
          .update(minimalUpdates)
          .eq("id", id)
          .select("id, title")
          .maybeSingle();

        if (!retryErr) {
          updatedData = retryData;
          updateError = null;
        }
      } else {
        updatedData = data;
      }
    } catch (sbErr: any) {
      console.warn("Supabase update exception:", sbErr);
      updateError = sbErr;
    }

    let localUpdated = false;
    try {
      const db = getDb();
      if (db.blogs) {
        const idx = db.blogs.findIndex((b: any) => b.id === id || b.slug === id);
        if (idx !== -1) {
          db.blogs[idx] = {
            ...db.blogs[idx],
            ...(updates.slug ? { slug: updates.slug } : {}),
            ...(title !== undefined ? { title } : {}),
            ...(category !== undefined ? { category } : {}),
            ...(author !== undefined ? { author } : {}),
            ...(content !== undefined ? { content } : {}),
            ...(date !== undefined ? { date } : {}),
            ...(readTime !== undefined ? { readTime } : {}),
            ...(image !== undefined ? { image } : {}),
            ...(images !== undefined ? { images: Array.isArray(images) ? images : [] } : {}),
            ...(videos !== undefined ? { videos: Array.isArray(videos) ? videos : [] } : {}),
            ...(section !== undefined ? { section } : {}),
            ...(is_show_featured_page !== undefined ? { is_show_featured_page } : {}),
            ...(meta_title !== undefined ? { meta_title } : {}),
            ...(meta_description !== undefined ? { meta_description } : {}),
            ...(focus_keyword !== undefined ? { focus_keyword } : {}),
            ...(canonical_url !== undefined ? { canonical_url } : {}),
            ...(robots_directive !== undefined ? { robots_directive } : {}),
            ...(author_bio !== undefined ? { author_bio } : {}),
            ...(reviewed_by !== undefined ? { reviewed_by } : {}),
            ...(tldr !== undefined ? { tldr } : {}),
            ...(content_type !== undefined ? { content_type } : {}),
            ...(content_format !== undefined ? { content_format } : {}),
            ...(schema_type !== undefined ? { schema_type } : {}),
            ...(faq_pairs !== undefined ? { faq_pairs } : {}),
            ...(featured_image_alt !== undefined ? { featured_image_alt } : {}),
            ...(og_image_override !== undefined ? { og_image_override } : {}),
            ...(video_embed_url !== undefined ? { video_embed_url } : {}),
            ...(video_transcript !== undefined ? { video_transcript } : {}),
            ...(tags !== undefined ? { tags: Array.isArray(tags) ? tags : [] } : {}),
            ...(pillar_cluster !== undefined ? { pillar_cluster } : {}),
            ...(pinned_related_articles !== undefined ? { pinned_related_articles: Array.isArray(pinned_related_articles) ? pinned_related_articles : [] } : {}),
            ...(status !== undefined ? { status } : {}),
          };
          saveDb(db);
          localUpdated = true;
        }
      }
    } catch (dbErr) {
      console.error("Failed to sync db.json:", dbErr);
    }
    
    if (!updatedData && updateError && !localUpdated) {
      return NextResponse.json({
        success: false,
        error: `Database update failed: ${updateError.message}`
      }, { status: 500 });
    }

    const mapped = {
      ...(updatedData || updates),
      slug: updates.slug || (updatedData as any)?.slug,
      readTime: (updatedData as any)?.read_time || readTime,
    };
    
    invalidateServerCache("blog");
    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update blog" }, { status: 500 });
  }
}

/**
 * DELETE Handler - Removes a blog post
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Blog ID is required" }, { status: 400 });
    }
    
    // 1. Delete from local db.json
    let localDeleted = false;
    try {
      const db = getDb();
      if (db.blogs) {
        const initialLen = db.blogs.length;
        db.blogs = db.blogs.filter((b: any) => b.id !== id && b.slug !== id);
        if (db.blogs.length !== initialLen) {
          saveDb(db);
          localDeleted = true;
        }
      }
    } catch (dbErr) {
      console.error("Failed to delete blog from db.json:", dbErr);
    }

    // 2. Delete from Supabase
    let supabaseDeleted = false;
    try {
      const { error } = await supabaseServer
        .from("blogs")
        .delete()
        .eq("id", id);
        
      if (!error) {
        supabaseDeleted = true;
      } else {
        console.warn("Supabase delete warning:", error.message);
      }
    } catch (sbErr) {
      console.warn("Supabase delete exception:", sbErr);
    }
    
    invalidateServerCache("blog");
    return NextResponse.json({ success: true, message: "Blog post removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to remove blog" }, { status: 500 });
  }
}



