export function extractBrands(responses: { response: string }[]): string[] {
  const brands: string[] = [];

  for (const row of responses) {
    try {
      const normalized = row.response.replace(/'/g, '"');
      const parsed = JSON.parse(normalized) as string[];
      if (Array.isArray(parsed)) {
        brands.push(...parsed.filter((b) => typeof b === 'string'));
      }
    } catch {
      // Skip malformed LLM responses so one bad row can't break the ranking.
      continue;
    }
  }

  return brands;
}
