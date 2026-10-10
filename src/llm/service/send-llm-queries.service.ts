import { Injectable, Logger } from '@nestjs/common';
import { type LlmResponse } from '../llm.types';
import { AVAILABLE_MODELS } from '../constants/models';
import { LLM_LIMITS } from '../constants/limits';
import { LlmRepository } from '../llm.repository';
import { PromptRepository } from 'src/prompt/prompt.repository';
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

    const prompts = allActivePrompts.slice(0, LLM_LIMITS.maxActivePrompts);
    const models = (user?.selectedModels ?? []).filter((model) =>
      AVAILABLE_MODELS.includes(model),
    );

    const settled = await Promise.allSettled(
      prompts.flatMap((prompt) =>
        models.map((model) =>
          this.sendLlmQueryService.execute(
            [{ role: 'user', content: prompt.text }],
            model,
            user?.openRouterApiKey ?? undefined,
          ),
        ),
      ),
    );

    const responses: LlmResponse[] = [];
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        responses.push(result.value);
      } else {
        this.logger.error(
          `Failed to fetch LLM response for user ${userId}: ${result.reason}`,
        );
      }
    }

    if (responses.length) {
      await this.llmRepository.insertResponses(userId, responses);
    }
    return responses;
  }
}
