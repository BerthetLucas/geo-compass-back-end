export function countMentions(brands: string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const brand of brands) {
    const key = brand.trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}
