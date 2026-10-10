import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePromptDto {
  @IsString()
  @IsNotEmpty()
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
