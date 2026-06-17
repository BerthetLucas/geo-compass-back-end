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
  openRouterApiKey: string | null;
  email: string;

  constructor(
    emailNotifications: boolean,
    openRouterApiKey: string | null,
    email: string,
  ) {
    this.emailNotifications = emailNotifications;
    this.openRouterApiKey = openRouterApiKey;
    this.email = email;
  }
}
