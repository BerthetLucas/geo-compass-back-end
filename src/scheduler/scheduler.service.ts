import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AVAILABLE_MODELS } from 'src/llm/constants/models';
import { LlmService } from 'src/llm/llm.service';
import { RankingService } from 'src/ranking/ranking.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly usersService: UsersService,
    private readonly llmService: LlmService,
    private readonly rankingService: RankingService,
  ) {}

  @Cron('0 2 * * *', { timeZone: 'Europe/Paris' })
  async runDailyDataComputation() {
    const users = await this.usersService.findAll();
    const today = new Date();

    for (const user of users) {
      await this.llmService.sendLlmQueries(user.id, AVAILABLE_MODELS);
      await this.rankingService.computeAndStoreAllRankings(user.id, today);
    }
  }
}
