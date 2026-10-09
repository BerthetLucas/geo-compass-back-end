import { IsDateString, IsOptional } from 'class-validator';

export class ComputeRankingQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class ComputeRankingResponseDto {
  success!: boolean;
  date!: string;
}
