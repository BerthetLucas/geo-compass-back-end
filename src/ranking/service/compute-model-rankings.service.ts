import { Injectable } from '@nestjs/common';
import { LlmRepository } from 'src/llm/llm.repository';
import { toDateString } from 'src/common/to-date-string';
import { RankingRepository } from '../ranking.repository';
import { extractBrands } from '../utils/extract-brands';
import { countMentions } from '../utils/count-mentions';
import { buildRanking } from '../utils/build-ranking';

@Injectable()
export class ComputeModelRankingsService {
  constructor(
    private readonly llmRepository: LlmRepository,
    private readonly rankingRepository: RankingRepository,
  ) {}

  async execute(userId: number, date: Date): Promise<void> {
    const responses = await this.llmRepository.findResponsesByDate(
      date,
      userId,
    );
    const dateStr = toDateString(date);

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
}
