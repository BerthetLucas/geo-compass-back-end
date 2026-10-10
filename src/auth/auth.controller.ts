import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SignInService } from './service/sign-in.service';
import { SignUpService } from './service/sign-up.service';
import { type AuthTokenDto, SignInDto, SignUpDto } from './dto/auth.dto';
import { AuthMapper } from './mapper/auth.mapper';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signInService: SignInService,
    private readonly signUpService: SignUpService,
  ) {}

  // Brute-force / bcrypt-CPU-DoS cap, keyed by IP (no JWT on these routes).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: SignInDto): Promise<AuthTokenDto> {
    const token = await this.signInService.execute(
      AuthMapper.fromDto(signInDto),
    );
    return AuthMapper.toDto(token);
  }

  // A real user signs up once — 2/day/IP slows mass account creation (which
  // would otherwise multiply the /llm/ per-user limit across sock-puppets).
  @Throttle({ default: { limit: 2, ttl: 86_400_000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthTokenDto> {
    const token = await this.signUpService.execute(
      AuthMapper.fromDto(signUpDto),
    );
    return AuthMapper.toDto(token);
  }
}
