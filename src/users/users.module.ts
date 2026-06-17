import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthModule } from 'src/auth/auth.module';
import { EncryptionService } from 'src/common/encryption.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [forwardRef(() => AuthModule), ConfigModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, AuthGuard, EncryptionService],
  exports: [UsersService],
})
export class UsersModule {}
