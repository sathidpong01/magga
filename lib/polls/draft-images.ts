import type { PollInput } from "./types";

export interface PollImageAsset {
  id: string;
  url: string;
}
interface DraftImage {
  file: File;
  preview: string;
  asset?: PollImageAsset;
}

/** Local files stay local until an explicit save. Keep acknowledged uploads for safe save retries. */
export class PollDraftImages {
  private images = new Map<string, DraftImage>();
  revision = 0;

  get pending() {
    return this.images.size > 0;
  }

  select(target: string, file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      throw new Error("รองรับเฉพาะรูป JPEG, PNG หรือ WebP");
    if (file.size === 0 || file.size > 3 * 1024 * 1024)
      throw new Error("รูปภาพต้องมีขนาดไม่เกิน 3 MB และไม่ใช่ไฟล์ว่าง");
    const preview = URL.createObjectURL(file);
    this.remove(target);
    this.images.set(target, { file, preview });
    this.revision++;
    return preview;
  }

  remove(target: string) {
    const image = this.images.get(target);
    if (!image) return;
    URL.revokeObjectURL(image.preview);
    this.images.delete(target);
    this.revision++;
  }

  clear() {
    for (const target of this.images.keys()) this.remove(target);
  }

  async prepare(
    input: PollInput,
    upload: (file: File, target: string) => Promise<PollImageAsset>,
  ) {
    const value = {
      ...input,
      options: input.options.map((option) => ({ ...option })),
    };
    for (const [target, image] of this.images) {
      const option = value.options.find((option) => option.id === target);
      if (target !== "cover" && !option) continue;
      image.asset ??= await upload(image.file, target);
      if (target === "cover") value.coverAssetId = image.asset.id;
      else if (option) {
        option.assetId = image.asset.id;
        option.mangaId = null;
      }
    }
    return value;
  }
}
