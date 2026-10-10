import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users.repository';

@Injectable()
export class DeleteAccountService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(id: number): Promise<void> {
    await this.usersRepository.deleteById(id);
  }
}
