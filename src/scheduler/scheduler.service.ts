import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { AVAILABLE_MODELS } from 'src/llm/constants/models';
import { LlmService } from 'src/llm/llm.service';
import { RankingService } from 'src/ranking/ranking.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly llmService: LlmService,
    private readonly rankingService: RankingService,
  ) {}

  @Cron('20 14 * * *', { timeZone: 'Europe/Paris' })
  async runDailyDataComputation() {
    const start = Date.now();
    const users = await this.usersService.findAll();
    const today = new Date();

    try {
      for (const user of users) {
        await this.llmService.sendLlmQueries(user.id, AVAILABLE_MODELS);
        await this.rankingService.computeAndStoreAllRankings(user.id, today);
      }

      const duration = ((Date.now() - start) / 1000).toFixed(1);
      await this.notifyDiscord({
        color: 0x57f287,
        title: '✅ Cron daily — succès',
        fields: [
          { name: 'Utilisateurs', value: String(users.length), inline: true },
          { name: 'Durée', value: `${duration}s`, inline: true },
          { name: 'Date', value: today.toISOString(), inline: false },
        ],
      });
    } catch (error) {
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      await this.notifyDiscord({
        color: 0xed4245,
        title: '❌ Cron daily — erreur',
        fields: [
          {
            name: 'Erreur',
            value: error instanceof Error ? error.message : String(error),
            inline: false,
          },
          { name: 'Durée', value: `${duration}s`, inline: true },
          { name: 'Date', value: today.toISOString(), inline: false },
        ],
      });
      throw error;
    }
  }

  private async notifyDiscord(embed: {
    color: number;
    title: string;
    fields: { name: string; value: string; inline: boolean }[];
  }) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      await axios.post(webhookUrl, { embeds: [embed] });
    } catch (error) {
      this.logger.error('Discord webhook failed', error);
    }
  }
}
