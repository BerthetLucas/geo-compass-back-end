export interface JwtPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthToken {
  accessToken: string;
}
