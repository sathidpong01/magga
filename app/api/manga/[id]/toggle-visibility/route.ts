import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get current manga to toggle its visibility
    const [currentManga] = await db
      .select({ isHidden: mangaTable.isHidden })
      .from(mangaTable)
      .where(eq(mangaTable.id, id))
      .limit(1);

    if (!currentManga) {
      return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    }

    // Toggle the visibility
    const [updatedManga] = await db
      .update(mangaTable)
      .set({ isHidden: !currentManga.isHidden })
      .where(eq(mangaTable.id, id))
      .returning();

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/manga");
    revalidatePath("/");
    revalidateTag("manga-list", "max");

    return NextResponse.json(updatedManga);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to toggle visibility" },
      { status: 500 }
    );
  }
}
