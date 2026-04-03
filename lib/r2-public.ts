const DEFAULT_R2_PUBLIC_URL =
  "https://pub-1f8d25d164134702943300ef6d01fc35.r2.dev";

export const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL || DEFAULT_R2_PUBLIC_URL;

export function getR2PublicHostname() {
  try {
    return new URL(R2_PUBLIC_URL).hostname;
  } catch {
    return new URL(DEFAULT_R2_PUBLIC_URL).hostname;
  }
}

export function getR2PublicUrl(key: string) {
  return `${R2_PUBLIC_URL.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}
