import { Injectable } from '@nestjs/common';
import { LlmRepository } from 'src/llm/llm.repository';
import { RankingRepository } from './ranking.repository';
import { extractBrands } from './utils/extract-brands';
import { countMentions } from './utils/count-mentions';
import { buildRanking } from './utils/build-ranking';

@Injectable()
export class RankingService {
  constructor(
    private readonly llmRepository: LlmRepository,
    private readonly rankingRepository: RankingRepository,
  ) {}

  async computeAndStoreAllRankings(userId: number, date: Date): Promise<void> {
    await this.computeAndStoreGlobalRanking(userId, date);
    await this.computeAndStoreModelRankings(userId, date);
  }

  async computeAndStoreGlobalRanking(
    userId: number,
    date: Date,
  ): Promise<void> {
    const responses = await this.llmRepository.findResponsesByDate(
      date,
      userId,
    );
    const ranking = buildRanking(countMentions(extractBrands(responses)));
    const dateStr = this.toDateString(date);
    await this.rankingRepository.insertGlobalRanking(userId, dateStr, ranking);
  }

  async computeAndStoreModelRankings(
    userId: number,
    date: Date,
  ): Promise<void> {
    const responses = await this.llmRepository.findResponsesByDate(
      date,
      userId,
    );
    const dateStr = this.toDateString(date);

    const modelNames = [...new Set(responses.map((r) => r.model))];

    for (const model of modelNames) {
      const modelResponses = responses.filter((r) => r.model === model);
      const ranking = buildRanking(
        countMentions(extractBrands(modelResponses)),
      );
      await this.rankingRepository.insertModelRanking(
        userId,
        dateStr,
        model,
        ranking,
      );
    }
  }

  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
