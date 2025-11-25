import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Helper to get domain for favicon service
    const getFaviconUrl = (targetUrl: string) => {
      try {
        const domain = new URL(targetUrl).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      } catch {
        return "/favicon.ico";
      }
    };

    // Helper to extract readable title from URL
    const getTitleFromUrl = (targetUrl: string) => {
      try {
        const urlObj = new URL(targetUrl);
        // Remove protocol and www
        let name = urlObj.pathname.split('/').filter(Boolean).pop();
        if (!name) name = urlObj.hostname;
        return name;
      } catch {
        return targetUrl;
      }
    };

    if (!response.ok) {
      console.warn(`Failed to fetch metadata for ${url}: ${response.status} ${response.statusText}`);
      return NextResponse.json({
        title: getTitleFromUrl(url),
        icon: getFaviconUrl(url),
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
        title = getTitleFromUrl(url);
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
           const urlObj = new URL(url);
           icon = new URL(icon, urlObj.origin).toString();
        } else {
           icon = getFaviconUrl(url);
        }
      } catch {
        icon = getFaviconUrl(url);
      }
    }

    return NextResponse.json({
      title: title.trim(),
      icon: icon,
    });
  } catch (error) {
    console.error("Error fetching metadata:", error);
    
    // Fallback using Google Favicon service
    let fallbackIcon = "/favicon.ico";
    let fallbackTitle = url;
    try {
      const domain = new URL(url).hostname;
      fallbackIcon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      
      // Try to extract name from URL
      const urlObj = new URL(url);
      const pathName = urlObj.pathname.split('/').filter(Boolean).pop();
      if (pathName) fallbackTitle = pathName;
      else fallbackTitle = domain;
    } catch {}

    return NextResponse.json({
      title: fallbackTitle,
      icon: fallbackIcon,
    });
  }
}
