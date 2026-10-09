import { Injectable } from '@nestjs/common';
import { type User } from '../users.types';
import { UsersRepository } from '../users.repository';

@Injectable()
export class FindAllUsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(): Promise<User[]> {
    return await this.usersRepository.findAll();
  }
}
