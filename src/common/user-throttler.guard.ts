import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from '@nestjs/throttler';

/**
 * Rate-limit tracker keyed by the authenticated user when possible, else by IP.
 *
 * The JWT signature is verified here (same secret as AuthGuard) — an unverified
 * token is treated as absent, so a forged `sub` cannot mint fresh buckets and
 * slip past the auth-route throttles.
 *
 * The throttler's in-memory store is per-process: fine for a single instance,
 * needs a shared store (Redis) if the backend scales out.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const headers = req.headers as Record<string, unknown> | undefined;
    const auth: unknown = headers?.authorization;
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      try {
        const payload = await this.jwtService.verifyAsync<{ sub?: unknown }>(
          auth.slice(7),
        );
        if (
          typeof payload.sub === 'string' ||
          typeof payload.sub === 'number'
        ) {
          return `user-${payload.sub}`;
        }
      } catch {
        // invalid / expired token → fall back to IP
      }
    }
    return (req.ip as string) ?? 'unknown';
  }
}
