import { Injectable } from '@nestjs/common';
import { type User, type UserSettings } from '../users.types';
import { UsersRepository } from '../users.repository';
import { EncryptionService } from 'src/common/encryption.service';
import { decryptApiKey } from '../utils/decrypt-api-key';

@Injectable()
export class UpdateUserSettingsService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async execute(id: number, data: Partial<UserSettings>): Promise<User> {
    const payload = { ...data };
    if (payload.openRouterApiKey) {
      payload.openRouterApiKey = this.encryptionService.encrypt(
        payload.openRouterApiKey,
      );
    }
    const user = await this.usersRepository.updateSettings(id, payload);
    return decryptApiKey(user, this.encryptionService);
  }
}
