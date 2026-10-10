import { NextResponse } from "next/server";
import { parse } from "node-html-parser";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/network-security";
import { fetchMetadataHtml } from "@/lib/metadata-fetch";
export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get("url");
  if (!input || input.length > 4096) return NextResponse.json({ error: "A valid URL is required" }, { status: 400 });
  let target: URL;
  try { target = new URL(input); if (!["https:", "http:"].includes(target.protocol)) throw new Error(); }
  catch { return NextResponse.json({ error: "A valid HTTP(S) URL is required" }, { status: 400 }); }
  const limit = await checkRateLimit(`metadata:${getClientIp(request.headers)}`, 20, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many metadata requests" }, { status: 429 });
  const fallback = (url: URL) => ({ title: (url.pathname.split("/").filter(Boolean).pop() || url.hostname).slice(0, 300), icon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url.hostname)}&sz=128` });
  try {
    const result = await fetchMetadataHtml(input);
    target = result.url;
    const document = parse(result.html);
    const title = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || document.querySelector('meta[name="twitter:title"]')?.getAttribute("content") || document.querySelector("title")?.textContent || fallback(target).title;
    const rawIcon = document.querySelector('link[rel="icon"]')?.getAttribute("href") || document.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") || document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href") || document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "/favicon.ico";
    let icon = fallback(target).icon;
    if (rawIcon.length <= 4096) {
      try { const candidate = new URL(rawIcon, target); if (["https:", "http:"].includes(candidate.protocol) && !candidate.username && !candidate.password) icon = candidate.toString(); } catch { /* fallback */ }
    }
    return NextResponse.json({ title: title.trim().slice(0, 300), icon });
  } catch {
    return NextResponse.json(fallback(target));
  }
}
