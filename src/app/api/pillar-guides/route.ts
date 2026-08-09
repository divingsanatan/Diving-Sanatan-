import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/utils/db";

/**
 * GET Handler - Retrieves pillar guides
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const db = getDb();
    const pillarGuides = db.pillarGuides || [];

    if (id) {
      const guide = pillarGuides.find((g: any) => g.id === id);
      if (!guide) {
        return NextResponse.json({ success: false, error: "Pillar Guide not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: guide });
    }

    return NextResponse.json({ success: true, data: pillarGuides });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to read pillar guides" }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new pillar guide
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, category, image, articles } = body;

    if (!title?.trim() || !description?.trim() || !category?.trim()) {
      return NextResponse.json({ success: false, error: "Title, description, and category are required" }, { status: 400 });
    }

    const db = getDb();
    db.pillarGuides = db.pillarGuides || [];

    const newGuide = {
      id: `pl-pillar-${Math.random().toString(36).substring(2, 9)}`,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      readTime: `${articles ? articles.length : 0} Articles`,
      image: image?.trim() || "",
      articles: Array.isArray(articles) ? articles.map((art: any) => ({
        title: art.title?.trim() || "Untitled Sub-article",
        link: art.link?.trim() || "#",
        readTime: art.readTime?.trim() || "5 Min Read"
      })) : []
    };

    db.pillarGuides.unshift(newGuide);
    saveDb(db);

    return NextResponse.json({ success: true, data: newGuide }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to create pillar guide" }, { status: 500 });
  }
}

/**
 * PUT Handler - Updates an existing pillar guide
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, category, image, articles } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Pillar Guide ID is required" }, { status: 400 });
    }

    if (!title?.trim() || !description?.trim() || !category?.trim()) {
      return NextResponse.json({ success: false, error: "Title, description, and category are required" }, { status: 400 });
    }

    const db = getDb();
    db.pillarGuides = db.pillarGuides || [];

    const guideIdx = db.pillarGuides.findIndex((g: any) => g.id === id);
    if (guideIdx === -1) {
      return NextResponse.json({ success: false, error: "Pillar Guide not found" }, { status: 404 });
    }

    db.pillarGuides[guideIdx] = {
      ...db.pillarGuides[guideIdx],
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      readTime: `${articles ? articles.length : 0} Articles`,
      image: image?.trim() || "",
      articles: Array.isArray(articles) ? articles.map((art: any) => ({
        title: art.title?.trim() || "Untitled Sub-article",
        link: art.link?.trim() || "#",
        readTime: art.readTime?.trim() || "5 Min Read"
      })) : []
    };

    saveDb(db);

    return NextResponse.json({ success: true, data: db.pillarGuides[guideIdx] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to update pillar guide" }, { status: 500 });
  }
}

/**
 * DELETE Handler - Deletes a pillar guide
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Pillar Guide ID is required" }, { status: 400 });
    }

    const db = getDb();
    db.pillarGuides = db.pillarGuides || [];

    const guideExists = db.pillarGuides.some((g: any) => g.id === id);
    if (!guideExists) {
      return NextResponse.json({ success: false, error: "Pillar Guide not found" }, { status: 404 });
    }

    db.pillarGuides = db.pillarGuides.filter((g: any) => g.id !== id);
    saveDb(db);

    return NextResponse.json({ success: true, message: "Pillar Guide removed successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to delete pillar guide" }, { status: 500 });
  }
}
