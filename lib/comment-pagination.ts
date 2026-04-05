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
  createdAt: Date | string | null | undefined
): string | null {
  if (!createdAt) {
    return null;
  }

  const cursorDate =
    createdAt instanceof Date ? createdAt : new Date(createdAt);

  return Number.isNaN(cursorDate.getTime())
    ? null
    : cursorDate.toISOString();
}
