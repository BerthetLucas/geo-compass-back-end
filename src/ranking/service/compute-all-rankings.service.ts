import { Injectable } from '@nestjs/common';
import { ComputeGlobalRankingService } from './compute-global-ranking.service';
import { ComputeModelRankingsService } from './compute-model-rankings.service';

@Injectable()
export class ComputeAllRankingsService {
  constructor(
    private readonly computeGlobalRankingService: ComputeGlobalRankingService,
    private readonly computeModelRankingsService: ComputeModelRankingsService,
  ) {}

  async execute(userId: number, date: Date): Promise<void> {
    await this.computeGlobalRankingService.execute(userId, date);
    await this.computeModelRankingsService.execute(userId, date);
  }
}
