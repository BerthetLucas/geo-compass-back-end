import { Module, forwardRef } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthModule } from 'src/auth/auth.module';
import { EncryptionService } from 'src/common/encryption.service';
import { ConfigModule } from '@nestjs/config';
import { FindAllUsersService } from './service/find-all-users.service';
import { FindUserByEmailService } from './service/find-user-by-email.service';
import { FindUserByIdService } from './service/find-user-by-id.service';
import { UpdateUserSettingsService } from './service/update-user-settings.service';
import { CreateUserService } from './service/create-user.service';
import { DeleteAccountService } from './service/delete-account.service';

@Module({
  imports: [forwardRef(() => AuthModule), ConfigModule],
  controllers: [UsersController],
  providers: [
    FindAllUsersService,
    FindUserByEmailService,
    FindUserByIdService,
    UpdateUserSettingsService,
    CreateUserService,
    DeleteAccountService,
    UsersRepository,
    AuthGuard,
    EncryptionService,
  ],
  exports: [
    FindAllUsersService,
    FindUserByEmailService,
    FindUserByIdService,
    CreateUserService,
  ],
})
export class UsersModule {}
