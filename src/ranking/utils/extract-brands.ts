// Models sometimes wrap the array in ```json fences or prose, or use single quotes.
function parseBrandArray(response: string): unknown {
  const array = response.slice(
    response.indexOf('['),
    response.lastIndexOf(']') + 1,
  );
  try {
    return JSON.parse(array);
  } catch {
    // Single-quoted fallback; only reached when strict JSON fails, so "L'Oréal" stays intact.
    return JSON.parse(array.replace(/'/g, '"'));
  }
}

export function extractBrands(responses: { response: string }[]): string[] {
  const brands: string[] = [];

  for (const row of responses) {
    try {
      const parsed = parseBrandArray(row.response);
      if (Array.isArray(parsed)) {
        brands.push(
          ...parsed.filter((b): b is string => typeof b === 'string'),
        );
      }
    } catch {
      // Skip malformed LLM responses so one bad row can't break the ranking.
      continue;
    }
  }

  return brands;
}
