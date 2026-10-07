/**
 * Comment cursor-based pagination utilities.
 * Client-safe: does not depend on database or server-only modules.
 */

export function parseCommentCursor(cursor: string | null): Date | null {
  if (!cursor) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}T/.test(cursor)) {
    return null;
  }

  const cursorDate = new Date(cursor);
  return Number.isNaN(cursorDate.getTime()) ? null : cursorDate;
}

export function getNextCommentCursor(
  createdAt: Date | string | null | undefined,
  id?: string
): string | null {
  if (!createdAt) {
    return null;
  }

  const cursorDate =
    createdAt instanceof Date ? createdAt : new Date(createdAt);

  if (Number.isNaN(cursorDate.getTime())) return null;
  // Postgres timestamps retain microseconds; Date alone truncates them and can skip rows.
  const precision = typeof createdAt === "string" ? createdAt.match(/\.(\d{4,6})/)?.[1] : undefined;
  const timestamp = precision ? cursorDate.toISOString().replace(/\.\d{3}Z$/,`.${precision}Z`) : cursorDate.toISOString();
  return `${timestamp}${id ? `|${id}` : ""}`;
}

export function parseCompositeCommentCursor(cursor: string | null): {createdAt:Date;id:string|null}|null {
  if (!cursor) return null;
  const parts = cursor.split("|");
  const createdAt = parseCommentCursor(parts[0]);
  if (!createdAt || parts.length>2 || (parts[1] && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parts[1]))) return null;
  return {createdAt,id:parts[1] || null};
}
