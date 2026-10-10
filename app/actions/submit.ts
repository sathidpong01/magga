"use server";
import { db } from "@/db";
import { categories, tags, authors } from "@/db/schema";
import { sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { authenticateCaller } from "@/lib/auth-helpers";
import { createSubmission, submissionSchema, SubmissionQuotaError } from "@/lib/submissions";

export async function submitManga(data: z.input<typeof submissionSchema>) {
  const result = await authenticateCaller(undefined, { fresh: true });
  if (!result.ok) return { error: result.error };
  const parsed = submissionSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };
  try {
    const submission = await createSubmission(result.caller.user.id, parsed.data);
    revalidatePath("/dashboard/submissions");
    return { success: true, submissionId: submission.id };
  } catch (error) {
    return { error: error instanceof SubmissionQuotaError ? error.message : "Failed to submit manga" };
  }
}
const nameSchema = z.string().trim().min(1).max(100);
async function createNamed(kind: "category" | "tag" | "author", input: string) {
  const result = await authenticateCaller(undefined, { fresh: true });
  if (!result.ok) return { error: result.error };
  const parsed = nameSchema.safeParse(input);
  if (!parsed.success) return { error: "Name must contain 1–100 characters" };
  const table = kind === "category" ? categories : kind === "tag" ? tags : authors;
  try {
    // A transaction-scoped lock serializes same-name creation, including names
    // containing literal % and _, which must never become ILIKE patterns.
    const value = await db.transaction(async tx => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`${kind}:${parsed.data.toLowerCase()}`}, 0))`);
      const [existing] = await tx.select().from(table).where(sql`lower(${table.name}) = lower(${parsed.data})`).limit(1);
      if (existing) return existing;
      const [created] = await tx.insert(table).values({ name: parsed.data }).returning();
      return created;
    });
    revalidateTag(kind === "category" ? "categories" : kind === "tag" ? "tags" : "authors", { expire: 0 });
    revalidatePath("/dashboard/submit");
    return { value };
  } catch { return { error: `Failed to create ${kind}` }; }
}
export async function createCategory(name: string) { const r = await createNamed("category", name); return r.error ? { error: r.error } : { category: r.value }; }
export async function createTag(name: string) { const r = await createNamed("tag", name); return r.error ? { error: r.error } : { tag: r.value }; }
export async function createAuthor(name: string) { const r = await createNamed("author", name); return r.error ? { error: r.error } : { author: r.value }; }
