import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { type JwtPayload } from 'src/auth/auth.types';
import { FindUserByIdService } from './service/find-user-by-id.service';
import { UpdateUserSettingsService } from './service/update-user-settings.service';
import { DeleteAccountService } from './service/delete-account.service';
import {
  UpdateUserSettingsDto,
  type UserSettingsResponseDto,
} from './dto/users.dto';
import { UsersMapper } from './mapper/users.mapper';

@Controller('users')
export class UsersController {
  constructor(
    private readonly findUserByIdService: FindUserByIdService,
    private readonly updateUserSettingsService: UpdateUserSettingsService,
    private readonly deleteAccountService: DeleteAccountService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async getMySettings(
    @Request() req: { user: JwtPayload },
  ): Promise<UserSettingsResponseDto> {
    const user = await this.findUserByIdService.execute(req.user.sub);

    if (!user) {
      throw new NotFoundException();
    }

    return UsersMapper.toDto(user);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Put('me')
  async updateMySettings(
    @Request() req: { user: JwtPayload },
    @Body() dto: UpdateUserSettingsDto,
  ): Promise<UserSettingsResponseDto> {
    const user = await this.updateUserSettingsService.execute(
      req.user.sub,
      UsersMapper.fromDto(dto),
    );

    return UsersMapper.toDto(user);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('me')
  async deleteMyAccount(@Request() req: { user: JwtPayload }): Promise<void> {
    await this.deleteAccountService.execute(req.user.sub);
  }
}
