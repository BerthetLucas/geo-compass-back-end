import { Injectable } from '@nestjs/common';
import { type User } from './users.types';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findOneByEmail(email: string): Promise<User | undefined> {
    return await this.usersRepository.findOneByEmail(email);
  }
}
