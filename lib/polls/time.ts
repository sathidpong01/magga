const OFFSET = 7 * 60 * 60 * 1000;
export function toBangkokInput(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Date(timestamp + OFFSET).toISOString().slice(0, 16)
    : "";
}
export function fromBangkokInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}:00+07:00`);
  if (
    !Number.isFinite(timestamp) ||
    toBangkokInput(new Date(timestamp).toISOString()) !== value
  )
    return null;
  return new Date(timestamp).toISOString();
}
