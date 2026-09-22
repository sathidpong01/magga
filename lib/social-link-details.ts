export type SocialLinkDetails = { url: string; label: string; icon: string };
export type SocialLinkProposal = string | SocialLinkDetails;

export function readSocialLinks(value: unknown): SocialLinkProposal[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is SocialLinkProposal => {
    if (!(typeof v === 'string' || (!!v && typeof v === 'object' && typeof v.url === 'string' && typeof v.label === 'string' && typeof v.icon === 'string'))) return false;
    try { new URL(typeof v === 'string' ? v : v.url); return true; } catch { return false; }
  });
}

// No fetching: clients research labels/icons, URL-only callers receive a visible fallback.
export function socialLinkDetails(value: SocialLinkProposal): SocialLinkDetails {
  const url = new URL(typeof value === 'string' ? value : value.url);
  if (typeof value !== 'string') return { ...value, url: url.href };
  return { url: url.href, label: url.pathname.split('/').filter(Boolean).pop() || url.hostname, icon: `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128` };
}
export function mergeSocialLinks(existing: SocialLinkDetails[], proposed: SocialLinkProposal[]) {
  const merged = existing.map(link => ({ ...link }));
  for (const value of proposed) {
    const link = socialLinkDetails(value);
    const index = merged.findIndex(entry => entry.url === link.url);
    if (index < 0) merged.push(link);
    else if (typeof value !== 'string') merged[index] = { ...merged[index], label: link.label, icon: link.icon };
  }
  return merged;
}
