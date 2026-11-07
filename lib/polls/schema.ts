/** Preview poll data can be isolated without changing the production table namespace. */
export function pollSchema(value = process.env.POLL_DATABASE_SCHEMA): string {
  if (!value || value === "private") return "private";
  if (!/^preview_polls_[a-z0-9_]{1,40}$/.test(value)) {
    throw new Error(
      "Invalid POLL_DATABASE_SCHEMA: use private or a preview_polls_ namespace",
    );
  }
  return value;
}

export function scopePollSql(query: string, schema: string): string {
  const checked = pollSchema(schema);
  if (checked === "private") return query;
  return query.replace(/\bprivate\.(polls|poll_[a-z_]+)\b/g, `${checked}.$1`);
}
