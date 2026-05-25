import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { type AxiosResponse } from 'axios';
import { DB, type Database } from 'src/db/db.module';
import { llmResponseTable } from 'src/db/schema';
import {
  type ChatMessage,
  type LlmResponse,
  type OpenRouterApiResponse,
} from './llm.types';
import { SYSTEM_PROMPT } from './constants/system-prompt';
import { OPENROUTER_API_URL } from './constants/open-router-url';

export type { LlmResponse } from './llm.types';

@Injectable()
export class LlmService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @Inject(DB) private readonly db: Database,
  ) {}

  async sendLlmQuery(
    messages: ChatMessage[],
    model: string,
  ): Promise<LlmResponse> {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
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
      model,
      text: response.data.choices[0].message.content,
      durationMs: Date.now() - start,
    };
  }

  async sendLlmQueries(
    messages: ChatMessage[],
    models: string[],
  ): Promise<LlmResponse[]> {
    const responses = await Promise.all(
      models.map((model) => this.sendLlmQuery(messages, model)),
    );

    await this.db.insert(llmResponseTable).values(
      responses.map((response) => ({
        model: response.model,
        response: response.text,
      })),
    );

    return responses;
  }
}
