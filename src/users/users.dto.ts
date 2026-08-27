import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { AVAILABLE_MODELS } from 'src/llm/constants/models';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @ValidateIf((o: UpdateUserSettingsDto) => o.openRouterApiKey !== null)
  @IsString()
  openRouterApiKey?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(AVAILABLE_MODELS, { each: true })
  selectedModels?: string[];
}

export class UserSettingsResponseDto {
  emailNotifications: boolean;
  hasOpenRouterApiKey: boolean;
  email: string;
  selectedModels: string[];

  constructor(
    emailNotifications: boolean,
    hasOpenRouterApiKey: boolean,
    email: string,
    selectedModels: string[],
  ) {
    this.emailNotifications = emailNotifications;
    this.hasOpenRouterApiKey = hasOpenRouterApiKey;
    this.email = email;
    this.selectedModels = selectedModels;
  }
}
