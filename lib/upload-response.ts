type UploadedAsset = string | { url?: string | null } | null | undefined;

type UploadResponse = {
  urls?: UploadedAsset[];
};

export function extractFirstUploadUrl(response: unknown): string {
  const payload = response as UploadResponse | null | undefined;
  const first = payload?.urls?.[0];

  if (typeof first === "string" && first.length > 0) {
    return first;
  }

  if (
    first &&
    typeof first === "object" &&
    typeof first.url === "string" &&
    first.url.length > 0
  ) {
    return first.url;
  }

  throw new Error("รูปแบบข้อมูลตอบกลับไม่ถูกต้อง");
}
