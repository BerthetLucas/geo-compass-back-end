import { Injectable } from '@nestjs/common';
import { LlmRepository } from 'src/llm/llm.repository';
import { toDateString } from 'src/common/to-date-string';
import { RankingRepository } from '../ranking.repository';
import { extractBrands } from '../utils/extract-brands';
import { countMentions } from '../utils/count-mentions';
import { buildRanking } from '../utils/build-ranking';

@Injectable()
export class ComputeGlobalRankingService {
  constructor(
    private readonly llmRepository: LlmRepository,
    private readonly rankingRepository: RankingRepository,
  ) {}

  async execute(userId: number, date: Date): Promise<void> {
    const responses = await this.llmRepository.findResponsesByDate(
      date,
      userId,
    );
    const ranking = buildRanking(countMentions(extractBrands(responses)));
    await this.rankingRepository.insertGlobalRanking(
      userId,
      toDateString(date),
      ranking,
    );
  }
}
