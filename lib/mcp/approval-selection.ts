import { z } from 'zod';
import { readSocialLinks, socialLinkDetails } from '@/lib/social-link-details';

export const approvalFields = ['author', 'title', 'author_id', 'category_id', 'category_name', 'profile_url'] as const;
export const approvalSelection = z.object({
  fields: z.array(z.enum(approvalFields)).max(10).optional(),
  tag_names: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  social_link_urls: z.array(z.string().url().max(2048)).max(10).optional(),
}).strict();

export type ApprovalSelection = z.infer<typeof approvalSelection>;
export const draftKind = z.enum(['author_links', 'manga_tags', 'manga_metadata', 'manga_author']);
export type DraftKind = z.infer<typeof draftKind>;

const key = (value: string) => value.trim().toLowerCase();
const unique = (values: string[], normalize: (value: string) => string = value => value) => {
  const seen = new Set<string>();
  return values.filter(value => {
    const normalized = normalize(value);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};
const object = (value: unknown) => z.record(z.string(), z.unknown()).parse(value);
const rejectUnexpected = (selection: ApprovalSelection, allowed: (keyof ApprovalSelection)[]) => {
  for (const name of ['fields', 'tag_names', 'social_link_urls'] as const) {
    if (!allowed.includes(name) && selection[name]?.length) throw new Error('Selection does not match this draft');
  }
};
function selectedSocialLinks(payload: Record<string, unknown>, urls: string[] | undefined) {
  const links = readSocialLinks(payload.social_links);
  const requested = unique(urls ?? [], value => new URL(value).href);
  const selected = requested.map(url => {
    const href = new URL(url).href;
    const match = links.find(link => socialLinkDetails(link).url === href);
    if (!match) throw new Error('Selected social link is not in the proposal');
    return match;
  });
  return selected;
}

export function fullApprovalSelection(kind: DraftKind, rawPayload: unknown): ApprovalSelection {
  const payload = object(rawPayload);
  if (kind === 'manga_tags') return { tag_names: unique(Array.isArray(payload.tag_names) ? payload.tag_names.filter((v): v is string => typeof v === 'string') : [], key) };
  if (kind === 'manga_metadata') return { fields: approvalFields.filter(field => field !== 'author' && Object.hasOwn(payload, field)) };
  const social_link_urls = unique(readSocialLinks(payload.social_links).map(link => socialLinkDetails(link).url));
  if (kind === 'manga_author') return { fields: ['author'], social_link_urls };
  return { fields: Object.hasOwn(payload, 'profile_url') ? ['profile_url'] : [], social_link_urls };
}

export function selectedItemCount(selection: ApprovalSelection) {
  return (selection.fields?.length ?? 0) + (selection.tag_names?.length ?? 0) + (selection.social_link_urls?.length ?? 0);
}

export function approvalSelectionIsValid(kind: DraftKind, selection: ApprovalSelection) {
  if (kind === 'manga_author') return selection.fields?.includes('author') === true;
  return selectedItemCount(selection) > 0;
}

export function selectDraftProposal(kind: DraftKind, rawPayload: unknown, rawSelection?: ApprovalSelection) {
  const payload = object(rawPayload);
  if (rawSelection === undefined) return payload;
  const selection = approvalSelection.parse(rawSelection);

  if (kind === 'manga_tags') {
    rejectUnexpected(selection, ['tag_names']);
    const proposed = z.array(z.string()).parse(payload.tag_names);
    const requested = unique(selection.tag_names ?? [], key);
    if (!requested.length) throw new Error('Select at least one tag');
    return { tag_names: requested.map(name => proposed.find(candidate => key(candidate) === key(name)) ?? (() => { throw new Error('Selected tag is not in the proposal'); })()) };
  }

  if (kind === 'manga_metadata') {
    rejectUnexpected(selection, ['fields']);
    const fields = unique(selection.fields ?? []);
    if (!fields.length || fields.includes('author')) throw new Error('Select at least one metadata field');
    const result: Record<string, unknown> = {};
    for (const field of fields) {
      if (!Object.hasOwn(payload, field)) throw new Error('Selected field is not in the proposal');
      result[field] = payload[field];
    }
    return result;
  }

  rejectUnexpected(selection, ['fields', 'social_link_urls']);
  const links = selectedSocialLinks(payload, selection.social_link_urls);
  if (kind === 'manga_author') {
    const fields = unique(selection.fields ?? []);
    if (fields.length !== 1 || fields[0] !== 'author') throw new Error('Creating an author requires the author assignment');
    return { name: payload.name, social_links: links };
  }

  const fields = unique(selection.fields ?? []);
  if (fields.some(field => field !== 'profile_url')) throw new Error('Selection does not match this draft');
  if (fields.includes('profile_url') && !Object.hasOwn(payload, 'profile_url')) throw new Error('Selected field is not in the proposal');
  if (!fields.length && !links.length) throw new Error('Select at least one author detail');
  return {
    ...(fields.includes('profile_url') ? { profile_url: payload.profile_url } : {}),
    ...(links.length ? { social_links: links } : {}),
  };
}
