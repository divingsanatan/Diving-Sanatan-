import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { getDb, saveDb, TeamMember } from "@/utils/db";

/**
 * GET Handler - Retrieves team members
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Attempt Supabase fetch
    try {
      if (id) {
        const { data, error } = await supabaseServer
          .from("team_members")
          .select("*")
          .eq("id", id)
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, data });
        }
      } else {
        const { data, error } = await supabaseServer
          .from("team_members")
          .select("*")
          .order("order_index", { ascending: true });

        if (!error && data) {
          return NextResponse.json({ success: true, data: data || [] });
        }
      }
    } catch (sbError) {
      console.warn("Supabase team_members query failed, using local DB fallback:", sbError);
    }

    // Local DB fallback
    const db = getDb();
    const teamMembers = db.team_members || [];

    if (id) {
      const found = teamMembers.find((m) => m.id === id);
      if (!found) {
        return NextResponse.json({ success: false, error: "Team member not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: found });
    }

    // Sort by order_index ascending if present
    const sorted = [...teamMembers].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    return NextResponse.json({ success: true, data: sorted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch team members" }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new team member
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, image, bio, order_index } = body;

    if (!name || !role) {
      return NextResponse.json({ success: false, error: "Name and Role are required" }, { status: 400 });
    }

    const newMember: TeamMember = {
      id: `team-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      image: image || "https://i.pravatar.cc/100?img=49",
      bio: bio ? bio.trim() : "",
      order_index: typeof order_index === "number" ? order_index : Date.now(),
      createdAt: new Date().toISOString(),
    };

    // Attempt Supabase insert
    let sbSuccess = false;
    try {
      const { data, error } = await supabaseServer
        .from("team_members")
        .insert([newMember])
        .select()
        .single();

      if (!error && data) {
        sbSuccess = true;
      }
    } catch (e) {
      console.warn("Supabase insert for team_members failed:", e);
    }

    // Local DB sync / fallback
    const db = getDb();
    if (!db.team_members) db.team_members = [];
    db.team_members.push(newMember);
    saveDb(db);

    return NextResponse.json({ success: true, data: newMember }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to create team member" }, { status: 500 });
  }
}

/**
 * PUT Handler - Updates a team member
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, role, image, bio, order_index } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Team Member ID is required" }, { status: 400 });
    }

    const updates: Partial<TeamMember> = {};
    if (name !== undefined) updates.name = name.trim();
    if (role !== undefined) updates.role = role.trim();
    if (image !== undefined) updates.image = image.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (order_index !== undefined) updates.order_index = Number(order_index);

    // Attempt Supabase update
    try {
      await supabaseServer
        .from("team_members")
        .update(updates)
        .eq("id", id);
    } catch (e) {
      console.warn("Supabase update for team_members failed:", e);
    }

    // Local DB update
    const db = getDb();
    if (!db.team_members) db.team_members = [];
    const index = db.team_members.findIndex((m) => m.id === id);
    if (index !== -1) {
      db.team_members[index] = { ...db.team_members[index], ...updates };
      saveDb(db);
      return NextResponse.json({ success: true, data: db.team_members[index] });
    }

    const updatedMember = { id, ...updates };
    return NextResponse.json({ success: true, data: updatedMember });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to update team member" }, { status: 500 });
  }
}

/**
 * DELETE Handler - Removes a team member
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Team Member ID is required" }, { status: 400 });
    }

    // Attempt Supabase delete
    try {
      await supabaseServer
        .from("team_members")
        .delete()
        .eq("id", id);
    } catch (e) {
      console.warn("Supabase delete for team_members failed:", e);
    }

    // Local DB update
    const db = getDb();
    if (db.team_members) {
      db.team_members = db.team_members.filter((m) => m.id !== id);
      saveDb(db);
    }

    return NextResponse.json({ success: true, message: "Team member deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete team member" }, { status: 500 });
  }
}
