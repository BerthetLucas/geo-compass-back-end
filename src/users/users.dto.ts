import { IsBoolean, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @ValidateIf((o: UpdateUserSettingsDto) => o.openRouterApiKey !== null)
  @IsString()
  openRouterApiKey?: string | null;
}

export class UserSettingsResponseDto {
  emailNotifications: boolean;
  hasOpenRouterApiKey: boolean;
  email: string;

  constructor(
    emailNotifications: boolean,
    hasOpenRouterApiKey: boolean,
    email: string,
  ) {
    this.emailNotifications = emailNotifications;
    this.hasOpenRouterApiKey = hasOpenRouterApiKey;
    this.email = email;
  }
}
