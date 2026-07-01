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
import { UsersService } from './users.service';
import { UpdateUserSettingsDto, UserSettingsResponseDto } from './users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async getMySettings(
    @Request() req: { user: JwtPayload },
  ): Promise<UserSettingsResponseDto> {
    const user = await this.usersService.findOneById(req.user.sub);

    if (!user) {
      throw new NotFoundException();
    }

    return new UserSettingsResponseDto(
      user.emailNotifications,
      !!user.openRouterApiKey,
      user.email,
    );
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Put('me')
  async updateMySettings(
    @Request() req: { user: JwtPayload },
    @Body() dto: UpdateUserSettingsDto,
  ): Promise<UserSettingsResponseDto> {
    const user = await this.usersService.updateSettings(req.user.sub, dto);

    return new UserSettingsResponseDto(
      user.emailNotifications,
      !!user.openRouterApiKey,
      user.email,
    );
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('me')
  async deleteMyAccount(@Request() req: { user: JwtPayload }): Promise<void> {
    await this.usersService.deleteAccount(req.user.sub);
  }
}
