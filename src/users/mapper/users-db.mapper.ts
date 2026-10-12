import { type NewUserRow, type UserRow } from 'src/db/schemas/users.schema';
import { type User, type UserSettings } from '../users.types';

export class UsersDbMapper {
  static toDomain(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      emailNotifications: row.emailNotifications,
      openRouterApiKey: row.openRouterApiKey,
      selectedModels: row.selectedModels,
    };
  }

  static toInsertRow(user: Omit<User, 'id'>): NewUserRow {
    return {
      email: user.email,
      password: user.password,
      emailNotifications: user.emailNotifications,
      openRouterApiKey: user.openRouterApiKey,
      selectedModels: user.selectedModels,
    };
  }

  static toUpdateRow(settings: Partial<UserSettings>): Partial<NewUserRow> {
    return {
      emailNotifications: settings.emailNotifications,
      openRouterApiKey: settings.openRouterApiKey,
      selectedModels: settings.selectedModels,
    };
  }
}
