import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles as usersTable, comments as commentsTable, mangaSubmissions as submissionsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth-helpers";
import { eq, desc, sql } from "drizzle-orm";

// GET - List all users with counts
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const authError = requireAdmin(session);
    if (authError) return authError;

    const usersQuery = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      username: usersTable.username,
      image: usersTable.image,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
      commentsCount: sql<number>`count(distinct ${commentsTable.id})::int`,
      submissionsCount: sql<number>`count(distinct ${submissionsTable.id})::int`,
    })
      .from(usersTable)
      .leftJoin(commentsTable, eq(usersTable.id, commentsTable.userId))
      .leftJoin(submissionsTable, eq(usersTable.id, submissionsTable.userId))
      .groupBy(usersTable.id)
      .orderBy(desc(usersTable.createdAt));

    const formattedUsers = usersQuery.map(user => ({
      ...user,
      _count: {
        comments: user.commentsCount,
        submissions: user.submissionsCount
      }
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// PUT - Update user role
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    // Normalize role to lowercase for storage
    const normalizedRole = role.toLowerCase();
    if (!["user", "admin"].includes(normalizedRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent self-demotion
    if (userId === session.user.id && normalizedRole !== "admin") {
      return NextResponse.json(
        { error: "Cannot demote yourself" },
        { status: 400 }
      );
    }

    const [updatedUser] = await db.update(usersTable)
      .set({ role: normalizedRole, updatedAt: new Date().toISOString() })
      .where(eq(usersTable.id, userId))
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        username: usersTable.username,
        role: usersTable.role,
      });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
