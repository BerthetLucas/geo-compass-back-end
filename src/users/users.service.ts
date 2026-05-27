import { Injectable } from '@nestjs/common';
import { type User } from './users.types';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findOneByEmail(email: string): Promise<User | undefined> {
    return await this.usersRepository.findOneByEmail(email);
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
}
