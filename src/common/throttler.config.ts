import { type ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Burst / brute-force protection (security report 3.2, cyber-verdict-nodb.md §3.4).
 *
 * One "default" limiter — every throttler in this array is enforced on every
 * route; routes tighten it with @Throttle.
 *
 * The shared server OpenRouter key is the product default (round-2 decision), so
 * there is no "bring your own key" gate. The LLM cost is bounded by a stack of
 * in-memory controls, none of which needs DB or Redis:
 *   - @Throttle 5/day/user on POST /llm/ (keyed by verified JWT sub)
 *   - per-user daily server-key guard (LLM_MAX_SERVERKEY_CALLS_PER_DAY, 50)
 *   - global all-users daily guard (LLM_MAX_SERVERKEY_CALLS_PER_DAY_GLOBAL, 3000)
 *   - input caps (prompt length, active-prompt count, fan-out clamp)
 * See cyber-verdict-v2.md §2 / §3 and LlmService.
 *
 * Tracking is keyed by verified JWT subject (else IP) — see UserThrottlerGuard.
 */
export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [{ name: 'default', ttl: 60_000, limit: 60 }],
};
