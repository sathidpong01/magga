export const adDevices = ["all", "mobile", "desktop"] as const;
export const adPlacements = ["grid", "header", "footer", "manga-end", "floating", "modal"] as const;

export function adDeviceDisplay(device?: string) {
  return device === "mobile" ? { xs: "block", md: "none" }
    : device === "desktop" ? { xs: "none", md: "block" } : "block";
}

export function adCtr(impressions: number, clicks: number) {
  return impressions > 0 ? (clicks / impressions * 100).toFixed(2) : "0.00";
}
