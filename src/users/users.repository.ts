import { Injectable, Inject } from '@nestjs/common';
import { DB, type Database } from 'src/db/db.module';
import { type User } from './users.types';
import { usersTable } from 'src/db/schemas/users.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findAll(): Promise<User[]> {
    const users = await this.db.select().from(usersTable);
    return users;
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    return user;
  }

  async findOneById(id: number): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    return user;
  }

  async updateSettings(
    id: number,
    data: Partial<Pick<User, 'emailNotifications' | 'openRouterApiKey'>>,
  ): Promise<User> {
    const [updated] = await this.db
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.id, id))
      .returning();

    return updated;
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const [createdUser] = await this.db
      .insert(usersTable)
      .values(user)
      .returning();

    return createdUser;
  }
}
