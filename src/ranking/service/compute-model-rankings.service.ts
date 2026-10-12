import { Injectable } from '@nestjs/common';
import { FindResponsesByDateService } from 'src/llm/service/find-responses-by-date.service';
import { RankingRepository } from '../ranking.repository';
import { extractBrands } from '../utils/extract-brands';
import { countMentions } from '../utils/count-mentions';
import { buildRanking } from '../utils/build-ranking';

@Injectable()
export class ComputeModelRankingsService {
  constructor(
    private readonly findResponsesByDateService: FindResponsesByDateService,
    private readonly rankingRepository: RankingRepository,
  ) {}

  async execute(userId: number, date: Date): Promise<void> {
    const responses = await this.findResponsesByDateService.execute(
      date,
      userId,
    );

    const modelNames = [...new Set(responses.map((r) => r.model))];

    for (const model of modelNames) {
      const modelResponses = responses.filter((r) => r.model === model);
      const ranking = buildRanking(
        countMentions(extractBrands(modelResponses)),
      );
      await this.rankingRepository.insertModelRanking(
        userId,
        date,
        model,
        ranking,
      );
    }
  }
}
