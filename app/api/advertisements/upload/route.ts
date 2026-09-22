import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";
import { storeAsset } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    const authError = requireAdmin(session);
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const stored = await storeAsset(file, { kind: "advertisement" });

    return NextResponse.json({ imageUrl: stored.url }, { status: 201 });
  } catch (error: any) {
    console.error("Error uploading ad image:", error);
    const status =
      typeof error?.message === "string" && /file|image|upload/i.test(error.message)
        ? 400
        : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to upload image" },
      { status }
    );
  }
}

