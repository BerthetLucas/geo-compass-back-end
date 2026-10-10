import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { FindUserByEmailService } from 'src/users/service/find-user-by-email.service';
import { type AuthToken, type Credentials } from '../auth.types';

@Injectable()
export class SignInService {
  constructor(
    private readonly findUserByEmailService: FindUserByEmailService,
    private readonly jwtService: JwtService,
  ) {}

  async execute({ email, password }: Credentials): Promise<AuthToken> {
    const user = await this.findUserByEmailService.execute(email);

    if (!user || !user.password) {
      throw new UnauthorizedException();
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, email: user.email };
    return { accessToken: await this.jwtService.signAsync(payload) };
  }
}
