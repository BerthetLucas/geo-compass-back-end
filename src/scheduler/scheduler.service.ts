import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { AVAILABLE_MODELS } from 'src/llm/constants/models';
import { LlmService } from 'src/llm/llm.service';
import { RankingService } from 'src/ranking/ranking.service';
import { UsersService } from 'src/users/users.service';
import { GeoService } from 'src/geo/geo.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly llmService: LlmService,
    private readonly rankingService: RankingService,
    private readonly geoService: GeoService,
    private readonly emailService: EmailService,
  ) {}

  @Cron('0 2 * * *', { timeZone: 'Europe/Paris' })
  async runDailyDataComputation() {
    this.logger.log('Cron started');
    const start = Date.now();
    const users = await this.usersService.findAll();
    const today = new Date();
    const rankingErrors: string[] = [];
    const emailErrors: string[] = [];

    for (const user of users) {
      try {
        await this.llmService.sendLlmQueries(user.id, AVAILABLE_MODELS);
        await this.rankingService.computeAndStoreAllRankings(user.id, today);
      } catch (error) {
        this.logger.error(`Cron failed for user ${user.id}`, error);
        rankingErrors.push(
          `${user.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    for (const user of users) {
      if (!user.emailNotifications) continue;
      try {
        const ranking = await this.geoService.getGlobalRanking(today, user.id);
        await this.emailService.sendDailyEmail(user, ranking, today);
      } catch (error) {
        this.logger.error(`Email failed for user ${user.id}`, error);
        emailErrors.push(
          `${user.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const duration = ((Date.now() - start) / 1000).toFixed(1);

    const hasErrors = rankingErrors.length || emailErrors.length;

    await this.notifyDiscord({
      color: hasErrors ? 0xed4245 : 0x57f287,
      title: hasErrors
        ? '⚠️ Cron daily — erreurs partielles'
        : '✅ Cron daily — succès',
      fields: [
        { name: 'Utilisateurs', value: String(users.length), inline: true },
        {
          name: 'Échecs classement',
          value: String(rankingErrors.length),
          inline: true,
        },
        {
          name: 'Échecs email',
          value: String(emailErrors.length),
          inline: true,
        },
        { name: 'Durée', value: `${duration}s`, inline: true },
        { name: 'Date', value: today.toISOString(), inline: false },
        ...(rankingErrors.length
          ? [
              {
                name: 'Détails ranking',
                value: rankingErrors.join('\n').slice(0, 1000),
                inline: false,
              },
            ]
          : []),
        ...(emailErrors.length
          ? [
              {
                name: 'Détails email',
                value: emailErrors.join('\n').slice(0, 1000),
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
