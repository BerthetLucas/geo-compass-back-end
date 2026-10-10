import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { LLM_LIMITS } from 'src/llm/constants/limits';

export class CreatePromptDto {
  @IsString()
  @Matches(/\S/, { message: 'text cannot be empty' })
  @MaxLength(LLM_LIMITS.maxPromptLen)
  text!: string;
}

export class DeletePromptDto {
  @Type(() => Number)
  @IsInt()
  id!: number;
}

export class PromptIdParamDto {
  @Type(() => Number)
  @IsInt()
  id!: number;
}

export class UpdatePromptDto {
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'text cannot be empty' })
  @MaxLength(LLM_LIMITS.maxPromptLen)
  text?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PromptDto {
  id!: number;
  text!: string;
  isActive!: boolean;
}
