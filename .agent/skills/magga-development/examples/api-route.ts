// Example: Protected API route with proper error handling and validation
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const manga = await db.query.manga.findMany({
      where: eq(mangaTable.authorId, session.user.id), // Example: assumes userId maps to authorId
      with: {
        category: true,
        mangaTags_mangaId: {
          with: { tag_tagId: true }
        }
      },
      orderBy: [desc(mangaTable.createdAt)],
    });

    return NextResponse.json(manga);
  } catch (error) {
    console.error("Error fetching manga:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.categoryId) {
      return NextResponse.json(
        { error: "Title and category are required" },
        { status: 400 }
      );
    }

    const [manga] = await db.insert(mangaTable).values({
      title: body.title,
      description: body.description,
      categoryId: body.categoryId,
      authorId: session.user.id,
      status: body.status || "DRAFT",
    }).returning();

    return NextResponse.json(manga, { status: 201 });
  } catch (error) {
    console.error("Error creating manga:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
