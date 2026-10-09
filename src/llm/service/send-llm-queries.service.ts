import { Injectable, Logger } from '@nestjs/common';
import { type LlmResponse } from '../llm.types';
import { AVAILABLE_MODELS } from '../constants/models';
import { LLM_LIMITS } from '../constants/limits';
import { LlmRepository } from '../llm.repository';
import { PromptRepository } from 'src/prompt/prompt.repository';
import { type Prompt } from 'src/prompt/prompt.types';
import { FindUserByIdService } from 'src/users/service/find-user-by-id.service';
import { SendLlmQueryService } from './send-llm-query.service';

@Injectable()
export class SendLlmQueriesService {
  private readonly logger = new Logger(SendLlmQueriesService.name);

  constructor(
    private readonly llmRepository: LlmRepository,
    private readonly promptRepository: PromptRepository,
    private readonly findUserByIdService: FindUserByIdService,
    private readonly sendLlmQueryService: SendLlmQueryService,
  ) {}

  async execute(userId: number): Promise<LlmResponse[]> {
    const [allActivePrompts, user] = await Promise.all([
      this.promptRepository.getActivePrompts(userId),
      this.findUserByIdService.execute(userId),
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
    prompts: Prompt[],
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
          this.sendLlmQueryService.execute(
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
}
