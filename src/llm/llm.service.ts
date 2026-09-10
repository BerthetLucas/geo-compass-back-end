import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { type AxiosResponse } from 'axios';
import {
  type ChatMessage,
  type LlmResponse,
  type OpenRouterApiResponse,
} from './llm.types';
import { SYSTEM_PROMPT } from './constants/system-prompt';
import { OPENROUTER_API_URL } from './constants/open-router-url';
import { AVAILABLE_MODELS } from './constants/models';
import { LLM_LIMITS } from './constants/limits';
import { LlmRepository } from './llm.repository';
import { PromptRepository } from 'src/prompt/prompt.repository';
import { UsersService } from 'src/users/users.service';

export type { LlmResponse } from './llm.types';

interface SendOptions {
  /**
   * Allow falling back to the shared server OPENROUTER_API_KEY when the user has
   * no personal key. True for both the interactive controller (product default)
   * and the cron.
   */
  allowServerKey?: boolean;
  /**
   * Skip the global all-users daily cap. Cron only — it processes every user in
   * one pass and would otherwise trip the cap mid-run, starving the remaining
   * users of rankings/emails (cyber-review-final.md AC-1). The per-user guard
   * still applies.
   */
  bypassGlobalCap?: boolean;
}

// Best-effort in-memory guards on shared-server-key spend: per-instance, reset on
// restart, bypassable across sock-puppet accounts. Valid only while the backend
// runs as a SINGLE Railway instance — scale-out needs a shared store (Redis).
const serverKeyCallsByDay = new Map<number, { day: string; calls: number }>();
let globalServerKeyCalls: { day: string; calls: number } = {
  day: '',
  calls: 0,
};

const today = (): string => new Date().toISOString().slice(0, 10);

/** Test helper — clears the per-instance server-key guards between specs. */
export const __resetServerKeyGuard = (): void => {
  serverKeyCallsByDay.clear();
  globalServerKeyCalls = { day: '', calls: 0 };
};

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly llmRepository: LlmRepository,
    private readonly promptRepository: PromptRepository,
    private readonly usersService: UsersService,
  ) {}

  async sendLlmQuery(
    messages: ChatMessage[],
    model: string,
    opts: { userApiKey?: string; allowServerKey?: boolean } = {},
  ): Promise<LlmResponse> {
    const apiKey =
      opts.userApiKey ??
      (opts.allowServerKey
        ? this.configService.get<string>('OPENROUTER_API_KEY')
        : undefined);
    if (!apiKey) throw new Error('No OpenRouter API key available');
    const start = Date.now();

    const messagesWithSystem: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    const response = await firstValueFrom<AxiosResponse<OpenRouterApiResponse>>(
      this.httpService.post<OpenRouterApiResponse>(
        OPENROUTER_API_URL,
        { model, messages: messagesWithSystem, max_tokens: 500 },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: LLM_LIMITS.upstreamTimeoutMs,
        },
      ),
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (content === undefined) {
      throw new Error(
        `OpenRouter returned no choices for model ${model}: ${JSON.stringify(
          response.data,
        )}`,
      );
    }

    return {
      model: this.normalizeModelName(model),
      text: content,
      durationMs: Date.now() - start,
    };
  }

  async sendLlmQueries(
    userId: number,
    options: SendOptions = {},
  ): Promise<LlmResponse[]> {
    const [allActivePrompts, user] = await Promise.all([
      this.promptRepository.getActivePrompts(userId),
      this.usersService.findOneById(userId),
    ]);

    if (!allActivePrompts.length) {
      return [];
    }

    const userApiKey = user?.openRouterApiKey ?? undefined;
    const allowServerKey = options.allowServerKey ?? false;

    // Safety net only — the controller passes allowServerKey:true (shared key is
    // the product default). Still guards any future caller that opts out.
    if (!userApiKey && !allowServerKey) {
      throw new ForbiddenException(
        'Configure your OpenRouter API key to run an on-demand analysis.',
      );
    }

    // Hard clamp regardless of DB state — the fan-out width is otherwise fully
    // attacker-controlled via the prompt endpoints (security report 3.1).
    const activePrompts = allActivePrompts.slice(
      0,
      LLM_LIMITS.maxActivePrompts,
    );
    const models = (user?.selectedModels ?? []).filter((model) =>
      AVAILABLE_MODELS.includes(model),
    );

    if (!models.length) {
      return [];
    }

    const plannedCalls = activePrompts.length * models.length;
    const usingServerKey = !userApiKey && allowServerKey;
    const enforceGlobalCap =
      usingServerKey && !(options.bypassGlobalCap ?? false);

    if (usingServerKey) {
      const entry = serverKeyCallsByDay.get(userId);
      const calls = entry?.day === today() ? entry.calls : 0;
      if (calls + plannedCalls > LLM_LIMITS.maxServerKeyCallsPerDay) {
        throw new ForbiddenException('Daily server-key LLM limit reached.');
      }
    }

    if (enforceGlobalCap) {
      if (globalServerKeyCalls.day !== today()) {
        globalServerKeyCalls = { day: today(), calls: 0 };
      }
      if (
        globalServerKeyCalls.calls + plannedCalls >
        LLM_LIMITS.maxServerKeyCallsPerDayGlobal
      ) {
        // Logged as error — a hit means real users are being turned away.
        this.logger.error(
          `Global server-key LLM cap reached (${globalServerKeyCalls.calls}/${LLM_LIMITS.maxServerKeyCallsPerDayGlobal} for ${today()}) — rejecting user ${userId}`,
        );
        throw new ForbiddenException(
          'Service LLM daily capacity reached. Try again tomorrow.',
        );
      }
    }

    // Bounded concurrency: a single call never opens more than
    // LLM_LIMITS.fanoutConcurrency upstream sockets at once.
    const tasks = activePrompts.flatMap((prompt) =>
      models.map((model) => ({ prompt, model })),
    );
    const settledResponses: PromiseSettledResult<LlmResponse>[] = [];
    for (let i = 0; i < tasks.length; i += LLM_LIMITS.fanoutConcurrency) {
      const chunk = tasks.slice(i, i + LLM_LIMITS.fanoutConcurrency);
      settledResponses.push(
        ...(await Promise.allSettled(
          chunk.map(({ prompt, model }) =>
            this.sendLlmQuery([{ role: 'user', content: prompt.text }], model, {
              userApiKey,
              allowServerKey,
            }),
          ),
        )),
      );
    }

    if (usingServerKey) {
      const entry = serverKeyCallsByDay.get(userId);
      const calls = entry?.day === today() ? entry.calls : 0;
      serverKeyCallsByDay.set(userId, {
        day: today(),
        calls: calls + tasks.length,
      });
    }

    if (enforceGlobalCap) {
      globalServerKeyCalls.calls += tasks.length;
      const globalMax = LLM_LIMITS.maxServerKeyCallsPerDayGlobal;
      if (globalServerKeyCalls.calls >= globalMax * 0.8) {
        // TODO: wire to notifyDiscord (pattern in scheduler.service.ts) if this
        // needs to page someone.
        this.logger.warn(
          `Server-key LLM usage at ${globalServerKeyCalls.calls}/${globalMax} upstream calls for ${today()}`,
        );
      }
    }

    const responses = settledResponses.reduce<LlmResponse[]>((acc, result) => {
      if (result.status === 'fulfilled') {
        acc.push(result.value);
      } else {
        this.logger.error(
          `Failed to fetch LLM response for user ${userId}: ${
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason)
          }`,
        );
      }
      return acc;
    }, []);

    if (responses.length) {
      await this.llmRepository.insertResponses(userId, responses);
    }

    return responses;
  }

  private normalizeModelName(model: string): string {
    const beforeSlash = model.split('/')[0];
    return beforeSlash.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }
}
