/** Next 16.3 Page params are encoded; metadata params are already decoded. */
export function decodeTaxonomyPageParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // Keep malformed escapes literal rather than turning an unknown name into a 500.
    return value;
  }
}
