import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { type AxiosResponse } from 'axios';
import {
  type ChatMessage,
  type LlmResponse,
  type OpenRouterApiResponse,
} from '../llm.types';
import { SYSTEM_PROMPT } from '../constants/system-prompt';
import { OPENROUTER_API_URL } from '../constants/open-router-url';
import { LLM_LIMITS } from '../constants/limits';
import { normalizeModelName } from '../utils/normalize-model-name';

@Injectable()
export class SendLlmQueryService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async execute(
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
      model: normalizeModelName(model),
      text: content,
      durationMs: Date.now() - start,
    };
  }
}
