import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, validateExternalUrl } from "@/lib/network-security";

const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 5000;

function getFaviconUrl(targetUrl: URL) {
  return `https://www.google.com/s2/favicons?domain=${targetUrl.hostname}&sz=128`;
}

function getTitleFromUrl(targetUrl: URL) {
  let name = targetUrl.pathname.split("/").filter(Boolean).pop();
  if (!name) {
    name = targetUrl.hostname;
  }

  return name;
}

async function fetchMetadataResponse(targetUrl: URL, redirectsRemaining = MAX_REDIRECTS): Promise<{ response: Response; finalUrl: URL }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "manual",
      signal: controller.signal,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectsRemaining <= 0) {
        throw new Error("Redirect target is invalid");
      }

      const nextTarget = new URL(location, targetUrl);
      const validation = await validateExternalUrl(nextTarget.toString());
      if (!validation.valid || !validation.url) {
        throw new Error(validation.error || "Redirect target is not allowed");
      }

      return fetchMetadataResponse(validation.url, redirectsRemaining - 1);
    }

    return { response, finalUrl: targetUrl };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimit(`metadata:${clientIp}`, 20, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many metadata requests. Please try again later." }, { status: 429 });
  }

  const validation = await validateExternalUrl(url);
  if (!validation.valid || !validation.url) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const { response, finalUrl } = await fetchMetadataResponse(validation.url);

    if (!response.ok) {
      return NextResponse.json({
        title: getTitleFromUrl(finalUrl),
        icon: getFaviconUrl(finalUrl),
      });
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      return NextResponse.json({
        title: getTitleFromUrl(finalUrl),
        icon: getFaviconUrl(finalUrl),
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Get Title
    let title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text();

    if (!title) {
      title = getTitleFromUrl(finalUrl);
    }

    // Get Icon
    let icon =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href") ||
      $('meta[property="og:image"]').attr("content") ||
      "/favicon.ico";

    // Handle relative URLs for icon or missing icon
    if (!icon || (!icon.startsWith("http") && !icon.startsWith("data:"))) {
      try {
        if (icon && !icon.startsWith("data:")) {
           icon = new URL(icon, finalUrl.origin).toString();
        } else {
           icon = getFaviconUrl(finalUrl);
        }
      } catch {
        icon = getFaviconUrl(finalUrl);
      }
    }

    return NextResponse.json({
      title: title.trim(),
      icon: icon,
    });
  } catch (error) {
    let fallbackIcon = "/favicon.ico";
    let fallbackTitle = url;
    try {
      fallbackIcon = getFaviconUrl(validation.url);
      fallbackTitle = getTitleFromUrl(validation.url);
    } catch {}

    return NextResponse.json({
      title: fallbackTitle,
      icon: fallbackIcon,
    });
  }
}
