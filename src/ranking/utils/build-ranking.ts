import { type BrandRanking } from '../ranking.types';

export function buildRanking(
  mentionCounts: Map<string, number>,
): BrandRanking[] {
  return [...mentionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([brand, mentions], index) => ({
      rank: index + 1,
      brand,
      mentions,
    }));
}
