export type AuthorSocialLink={ url: string; label: string; icon: string };
function webUrl(value: unknown): string {
  if(typeof value!=="string") return "";
  try { const url=new URL(value.trim()); return ["https:","http:"].includes(url.protocol)? value.trim():""; } catch { return ""; }
}
export function authorSocialLinks(author: { socialLinks: string|null; profileUrl: string|null }): AuthorSocialLink[] {
  let values: unknown=[];
  try { values=JSON.parse(author.socialLinks??"[]"); } catch { /* Legacy invalid JSON falls back to the profile URL. */ }
  const links=Array.isArray(values)? values.flatMap(value => {
    if(!value||typeof value!=="object") return [];
    const url=webUrl(value.url);
    return url? [{ url,label: typeof value.label==="string"? value.label:"",icon: webUrl(value.icon) }]:[];
  }):[];
  const fallback=webUrl(author.profileUrl);
  return links.length? links:fallback? [{ url: fallback,label: "",icon: "" }]:[];
}
export function authorLinkLabel(link: AuthorSocialLink) { return link.label.trim()||new URL(link.url).hostname.replace(/^www\./,""); }
