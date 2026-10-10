import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class DateQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class PeriodQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

export class ModelParamDto {
  @IsString()
  @IsNotEmpty()
  model!: string;
}

export class BrandRankingDto {
  rank!: number;
  brand!: string;
  mentions!: number;
}

export class DailyRankingDto {
  date!: string;
  rankings!: BrandRankingDto[];
}
