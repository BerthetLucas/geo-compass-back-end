import { Injectable, Inject } from '@nestjs/common';
import { DB, type Database } from 'src/db/db.module';
import { type User, type UserSettings } from './users.types';
import { usersTable } from 'src/db/schemas/users.schema';
import { eq } from 'drizzle-orm';
import { UsersDbMapper } from './mapper/users-db.mapper';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findAll(): Promise<User[]> {
    const rows = await this.db.select().from(usersTable);
    return rows.map((row) => UsersDbMapper.toDomain(row));
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    const [row] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    return row && UsersDbMapper.toDomain(row);
  }

  async findOneById(id: number): Promise<User | undefined> {
    const [row] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    return row && UsersDbMapper.toDomain(row);
  }

  async updateSettings(
    id: number,
    settings: Partial<UserSettings>,
  ): Promise<User> {
    const [row] = await this.db
      .update(usersTable)
      .set(UsersDbMapper.toUpdateRow(settings))
      .where(eq(usersTable.id, id))
      .returning();

    return UsersDbMapper.toDomain(row);
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const [row] = await this.db
      .insert(usersTable)
      .values(UsersDbMapper.toInsertRow(user))
      .returning();

    return UsersDbMapper.toDomain(row);
  }

  async deleteById(id: number): Promise<void> {
    await this.db.delete(usersTable).where(eq(usersTable.id, id));
  }
}
