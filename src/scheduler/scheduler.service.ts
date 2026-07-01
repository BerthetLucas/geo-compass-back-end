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

  @Cron('0 2 * * *', { timeZone: 'Europe/Paris' })
  async runDailyDataComputation() {
    this.logger.log('Cron started');
    const start = Date.now();
    const users = await this.usersService.findAll();
    const today = new Date();
    const errors: string[] = [];

    for (const user of users) {
      try {
        await this.llmService.sendLlmQueries(user.id, AVAILABLE_MODELS);
        await this.rankingService.computeAndStoreAllRankings(user.id, today);
      } catch (error) {
        this.logger.error(`Cron failed for user ${user.id}`, error);
        errors.push(
          `${user.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    await this.notifyDiscord({
      color: errors.length ? 0xed4245 : 0x57f287,
      title: errors.length
        ? '⚠️ Cron daily — erreurs partielles'
        : '✅ Cron daily — succès',
      fields: [
        { name: 'Utilisateurs', value: String(users.length), inline: true },
        { name: 'Échecs', value: String(errors.length), inline: true },
        { name: 'Durée', value: `${duration}s`, inline: true },
        { name: 'Date', value: today.toISOString(), inline: false },
        ...(errors.length
          ? [
              {
                name: 'Détails',
                value: errors.join('\n').slice(0, 1000),
                inline: false,
              },
            ]
          : []),
      ],
    });
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
