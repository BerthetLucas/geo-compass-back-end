import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, lte } from 'drizzle-orm';
import { DB, type Database } from 'src/db/db.module';
import { llmResponseTable } from 'src/db/schema';

@Injectable()
export class GeoRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findTodayResponses() {
    const startOfToday = this.getStartOfToday();

    return this.db
      .select()
      .from(llmResponseTable)
      .where(gte(llmResponseTable.createdAt, startOfToday));
  }

  async findTodayResponsesByModel(model: string) {
    const startOfToday = this.getStartOfToday();

    return this.db
      .select()
      .from(llmResponseTable)
      .where(
        and(
          gte(llmResponseTable.createdAt, startOfToday),
          eq(llmResponseTable.model, model),
        ),
      );
  }

  async findResponsesByDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.db
      .select()
      .from(llmResponseTable)
      .where(
        and(
          gte(llmResponseTable.createdAt, startOfDay),
          lte(llmResponseTable.createdAt, endOfDay),
        ),
      );
  }

  private getStartOfToday(): Date {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }
}
