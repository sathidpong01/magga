import LanguageIcon from "@mui/icons-material/Language";
import TelegramIcon from "@mui/icons-material/Telegram";
import XIcon from "@mui/icons-material/X";

// Inline icons avoid third-party favicon requests, cookies and missing images.
export default function SocialLinkIcon({ url }: { url: string }) {
  let hostname = "";
  try { hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { /* generic website icon */ }
  if (hostname === "patreon.com") return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><circle cx="15" cy="8.5" r="5.5" fill="#f87171" /><rect x="4" y="3" width="3.5" height="18" rx="1.5" fill="#f87171" /></svg>;
  if (hostname === "x.com" || hostname === "twitter.com") return <XIcon sx={{ fontSize: 20 }} />;
  if (hostname === "t.me" || hostname === "telegram.me") return <TelegramIcon sx={{ fontSize: 20 }} />;
  if (hostname === "pixiv.net" || hostname.endsWith(".pixiv.net") || hostname === "fanbox.cc" || hostname.endsWith(".fanbox.cc")) return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="#60a5fa" d="M5.5 3C4.1 3 3 4.1 3 5.5v13C3 19.9 4.1 21 5.5 21h13c1.4 0 2.5-1.1 2.5-2.5v-13C21 4.1 19.9 3 18.5 3h-13zm6.2 3.8c2.8 0 4.7 1.8 4.7 4.3 0 2.6-2 4.4-4.8 4.4h-2.3v3.7H7.1V6.8h4.6zm-.2 2.3h-2.2v4.1h2.2c1.4 0 2.4-.8 2.4-2s-1-2.1-2.4-2.1z" /></svg>;
  return <LanguageIcon sx={{ fontSize: 20 }} />;
}
