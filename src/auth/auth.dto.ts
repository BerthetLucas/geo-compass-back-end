import { IsEmail, MinLength } from 'class-validator';

export class SignInDto {
  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }

  @IsEmail()
  email: string;
  @MinLength(8)
  password: string;
}

export class SignUpDto {
  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }

  @IsEmail()
  email: string;
  @MinLength(8)
  password: string;
}
