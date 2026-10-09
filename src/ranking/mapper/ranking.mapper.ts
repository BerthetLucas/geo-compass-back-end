import { toDateString } from 'src/common/to-date-string';
import {
  type ComputeRankingQueryDto,
  ComputeRankingResponseDto,
} from '../dto/ranking.dto';

export class RankingMapper {
  static fromDto(dto: ComputeRankingQueryDto): Date {
    return dto.date ? new Date(dto.date) : new Date();
  }

  static toDto(date: Date): ComputeRankingResponseDto {
    const dto = new ComputeRankingResponseDto();
    dto.success = true;
    dto.date = toDateString(date);
    return dto;
  }
}
