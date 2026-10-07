/** Requests containing identity or ownership must never use a shared cache. */
export async function commentRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store" });
  } catch {
    throw new Error("เชื่อมต่อไม่ได้ ข้อมูลที่กรอกยังอยู่ กรุณาลองใหม่");
  }
  let data: T & { error?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error("ระบบตอบกลับไม่สมบูรณ์ ข้อมูลที่กรอกยังอยู่ กรุณาลองใหม่");
  }
  if (!response.ok)
    throw new Error(data.error || "ทำรายการไม่สำเร็จ กรุณาลองใหม่");
  return data;
}
