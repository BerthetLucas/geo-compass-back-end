import { type AuthToken, type Credentials } from '../auth.types';
import { AuthTokenDto, type SignInDto, type SignUpDto } from '../dto/auth.dto';

export class AuthMapper {
  static fromDto(dto: SignInDto | SignUpDto): Credentials {
    return { email: dto.email, password: dto.password };
  }

  static toDto(token: AuthToken): AuthTokenDto {
    const dto = new AuthTokenDto();
    dto.access_token = token.accessToken;
    return dto;
  }
}
