import { Injectable, Inject } from '@nestjs/common';
import { DB, type Database } from 'src/db/db.module';
import { type User } from './users.types';
import { usersTable } from 'src/db/schemas/users.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findOneByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    return user;
  }
}
