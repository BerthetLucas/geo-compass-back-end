import { Injectable } from '@nestjs/common';
import { DailyResultsEmail } from './templates/daily-ranking-email';
import { BrandRanking } from 'src/ranking/ranking.types';
import { User } from 'src/users/users.types';
import { Resend } from 'resend';
import { Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async sendDailyEmail(user: User, ranking: BrandRanking[], date: Date) {
    const { error } = await this.resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
      to: user.email,
      subject: `Classement du jour sur Geo Compass`,
      react: DailyResultsEmail({ ranking, date }),
    });

    if (error) {
      this.logger.error(`Resend error: ${error.message}`);
      throw new Error(`Resend error: ${error.message}`);
    }
  }
}
