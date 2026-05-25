export function extractBrands(responses: { response: string }[]): string[] {
  const brands: string[] = [];

  for (const row of responses) {
    const normalized = row.response.replace(/'/g, '"');
    const parsed = JSON.parse(normalized) as string[];
    brands.push(...parsed);
  }

  return brands;
}
