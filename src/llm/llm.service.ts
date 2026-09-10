import { Injectable, Logger } from '@nestjs/common';
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
import { type PromptResponse } from 'src/prompt/prompt.types';
import { UsersService } from 'src/users/users.service';

export type { LlmResponse } from './llm.types';

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
    userApiKey?: string,
  ): Promise<LlmResponse> {
    const apiKey =
      userApiKey ?? this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) throw new Error('No OpenRouter API key configured');
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

  async sendLlmQueries(userId: number): Promise<LlmResponse[]> {
    const [allActivePrompts, user] = await Promise.all([
      this.promptRepository.getActivePrompts(userId),
      this.usersService.findOneById(userId),
    ]);
    if (!allActivePrompts.length) return [];

    // Clamp the fan-out width regardless of DB state — it is otherwise fully
    // caller-controlled via the prompt endpoints.
    const activePrompts = allActivePrompts.slice(
      0,
      LLM_LIMITS.maxActivePrompts,
    );
    const models = (user?.selectedModels ?? []).filter((model) =>
      AVAILABLE_MODELS.includes(model),
    );
    if (!models.length) return [];

    const settled = await this.runFanOut(
      activePrompts,
      models,
      user?.openRouterApiKey ?? undefined,
    );

    const responses = this.collectResponses(userId, settled);
    if (responses.length) {
      await this.llmRepository.insertResponses(userId, responses);
    }
    return responses;
  }

  /**
   * Runs one upstream call per (prompt, model) pair, at most
   * LLM_LIMITS.fanoutConcurrency in flight at a time.
   */
  private async runFanOut(
    prompts: PromptResponse[],
    models: string[],
    userApiKey: string | undefined,
  ): Promise<PromiseSettledResult<LlmResponse>[]> {
    const tasks = prompts.flatMap((prompt) =>
      models.map((model) => ({ prompt, model })),
    );
    const results: PromiseSettledResult<LlmResponse>[] = [];
    for (let i = 0; i < tasks.length; i += LLM_LIMITS.fanoutConcurrency) {
      const chunk = tasks.slice(i, i + LLM_LIMITS.fanoutConcurrency);
      const settled = await Promise.allSettled(
        chunk.map(({ prompt, model }) =>
          this.sendLlmQuery(
            [{ role: 'user', content: prompt.text }],
            model,
            userApiKey,
          ),
        ),
      );
      results.push(...settled);
    }
    return results;
  }

  /** Keeps the successful responses, logs the failures. */
  private collectResponses(
    userId: number,
    settled: PromiseSettledResult<LlmResponse>[],
  ): LlmResponse[] {
    const responses: LlmResponse[] = [];
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        responses.push(result.value);
        continue;
      }
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      this.logger.error(
        `Failed to fetch LLM response for user ${userId}: ${reason}`,
      );
    }
    return responses;
  }

  private normalizeModelName(model: string): string {
    const beforeSlash = model.split('/')[0];
    return beforeSlash.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }
}
