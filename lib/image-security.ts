type SupportedImageFormat =
  | "jpeg"
  | "png"
  | "gif"
  | "webp"
  | "bmp"
  | "heic"
  | "heif"
  | "avif";

const HEIF_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "mif1",
  "msf1",
]);

const AVIF_BRANDS = new Set(["avif", "avis"]);

const MIME_TO_FORMATS: Record<string, SupportedImageFormat[]> = {
  "image/jpeg": ["jpeg"],
  "image/png": ["png"],
  "image/gif": ["gif"],
  "image/webp": ["webp"],
  "image/bmp": ["bmp"],
  "image/heic": ["heic", "heif"],
  "image/heif": ["heic", "heif"],
  "image/avif": ["avif"],
};

function isGif(buffer: Buffer) {
  return buffer.length >= 6 && buffer.subarray(0, 6).toString("ascii").startsWith("GIF8");
}

function isWebp(buffer: Buffer) {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

function getFtypBrand(buffer: Buffer) {
  if (buffer.length < 12 || buffer.subarray(4, 8).toString("ascii") !== "ftyp") {
    return null;
  }

  return buffer.subarray(8, 12).toString("ascii").toLowerCase();
}

export function detectImageFormat(buffer: Buffer): SupportedImageFormat | null {
  if (buffer.length < 4) {
    return null;
  }

  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }

  if (isGif(buffer)) {
    return "gif";
  }

  if (isWebp(buffer)) {
    return "webp";
  }

  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return "bmp";
  }

  const brand = getFtypBrand(buffer);
  if (brand) {
    if (AVIF_BRANDS.has(brand)) {
      return "avif";
    }

    if (HEIF_BRANDS.has(brand)) {
      return brand === "heic" || brand.startsWith("hei") ? "heic" : "heif";
    }
  }

  return null;
}

export function sanitizeObjectKeySegment(value: string, fallback = "default") {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || fallback;
}

export async function readValidatedImageFile(
  file: File,
  options: {
    maxBytes: number;
    allowedMimeTypes: readonly string[];
  }
) {
  if (file.size > options.maxBytes) {
    throw new Error(`File ${file.name} is too large.`);
  }

  if (!options.allowedMimeTypes.includes(file.type)) {
    throw new Error(`File type ${file.type || "unknown"} is not allowed.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedFormat = detectImageFormat(buffer);

  if (!detectedFormat) {
    throw new Error(`Invalid file signature for ${file.name}.`);
  }

  const allowedFormats = MIME_TO_FORMATS[file.type] || [];
  if (!allowedFormats.includes(detectedFormat)) {
    throw new Error(`File signature does not match MIME type for ${file.name}.`);
  }

  return { buffer, detectedFormat };
}
