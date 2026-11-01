/** datetime-local values use the admin browser's time zone, never the server's zone. */
export function toLocalPublicationInput(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalPublicationInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(value);
  // Reject nonexistent local times (including DST gaps) instead of silently shifting them.
  return toLocalPublicationInput(value) === value ? date.toISOString() : null;
}
