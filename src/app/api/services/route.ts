import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { Service } from "@/types/database";

// Helper to map Supabase service with categories join to Service model
function mapServiceCategories(s: any): Service {
  const relationLinks = s.service_categories || [];
  const categories = relationLinks
    .map((sc: any) => sc.categories?.name)
    .filter(Boolean) as string[];
  const categoryIds = relationLinks
    .map((sc: any) => sc.categories?.id)
    .filter(Boolean) as string[];
    
  return {
    id: s.id,
    name: s.name,
    price: Number(s.price),
    duration: s.duration,
    rating: Number(s.rating),
    practitioner: s.practitioner,
    image: s.image || "aura_balancing",
    description: s.description,
    categories,
    categoryIds,
    category: categories.join(", ") || s.category || "Uncategorized", // backward compatibility
    video_url: s.video_url || "",
    benefits: s.benefits || [],
    process: s.process || []
  };
}

/**
 * GET Handler - Retrieves and filters services from Supabase (with dynamic category join)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Support fetching a single service by ID
    const singleId = searchParams.get("id");
    if (singleId) {
      const { data: service, error } = await supabaseServer
        .from("services")
        .select(`
          *,
          service_categories (
            categories (
              id,
              name
            )
          )
        `)
        .eq("id", singleId)
        .single();
        
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      if (!service) {
        return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: mapServiceCategories(service) });
    }
    
    // Select all fields along with joined categories
    let supabaseQuery = supabaseServer
      .from("services")
      .select(`
        *,
        service_categories (
          categories (
            id,
            name
          )
        )
      `);
      
    // Apply basic SQL-level filters
    const maxPrice = searchParams.get("maxPrice");
    if (maxPrice) {
      supabaseQuery = supabaseQuery.lte("price", Number(maxPrice));
    }
    
    const duration = searchParams.get("duration");
    if (duration && duration !== "all") {
      supabaseQuery = supabaseQuery.ilike("duration", duration);
    }
    
    const { data: services, error } = await supabaseQuery.order("name", { ascending: true });
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Map records to include the categories array
    let mappedServices = (services || []).map(mapServiceCategories);
    
    // Apply JS-level filters for nested relation matching
    const category = searchParams.get("category");
    if (category && category !== "all") {
      mappedServices = mappedServices.filter(s => 
        s.categories?.some(c => c.toLowerCase() === category.toLowerCase())
      );
    }
    
    const query = searchParams.get("query");
    if (query) {
      const q = query.toLowerCase();
      mappedServices = mappedServices.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.description.toLowerCase().includes(q) ||
        s.practitioner.toLowerCase().includes(q) ||
        s.categories?.some(c => c.toLowerCase().includes(q))
      );
    }
    
    return NextResponse.json({ success: true, data: mappedServices });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to read services catalog" }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new service (Admin restricted)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, duration, practitioner, description, categoryIds, image, video_url, benefits, process } = body;
    
    if (!name || !price || !duration || !practitioner || !description) {
      return NextResponse.json({ success: false, error: "Missing required service details" }, { status: 400 });
    }
    
    const serviceId = `srv-${Math.random().toString(36).substring(2, 9)}`;
    const newService = {
      id: serviceId,
      name,
      price: Number(price),
      duration,
      rating: 5.0, // Default for new service
      practitioner,
      image: image || "aura_balancing",
      description,
      category: "", // Temporary fallback for backward compatibility
      video_url: video_url || "",
      benefits: benefits || [],
      process: process || []
    };
    
    // 1. Insert service
    const { error: serviceError } = await supabaseServer
      .from("services")
      .insert([newService]);
      
    if (serviceError) {
      return NextResponse.json({ success: false, error: serviceError.message }, { status: 500 });
    }
    
    // 2. Insert many-to-many categories mapping
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      const relations = categoryIds.map((catId: string) => ({
        service_id: serviceId,
        category_id: catId
      }));
      
      const { error: relError } = await supabaseServer
        .from("service_categories")
        .insert(relations);
        
      if (relError) {
        console.error("Failed to insert service category associations:", relError.message);
      }
    }
    
    // 3. Fetch full service details with joined categories
    const { data: finalData, error: fetchError } = await supabaseServer
      .from("services")
      .select(`
        *,
        service_categories (
          categories (
            id,
            name
          )
        )
      `)
      .eq("id", serviceId)
      .single();
      
    if (fetchError || !finalData) {
      return NextResponse.json({ success: true, data: { ...newService, categories: [], categoryIds: [] } }, { status: 201 });
    }
    
    return NextResponse.json({ success: true, data: mapServiceCategories(finalData) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to save service" }, { status: 500 });
  }
}

/**
 * PUT Handler - Updates an existing service (Admin restricted)
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, price, duration, practitioner, description, categoryIds, image, video_url, benefits, process } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Service ID is required for updating" }, { status: 400 });
    }
    
    const updates: any = {};
    if (name) updates.name = name;
    if (price !== undefined) updates.price = Number(price);
    if (duration) updates.duration = duration;
    if (practitioner) updates.practitioner = practitioner;
    if (description) updates.description = description;
    if (image !== undefined) updates.image = image;
    if (video_url !== undefined) updates.video_url = video_url;
    if (benefits !== undefined) updates.benefits = benefits;
    if (process !== undefined) updates.process = process;
    
    // 1. Update basic fields
    if (Object.keys(updates).length > 0) {
      const { error: serviceError } = await supabaseServer
        .from("services")
        .update(updates)
        .eq("id", id);
        
      if (serviceError) {
        return NextResponse.json({ success: false, error: serviceError.message }, { status: 500 });
      }
    }
    
    // 2. Synchronize many-to-many categories mapping
    if (categoryIds && Array.isArray(categoryIds)) {
      // Delete existing relationships
      await supabaseServer
        .from("service_categories")
        .delete()
        .eq("service_id", id);
        
      // Insert new ones
      if (categoryIds.length > 0) {
        const relations = categoryIds.map((catId: string) => ({
          service_id: id,
          category_id: catId
        }));
        
        const { error: relError } = await supabaseServer
          .from("service_categories")
          .insert(relations);
          
        if (relError) {
          console.error("Failed to update service category associations:", relError.message);
        }
      }
    }
    
    // 3. Fetch full updated service details
    const { data: finalData, error: fetchError } = await supabaseServer
      .from("services")
      .select(`
        *,
        service_categories (
          categories (
            id,
            name
          )
        )
      `)
      .eq("id", id)
      .single();
      
    if (fetchError || !finalData) {
      return NextResponse.json({ success: false, error: "Failed to fetch updated service record" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: mapServiceCategories(finalData) });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update service" }, { status: 500 });
  }
}

/**
 * DELETE Handler - Removes a service from catalog
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Service ID is required for deletion" }, { status: 400 });
    }
    
    const { error } = await supabaseServer
      .from("services")
      .delete()
      .eq("id", id);
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete service" }, { status: 500 });
  }
}
