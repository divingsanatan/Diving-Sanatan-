import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function syncPractitionerForUser(userId: string, userEmail: string, userName: string, userRole: string) {
  if (userRole !== "healer" && userRole !== "guru") return;

  try {
    const { data: existingPrac } = await supabaseServer
      .from("practitioners")
      .select("id, name, email, user_id")
      .or(`user_id.eq.${userId},email.eq.${userEmail}`)
      .maybeSingle();

    if (!existingPrac) {
      const newPracDb = {
        id: `prac-${Math.random().toString(36).substring(2, 9)}`,
        user_id: userId,
        email: userEmail,
        name: userName,
        specialty: "Holistic Healer & Practitioner",
        bio: `${userName} is a certified healer offering spiritual wellness and holistic therapy.`,
        rating: 5.0,
        reviews_count: 0,
        image: "elara_vance",
        approval_status: "published",
      };
      await supabaseServer.from("practitioners").insert([newPracDb]);

      try {
        const { getDb, saveDb } = require("@/utils/db");
        const db = getDb();
        if (db && db.practitioners) {
          if (!db.practitioners.some((p: any) => p.user_id === userId || p.email === userEmail)) {
            db.practitioners.push({
              id: newPracDb.id,
              user_id: userId,
              email: userEmail,
              name: userName,
              specialty: newPracDb.specialty,
              bio: newPracDb.bio,
              rating: 5.0,
              reviewsCount: 0,
              image: "elara_vance",
            });
            saveDb(db);
          }
        }
      } catch (e) {}
    } else {
      await supabaseServer
        .from("practitioners")
        .update({ user_id: userId, email: userEmail, name: userName })
        .eq("id", existingPrac.id);

      try {
        const { getDb, saveDb } = require("@/utils/db");
        const db = getDb();
        if (db && db.practitioners) {
          const pIdx = db.practitioners.findIndex((p: any) => p.id === existingPrac.id || p.user_id === userId || p.email === userEmail);
          if (pIdx !== -1) {
            db.practitioners[pIdx].user_id = userId;
            db.practitioners[pIdx].email = userEmail;
            db.practitioners[pIdx].name = userName;
            saveDb(db);
          }
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error("Failed to sync practitioner for user:", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data: users, error } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role, name, phone, gender, dob, category } = body;

    if (!email || !password || !role || !name) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseServer
      .from("user_profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email is already registered" }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);
    const userId = 'usr-' + Date.now() + Math.random().toString(36).substring(2, 7);

    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      role,
      name,
      phone: phone || "0000000000",
      gender: gender || "Other",
      dob: dob || "2000-01-01",
      category: category || "None"
    };

    const { error } = await supabaseServer
      .from("user_profiles")
      .insert([newUser]);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Auto-provision healer profile if role is healer or guru
    await syncPractitionerForUser(userId, email, name, role);

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, password, role, name, phone, gender, dob, category } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const { data: existingUser } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (!existingUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Protect super_admin role
    if (existingUser.role === 'super_admin' && role && role !== 'super_admin') {
      return NextResponse.json({ success: false, error: "Cannot downgrade a super_admin" }, { status: 403 });
    }

    const updates: any = {};
    if (email) updates.email = email;
    if (name) updates.name = name;
    if (role && existingUser.role !== 'super_admin') updates.role = role;
    if (phone) updates.phone = phone;
    if (gender) updates.gender = gender;
    if (dob) updates.dob = dob;
    if (category) updates.category = category;

    if (password && password.trim() !== "") {
      updates.password = hashPassword(password);
    }

    const { error } = await supabaseServer
      .from("user_profiles")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const finalRole = updates.role || existingUser.role;
    const finalEmail = updates.email || existingUser.email;
    const finalName = updates.name || existingUser.name;

    // Auto-provision/sync healer profile on role assignment
    await syncPractitionerForUser(id, finalEmail, finalName, finalRole);

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    // Check role before deleting
    const { data: existingUser } = await supabaseServer
      .from("user_profiles")
      .select("role")
      .eq("id", id)
      .single();

    if (existingUser && existingUser.role === 'super_admin') {
      return NextResponse.json({ success: false, error: "Cannot delete a super_admin account" }, { status: 403 });
    }

    const { error } = await supabaseServer
      .from("user_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}

