import { Injectable } from '@nestjs/common';
import { type User } from '../users.types';
import { UsersRepository } from '../users.repository';
import { EncryptionService } from 'src/common/encryption.service';
import { decryptApiKey } from '../utils/decrypt-api-key';

@Injectable()
export class FindUserByEmailService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async execute(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOneByEmail(email);
    return decryptApiKey(user, this.encryptionService);
  }
}
