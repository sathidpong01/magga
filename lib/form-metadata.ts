type MetadataItem = { url: string; label: string; icon: string };

/** Apply enrichment only to the unchanged item that initiated it, even after a reorder. */
export function enrichUnchangedItem<T extends MetadataItem>(
  current: T[], original: T, metadata: { title?: string; icon?: string },
): T[] {
  return current.map((item) => item === original ? {
    ...item, label: metadata.title || item.label, icon: metadata.icon || item.icon,
  } : item);
}
