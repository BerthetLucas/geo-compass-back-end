import {
  type BrandRanking,
  type DailyRanking,
} from 'src/ranking/ranking.types';
import { toDateString } from 'src/common/to-date-string';
import {
  BrandRankingDto,
  DailyRankingDto,
  type DateQueryDto,
  type PeriodQueryDto,
} from '../dto/geo.dto';

export class GeoMapper {
  static fromDateQuery(dto: DateQueryDto): Date {
    return new Date(dto.date ?? toDateString(new Date()));
  }

  static fromPeriodQuery(dto: PeriodQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    return {
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    };
  }

  static toBrandRankingDto(ranking: BrandRanking): BrandRankingDto {
    const dto = new BrandRankingDto();
    dto.rank = ranking.rank;
    dto.brand = ranking.brand;
    dto.mentions = ranking.mentions;
    return dto;
  }

  static toDailyRankingDto(daily: DailyRanking): DailyRankingDto {
    const dto = new DailyRankingDto();
    dto.date = daily.date;
    dto.rankings = daily.rankings.map((r) => GeoMapper.toBrandRankingDto(r));
    return dto;
  }
}
