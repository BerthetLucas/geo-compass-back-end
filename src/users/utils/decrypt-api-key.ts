import { type EncryptionService } from 'src/common/encryption.service';
import { type User } from '../users.types';

export function decryptApiKey<T extends User | undefined>(
  user: T,
  encryptionService: EncryptionService,
): T {
  if (user?.openRouterApiKey) {
    user.openRouterApiKey = encryptionService.decrypt(user.openRouterApiKey);
  }
  return user;
}
