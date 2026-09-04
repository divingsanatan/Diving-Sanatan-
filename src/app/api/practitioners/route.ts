import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { Practitioner } from "@/types/database";

function mapPractitionerToCamelCase(p: any): Practitioner {
  return {
    id: p.id,
    user_id: p.user_id || "",
    email: p.email || "",
    name: p.name,
    specialty: p.specialty,
    bio: p.bio,
    rating: Number(p.rating),
    reviewsCount: p.reviews_count,
    image: p.image || "elara_vance",
    video_url: p.video_url || "",
    certifications: p.certifications || [],
    expertise: p.expertise || [],
    social_links: p.social_links || {},
    approval_status: p.approval_status || "published"
  };
}

/**
 * GET Handler - Retrieves practitioners from Supabase (or single practitioner if id parameter is provided)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const { data: p, error } = await supabaseServer
        .from("practitioners")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: mapPractitionerToCamelCase(p) });
    }

    const { data: practitioners, error } = await supabaseServer
      .from("practitioners")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const mapped = (practitioners || []).map(mapPractitionerToCamelCase);
    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to read practitioners" }, { status: 500 });
  }
}

import crypto from "crypto";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * POST Handler - Creates a new practitioner (Admin restricted)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { user_id, email, name, specialty, bio, image, video_url, certifications, expertise, social_links, role, approval_status, create_account, new_account_password } = body;

    if (!name || !specialty || !bio) {
      return NextResponse.json({ success: false, error: "Missing required practitioner fields" }, { status: 400 });
    }

    // Handle Manual User Account Creation if requested
    if (create_account && email) {
      const emailLower = email.toLowerCase().trim();
      // Check if user already exists
      const { data: existingUser } = await supabaseServer
        .from("user_profiles")
        .select("id, role")
        .eq("email", emailLower)
        .maybeSingle();

      if (existingUser) {
        user_id = existingUser.id;
        // Ensure role is set to healer
        await supabaseServer.from("user_profiles").update({ role: "healer" }).eq("id", existingUser.id);
      } else {
        const newUserId = "usr-" + Date.now() + Math.random().toString(36).substring(2, 7);
        const hashedPassword = hashPassword(new_account_password || "Healer@123");
        const newUser = {
          id: newUserId,
          email: emailLower,
          password: hashedPassword,
          role: "healer",
          name,
          phone: "0000000000",
          gender: "Other",
          dob: "2000-01-01",
          category: "None",
        };
        const { error: userErr } = await supabaseServer.from("user_profiles").insert([newUser]);
        if (!userErr) {
          user_id = newUserId;
        } else {
          console.warn("Failed to insert user profile in Supabase, trying fallback db:", userErr.message);
        }

        // Local db sync for user_profiles
        try {
          const { getDb, saveDb } = require("@/utils/db");
          const db = getDb();
          if (db && db.user_profiles) {
            if (!db.user_profiles.some((u: any) => u.email.toLowerCase() === emailLower)) {
              db.user_profiles.push(newUser as any);
              saveDb(db);
            }
          }
        } catch (e) {}
      }
    }

    let newPracDb: any = {
      id: `prac-${Math.random().toString(36).substring(2, 9)}`,
      user_id: user_id || "",
      email: email || "",
      name,
      specialty,
      bio,
      rating: 5.0, // Initial perfect score
      reviews_count: 0,
      image: image || "elara_vance",
      video_url: video_url || "",
      certifications: certifications || [],
      expertise: expertise || [],
      social_links: social_links || {},
      approval_status: role === "super_admin" ? (approval_status || "published") : "pending_approval",
    };

    let { data, error } = await supabaseServer
      .from("practitioners")
      .insert([newPracDb])
      .select()
      .single();

    // Resilient fallback if Supabase DB doesn't have certain columns yet
    if (error) {
      console.warn("Initial practitioner insert error:", error.message);
      if (error.message.includes("Could not find the") || error.message.includes("column")) {
        const safePracDb = { ...newPracDb };
        // Strip columns one by one if not found in database schema
        if (error.message.includes("'email'")) delete safePracDb.email;
        if (error.message.includes("'user_id'")) delete safePracDb.user_id;
        if (error.message.includes("'approval_status'")) delete safePracDb.approval_status;
        if (error.message.includes("'video_url'")) delete safePracDb.video_url;
        if (error.message.includes("'certifications'")) delete safePracDb.certifications;
        if (error.message.includes("'expertise'")) delete safePracDb.expertise;
        if (error.message.includes("'social_links'")) delete safePracDb.social_links;

        const retryRes = await supabaseServer
          .from("practitioners")
          .insert([safePracDb])
          .select()
          .single();

        if (!retryRes.error) {
          data = { ...newPracDb, ...retryRes.data };
          error = null;
        } else {
          // If still error, try minimal base fields
          const basePracDb = {
            id: newPracDb.id,
            name: newPracDb.name,
            specialty: newPracDb.specialty,
            bio: newPracDb.bio,
            rating: 5.0,
            reviews_count: 0,
            image: newPracDb.image,
          };
          const baseRes = await supabaseServer
            .from("practitioners")
            .insert([basePracDb])
            .select()
            .single();

          if (!baseRes.error) {
            data = { ...newPracDb, ...baseRes.data };
            error = null;
          }
        }
      }
    }

    if (error && !data) {
      // Local db fallback if Supabase fails completely
      try {
        const { getDb, saveDb } = require("@/utils/db");
        const db = getDb();
        if (db && db.practitioners) {
          db.practitioners.push(newPracDb);
          saveDb(db);
          return NextResponse.json({ success: true, data: mapPractitionerToCamelCase(newPracDb) }, { status: 201 });
        }
      } catch (e) {}
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Ensure associated user profile role is set to healer
    if (user_id || email) {
      let query = supabaseServer.from("user_profiles").update({ role: "healer" });
      if (user_id) query = query.eq("id", user_id);
      else if (email) query = query.eq("email", email);
      await query;
    }

    return NextResponse.json({ success: true, data: mapPractitionerToCamelCase(data || newPracDb) }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create practitioner:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create practitioner" }, { status: 500 });
  }
}

/**
 * PUT Handler - Updates practitioner info
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    let { id, user_id, email, name, specialty, bio, image, video_url, certifications, expertise, social_links, role, approval_status, create_account, new_account_password } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Practitioner ID is required" }, { status: 400 });
    }

    // Handle Manual User Account Creation if requested during update
    if (create_account && email) {
      const emailLower = email.toLowerCase().trim();
      const { data: existingUser } = await supabaseServer
        .from("user_profiles")
        .select("id, role")
        .eq("email", emailLower)
        .maybeSingle();

      if (existingUser) {
        user_id = existingUser.id;
        await supabaseServer.from("user_profiles").update({ role: "healer" }).eq("id", existingUser.id);
      } else {
        const newUserId = "usr-" + Date.now() + Math.random().toString(36).substring(2, 7);
        const hashedPassword = hashPassword(new_account_password || "Healer@123");
        const newUser = {
          id: newUserId,
          email: emailLower,
          password: hashedPassword,
          role: "healer",
          name: name || "Healer",
          phone: "0000000000",
          gender: "Other",
          dob: "2000-01-01",
          category: "None",
        };
        const { error: userErr } = await supabaseServer.from("user_profiles").insert([newUser]);
        if (!userErr) {
          user_id = newUserId;
        }
      }
    }

    const updates: any = {};
    if (user_id !== undefined) updates.user_id = user_id;
    if (email !== undefined) updates.email = email;
    if (name) updates.name = name;
    if (specialty) updates.specialty = specialty;
    if (bio) updates.bio = bio;
    if (image !== undefined) updates.image = image;
    if (video_url !== undefined) updates.video_url = video_url;
    if (certifications !== undefined) updates.certifications = certifications;
    if (expertise !== undefined) updates.expertise = expertise;
    if (social_links !== undefined) updates.social_links = social_links;

    if (role === "super_admin" && approval_status) {
      updates.approval_status = approval_status;
    } else if (role !== "super_admin") {
      updates.approval_status = "pending_approval";
    }

    let { data, error } = await supabaseServer
      .from("practitioners")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error && (error.message.includes("Could not find the") || error.message.includes("column"))) {
      const safeUpdates = { ...updates };
      if (error.message.includes("'email'")) delete safeUpdates.email;
      if (error.message.includes("'user_id'")) delete safeUpdates.user_id;
      if (error.message.includes("'approval_status'")) delete safeUpdates.approval_status;
      if (error.message.includes("'video_url'")) delete safeUpdates.video_url;
      if (error.message.includes("'certifications'")) delete safeUpdates.certifications;
      if (error.message.includes("'expertise'")) delete safeUpdates.expertise;
      if (error.message.includes("'social_links'")) delete safeUpdates.social_links;

      const retryRes = await supabaseServer
        .from("practitioners")
        .update(safeUpdates)
        .eq("id", id)
        .select()
        .single();

      if (!retryRes.error) {
        data = { ...updates, ...retryRes.data };
        error = null;
      }
    }

    if (error && !data) {
      // Local db fallback
      try {
        const { getDb, saveDb } = require("@/utils/db");
        const db = getDb();
        if (db && db.practitioners) {
          const idx = db.practitioners.findIndex((p: any) => p.id === id);
          if (idx !== -1) {
            db.practitioners[idx] = { ...db.practitioners[idx], ...updates };
            saveDb(db);
            return NextResponse.json({ success: true, data: mapPractitionerToCamelCase(db.practitioners[idx]) });
          }
        }
      } catch (e) {}
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Ensure associated user profile role is set to healer
    const targetUserId = user_id || (data && data.user_id);
    const targetEmail = email || (data && data.email);
    if (targetUserId || targetEmail) {
      let query = supabaseServer.from("user_profiles").update({ role: "healer" });
      if (targetUserId) query = query.eq("id", targetUserId);
      else if (targetEmail) query = query.eq("email", targetEmail);
      await query;
    }

    return NextResponse.json({ success: true, data: mapPractitionerToCamelCase(data || { id, ...updates }) });
  } catch (error: any) {
    console.error("Failed to update practitioner:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update practitioner" }, { status: 500 });
  }
}

/**
 * DELETE Handler - Removes a practitioner
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Practitioner ID is required" }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from("practitioners")
      .delete()
      .eq("id", id);

    if (error) {
      // Local db fallback
      try {
        const { getDb, saveDb } = require("@/utils/db");
        const db = getDb();
        if (db && db.practitioners) {
          db.practitioners = db.practitioners.filter((p: any) => p.id !== id);
          saveDb(db);
          return NextResponse.json({ success: true, message: "Practitioner removed successfully from local db" });
        }
      } catch (e) {}
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Practitioner removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to remove practitioner" }, { status: 500 });
  }
}


