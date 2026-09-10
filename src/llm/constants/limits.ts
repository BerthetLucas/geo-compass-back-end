// Cost / resource-exhaustion caps for the LLM path. Plain env reads with defaults.
const num = (key: string, fallback: number): number => {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const LLM_LIMITS = {
  /** Max characters accepted for a single prompt. */
  get maxPromptLen(): number {
    return num('LLM_MAX_PROMPT_LEN', 2000);
  },
  /** Max prompts that may be active at once per user (fan-out width). Front caps at 5. */
  get maxActivePrompts(): number {
    return num('LLM_MAX_ACTIVE_PROMPTS', 5);
  },
  /** Max concurrent upstream OpenRouter sockets per sendLlmQueries call. */
  get fanoutConcurrency(): number {
    return num('LLM_FANOUT_CONCURRENCY', 5);
  },
  /** Per-request axios timeout for upstream calls. */
  get upstreamTimeoutMs(): number {
    return num('LLM_UPSTREAM_TIMEOUT_MS', 30_000);
  },
  /**
   * Best-effort per-instance, per-user daily ceiling for calls on the shared
   * server key. Not a real budget — see the Map guard in llm.service.ts.
   */
  get maxServerKeyCallsPerDay(): number {
    return num('LLM_MAX_SERVERKEY_CALLS_PER_DAY', 50);
  },
  /**
   * Absolute per-instance daily ceiling for server-key upstream calls across ALL
   * users combined — last line of defence against distributed multi-account abuse.
   */
  get maxServerKeyCallsPerDayGlobal(): number {
    return num('LLM_MAX_SERVERKEY_CALLS_PER_DAY_GLOBAL', 3000);
  },
};
