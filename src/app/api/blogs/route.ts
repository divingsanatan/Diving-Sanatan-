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
      const { data: blog, error } = await supabaseServer
        .from("blogs")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error || !blog) {
        return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404 });
      }
      
      const mappedBlog = {
        ...blog,
        readTime: blog.read_time,
      };
      
      return NextResponse.json({ success: true, data: mappedBlog });
    }
    
    let query = supabaseServer.from("blogs").select("*");
    
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
    }));
    
    return NextResponse.json({ success: true, data: mappedBlogs });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to read blogs data" }, { status: 500 });
  }
}

