import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DEFAULT_MODELS } from 'src/llm/constants/models';
import { CreateUserService } from 'src/users/service/create-user.service';
import { type AuthToken, type Credentials } from '../auth.types';

@Injectable()
export class SignUpService {
  constructor(
    private readonly createUserService: CreateUserService,
    private readonly jwtService: JwtService,
  ) {}

  async execute({ email, password }: Credentials): Promise<AuthToken> {
    const user = await this.createUserService.execute({
      email,
      password,
      emailNotifications: true,
      openRouterApiKey: null,
      selectedModels: DEFAULT_MODELS,
    });

    const payload = { sub: user.id, email: user.email };
    return { accessToken: await this.jwtService.signAsync(payload) };
  }
}
