import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

// GET /api/comments - Fetch comments for a manga
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mangaId = searchParams.get("mangaId");
  const imageIndex = searchParams.get("imageIndex");

  if (!mangaId) {
    return NextResponse.json({ error: "mangaId is required" }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: {
        mangaId,
        imageIndex: imageIndex !== null ? parseInt(imageIndex) : null,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        votes: {
          select: {
            userId: true,
            value: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
            votes: {
              select: {
                userId: true,
                value: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น" }, { status: 401 });
  }

  // Rate limiting: 20 comments per 15 minutes per user
  const rateLimit = await checkRateLimit(
    `comment:${session.user.id}`,
    20, // max 20 comments
    15 * 60 * 1000 // per 15 minutes
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `คุณคอมเมนต์เร็วเกินไป กรุณารอ ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} นาที` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { mangaId, content, imageIndex, imageUrl, parentId } = body;

    if (!mangaId || !content?.trim()) {
      return NextResponse.json({ error: "mangaId and content are required" }, { status: 400 });
    }

    // Security: จำกัดความยาว content
    const MAX_CONTENT_LENGTH = 500;
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `ความคิดเห็นต้องไม่เกิน ${MAX_CONTENT_LENGTH} ตัวอักษร` }, { status: 400 });
    }

    // Security: ตรวจสอบ imageUrl ว่าเป็น URL ที่ถูกต้อง
    if (imageUrl) {
      try {
        new URL(imageUrl);
        const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
        
        // Fail fast if R2_PUBLIC_URL is not configured
        if (!R2_PUBLIC_URL) {
          console.error("R2_PUBLIC_URL environment variable is not set");
          return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }
        
        // Only allow URLs from our R2 bucket or local uploads
        if (!imageUrl.startsWith(R2_PUBLIC_URL) && !imageUrl.startsWith('/uploads/')) {
          return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid image URL format" }, { status: 400 });
      }
    }

    // Verify manga exists and check if hidden
    const manga = await prisma.manga.findUnique({ where: { id: mangaId } });
    if (!manga) {
      return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    }

    // Security (IDOR): Don't allow comments on hidden manga (unless admin)
    const userRole = (session.user as { role?: string }).role;
    if (manga.isHidden && userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Cannot comment on hidden manga" }, { status: 403 });
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
    }

    // Sanitize content - ป้องกัน XSS (basic)
    const sanitizedContent = content.trim()
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const comment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        imageUrl: imageUrl || null,
        mangaId,
        userId: session.user.id,
        imageIndex: typeof imageIndex === "number" ? imageIndex : null,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        votes: true,
        replies: true,
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
