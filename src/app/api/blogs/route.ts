import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { slugify, getDb, saveDb } from "@/utils/db";

/**
 * GET Handler - Retrieves blog posts from Supabase / db.json
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const headers = {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    };
    
    if (id) {
      let blog: any = null;

      try {
        const adminView = searchParams.get("admin_view");

        // 1. First try querying by exact ID or slug
        let query = supabaseServer.from("blogs").select("*");
        if (adminView !== "true") {
          query = query.or("approval_status.eq.published,approval_status.is.null");
        }
        
        // Try exact match on ID or slug first
        const { data: exactMatch } = await query.or(`id.eq.${id},slug.eq.${id}`);
        if (exactMatch && exactMatch.length > 0) {
          blog = exactMatch[0];
        } else {
          // 2. Query all blogs from Supabase only if exact match failed
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

      // 3. Fallback: check local db.json if Supabase has no record
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

      if (!blog) {
        return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404 });
      }

      const mappedBlog = {
        ...blog,
        slug: blog.slug || slugify(blog.title) || blog.id,
        readTime: blog.read_time || blog.readTime,
        images: Array.isArray(blog.images) ? blog.images : [],
        videos: Array.isArray(blog.videos) ? blog.videos : [],
      };

      return NextResponse.json({ success: true, data: mappedBlog }, { headers });
    }
    
    let blogs: any[] = [];
    try {
      let query = supabaseServer.from("blogs").select("*");
      
      const adminView = searchParams.get("admin_view");
      if (adminView !== "true") {
        query = query.or("approval_status.eq.published,approval_status.is.null");
      }

      if (category && category !== "all") {
        query = query.ilike("category", category);
      }
      
      const res = await query.order("date", { ascending: false });
      if (res.data && res.data.length > 0) {
        blogs = res.data;
      }
    } catch (err) {
      console.warn("Supabase GET blogs list error:", err);
    }

    // Fallback to local db.json if Supabase returned no blogs
    if (!blogs || blogs.length === 0) {
      try {
        const localDb = getDb();
        blogs = localDb.blogs || [];
        if (category && category !== "all") {
          blogs = blogs.filter((b: any) => b.category?.toLowerCase() === category.toLowerCase());
        }
      } catch (err) {
        console.error("Local DB fetch error:", err);
      }
    }
    
    const mappedBlogs = (blogs || []).map((blog: any) => ({
      ...blog,
      slug: blog.slug || slugify(blog.title) || blog.id,
      readTime: blog.read_time || blog.readTime,
      images: Array.isArray(blog.images) ? blog.images : [],
      videos: Array.isArray(blog.videos) ? blog.videos : [],
    }));
    
    return NextResponse.json({ success: true, data: mappedBlogs }, { headers });
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
    const { title, slug, category, author, content, date, readTime, image, images, videos, section, is_show_featured_page, role, approval_status } = body;
    
    if (!title || !category || !author || !content || !date || !readTime) {
      return NextResponse.json({ success: false, error: "Missing required blog fields" }, { status: 400 });
    }

    const finalSlug = slug ? slugify(slug) : slugify(title);
    
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
      approval_status: role === "super_admin" ? (approval_status || "published") : "pending_approval",
    };
    
    let insertedData = null;
    const { data, error } = await supabaseServer
      .from("blogs")
      .insert([newBlogDb])
      .select()
      .single();

    if (error) {
      // Try inserting without slug column if Supabase table lacks slug column
      const { slug: _, ...dbWithoutSlug } = newBlogDb;
      const { data: retryData, error: retryErr } = await supabaseServer
        .from("blogs")
        .insert([dbWithoutSlug])
        .select()
        .single();
      
      if (retryErr) {
        console.warn("Supabase insert failed, persisting to local db.json:", retryErr.message);
      } else {
        insertedData = retryData;
      }
    } else {
      insertedData = data;
    }

    // Also update local db.json
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
      });
      saveDb(db);
    } catch (dbErr) {
      console.error("Failed to sync db.json:", dbErr);
    }
    
    const resultObj = insertedData || newBlogDb;
    const mapped = {
      ...resultObj,
      slug: finalSlug,
      readTime: (resultObj as any).read_time || readTime,
    };
    
    return NextResponse.json({ success: true, data: mapped }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create blog" }, { status: 500 });
  }
}

/**
 * PUT Handler - Updates an existing blog post
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, slug, title, category, author, content, date, readTime, image, images, videos, section, is_show_featured_page, role, approval_status } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Blog ID is required" }, { status: 400 });
    }
    
    const updates: any = {};
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
    
    if (role === "super_admin" && approval_status) {
      updates.approval_status = approval_status;
    } else if (role !== "super_admin") {
      updates.approval_status = "pending_approval";
    }
    
    let updatedData = null;
    const { data, error } = await supabaseServer
      .from("blogs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error && updates.slug) {
      // Try update without slug column if Supabase table lacks slug column
      const { slug: _, ...updatesWithoutSlug } = updates;
      const { data: retryData } = await supabaseServer
        .from("blogs")
        .update(updatesWithoutSlug)
        .eq("id", id)
        .select()
        .single();
      updatedData = retryData;
    } else {
      updatedData = data;
    }

    // Sync to local db.json
    try {
      const db = getDb();
      if (db.blogs) {
        const idx = db.blogs.findIndex((b: any) => b.id === id);
        if (idx !== -1) {
          db.blogs[idx] = {
            ...db.blogs[idx],
            ...(slug !== undefined ? { slug: slugify(slug) } : {}),
            ...(title !== undefined ? { title } : {}),
            ...(category !== undefined ? { category } : {}),
            ...(author !== undefined ? { author } : {}),
            ...(content !== undefined ? { content } : {}),
            ...(date !== undefined ? { date } : {}),
            ...(readTime !== undefined ? { readTime } : {}),
            ...(image !== undefined ? { image } : {}),
          };
          saveDb(db);
        }
      }
    } catch (dbErr) {
      console.error("Failed to sync db.json:", dbErr);
    }
    
    const mapped = {
      ...(updatedData || updates),
      slug: updates.slug || (updatedData as any)?.slug,
      readTime: (updatedData as any)?.read_time || readTime,
    };
    
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
    
    const { error } = await supabaseServer
      .from("blogs")
      .delete()
      .eq("id", id);
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: "Blog post removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to remove blog" }, { status: 500 });
  }
}


