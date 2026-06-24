import { Injectable } from '@nestjs/common';
import { type User } from './users.types';
import { UsersRepository } from './users.repository';
import { EncryptionService } from 'src/common/encryption.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.usersRepository.findAll();
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOneByEmail(email);
    if (user?.openRouterApiKey) {
      user.openRouterApiKey = this.encryptionService.decrypt(
        user.openRouterApiKey,
      );
    }
    return user;
  }

  async findOneById(id: number): Promise<User | undefined> {
    const user = await this.usersRepository.findOneById(id);
    if (user?.openRouterApiKey) {
      user.openRouterApiKey = this.encryptionService.decrypt(
        user.openRouterApiKey,
      );
    }
    return user;
  }

  async updateSettings(
    id: number,
    data: Partial<Pick<User, 'emailNotifications' | 'openRouterApiKey'>>,
  ): Promise<User> {
    const payload = { ...data };
    if (payload.openRouterApiKey) {
      payload.openRouterApiKey = this.encryptionService.encrypt(
        payload.openRouterApiKey,
      );
    }
    const user = await this.usersRepository.updateSettings(id, payload);
    if (user.openRouterApiKey) {
      user.openRouterApiKey = this.encryptionService.decrypt(
        user.openRouterApiKey,
      );
    }
    return user;
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const existingUser = await this.usersRepository.findOneByEmail(user.email);
    if (existingUser) {
      throw new Error('Error on create account');
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userWithHashedPassword = { ...user, password: hashedPassword };

    return await this.usersRepository.create(userWithHashedPassword);
  }

  async deleteAccount(id: number): Promise<void> {
    await this.usersRepository.deleteById(id);
  }
}
