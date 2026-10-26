import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helpers";
import { adminPageQuery } from "@/lib/admin-pagination";
import { readAdminOptions } from "@/lib/admin-lists";
export async function GET(request: Request) {
  const caller = await authenticateRequest(request, { role: "admin" });
  if (!caller.ok) return caller.response;
  const params = new URL(request.url).searchParams,
    kind = params.get("kind");
  if (!["authors", "categories", "tags"].includes(kind ?? ""))
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  const selected = (params.get("selected") ?? "")
    .split(",")
    .filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      ),
    )
    .slice(0, 50);
  return NextResponse.json(
    await readAdminOptions(
      kind!,
      adminPageQuery({ search: params.get("search") ?? "" }),
      selected,
    ),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
