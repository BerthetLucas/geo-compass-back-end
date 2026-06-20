import { Injectable } from '@nestjs/common';
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
import { LlmRepository } from './llm.repository';
import { PromptRepository } from 'src/prompt/prompt.repository';
import { UsersService } from 'src/users/users.service';

export type { LlmResponse } from './llm.types';

@Injectable()
export class LlmService {
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
        },
      ),
    );

    return {
      model: this.normalizeModelName(model),
      text: response.data.choices[0].message.content,
      durationMs: Date.now() - start,
    };
  }

  async sendLlmQueries(
    userId: number,
    models: string[],
  ): Promise<LlmResponse[]> {
    const [activePrompts, user] = await Promise.all([
      this.promptRepository.getActivePrompts(userId),
      this.usersService.findOneById(userId),
    ]);

    if (!activePrompts.length) {
      throw new Error('No active prompts found for user');
    }

    const userApiKey = user?.openRouterApiKey ?? undefined;

    const responses = (
      await Promise.all(
        activePrompts.map((prompt) =>
          Promise.all(
            models.map((model) =>
              this.sendLlmQuery(
                [{ role: 'user', content: prompt.text }],
                model,
                userApiKey,
              ),
            ),
          ),
        ),
      )
    ).flat();

    await this.llmRepository.insertResponses(userId, responses);

    return responses;
  }

  private normalizeModelName(model: string): string {
    const beforeSlash = model.split('/')[0];
    return beforeSlash.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }
}
