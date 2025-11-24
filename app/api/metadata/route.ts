import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch URL");
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Get Title
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      "Unknown Author";

    // Get Icon
    let icon =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href") ||
      "/favicon.ico";

    // Handle relative URLs for icon
    if (icon && !icon.startsWith("http")) {
      const urlObj = new URL(url);
      icon = new URL(icon, urlObj.origin).toString();
    }

    return NextResponse.json({
      title: title.trim(),
      icon: icon,
    });
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
