import { type ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Burst / brute-force protection.
 *
 * One "default" limiter enforced on every route (60 req/min); routes tighten it
 * with @Throttle — notably POST /llm/ (5/day/user) and the auth routes.
 * Tracking is keyed by verified JWT subject, else IP — see UserThrottlerGuard.
 */
export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [{ name: 'default', ttl: 60_000, limit: 60 }],
};
