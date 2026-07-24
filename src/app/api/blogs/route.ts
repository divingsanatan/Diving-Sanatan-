import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

/**
 * GET Handler - Retrieves blog posts from Supabase
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    
    if (id) {
      let query = supabaseServer.from("blogs").select("*").eq("id", id);
      const adminView = searchParams.get("admin_view");
      if (adminView !== "true") {
        query = query.eq("approval_status", "published");
      }
      const { data: blog, error } = await query.single();
        
      if (error || !blog) {
        return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404 });
      }
      
      const mappedBlog = {
        ...blog,
        readTime: blog.read_time,
        images: Array.isArray(blog.images) ? blog.images : [],
        videos: Array.isArray(blog.videos) ? blog.videos : [],
      };
      
      return NextResponse.json({ success: true, data: mappedBlog });
    }
    
    let query = supabaseServer.from("blogs").select("*");
    
    const adminView = searchParams.get("admin_view");
    if (adminView !== "true") {
      query = query.eq("approval_status", "published");
    }

    if (category && category !== "all") {
      query = query.ilike("category", category);
    }
    
    const { data: blogs, error } = await query.order("date", { ascending: false });
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const mappedBlogs = (blogs || []).map((blog: any) => ({
      ...blog,
      readTime: blog.read_time,
      images: Array.isArray(blog.images) ? blog.images : [],
      videos: Array.isArray(blog.videos) ? blog.videos : [],
    }));
    
    return NextResponse.json({ success: true, data: mappedBlogs });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to read blogs data" }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new blog post
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, author, content, date, readTime, image, images, videos, section, is_show_featured_page, role, approval_status } = body;
    
    if (!title || !category || !author || !content || !date || !readTime) {
      return NextResponse.json({ success: false, error: "Missing required blog fields" }, { status: 400 });
    }
    
    const newBlogDb = {
      id: `bl-${Math.random().toString(36).substring(2, 9)}`,
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
    
    const { data, error } = await supabaseServer
      .from("blogs")
      .insert([newBlogDb])
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const mapped = {
      ...data,
      readTime: data.read_time,
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
    const { id, title, category, author, content, date, readTime, image, images, videos, section, is_show_featured_page, role, approval_status } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Blog ID is required" }, { status: 400 });
    }
    
    const updates: any = {};
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
    
    const { data, error } = await supabaseServer
      .from("blogs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const mapped = {
      ...data,
      readTime: data.read_time,
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


