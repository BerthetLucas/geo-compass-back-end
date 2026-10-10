import { type User, type UserSettings } from '../users.types';
import {
  type UpdateUserSettingsDto,
  UserSettingsResponseDto,
} from '../dto/users.dto';

export class UsersMapper {
  static fromDto(dto: UpdateUserSettingsDto): Partial<UserSettings> {
    return {
      emailNotifications: dto.emailNotifications,
      openRouterApiKey: dto.openRouterApiKey,
      selectedModels: dto.selectedModels,
    };
  }

  static toDto(user: User): UserSettingsResponseDto {
    const dto = new UserSettingsResponseDto();
    dto.emailNotifications = user.emailNotifications;
    dto.hasOpenRouterApiKey = !!user.openRouterApiKey;
    dto.email = user.email;
    dto.selectedModels = user.selectedModels;
    return dto;
  }
}
