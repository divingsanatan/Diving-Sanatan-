import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
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

    // Fetch existing user to prevent role changes on super_admin if not allowed,
    // or just to check if it's super_admin.
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
