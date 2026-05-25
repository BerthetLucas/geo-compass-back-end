import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { type AxiosResponse } from 'axios';
import { DB, type Database } from 'src/db/db.module';
import { llmResponseTable } from 'src/db/schema';

export const SYSTEM_PROMPT = `Tu es un assistant. Tu vas recevoir des questions concernant des marques de produits. Ton travail est de répondre à la question à l'aide d'un tableau de string, sans aucun autre texte autour sous la forme de ['Marque 1', 'Marque 2', etc].`;

export interface LlmResponse {
  model: string;
  text: string;
  durationMs: number;
}

@Injectable()
export class LlmService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @Inject(DB) private readonly db: Database,
  ) {}

  async sendLlmQuery(
    messages: { role: string; content: string }[],
    model: string,
  ): Promise<LlmResponse> {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    const start = Date.now();

    const systemMessage = { role: 'system', content: SYSTEM_PROMPT };
    const messagesWithSystem = [systemMessage, ...messages];

    const response = await firstValueFrom<AxiosResponse<any>>(
      this.httpService.post(
        'https://openrouter.ai/api/v1/chat/completions',
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
      text: response.data.choices[0].message.content as string,
      durationMs: Date.now() - start,
    };
  }

  async sendLlmQueries(
    messages: { role: string; content: string }[],
    models: string[],
  ): Promise<LlmResponse[]> {
    const results = models.map((model) => this.sendLlmQuery(messages, model));

    const responses = await Promise.all(results);

    await this.db.insert(llmResponseTable).values(
      responses.map((response) => ({
        model: response.model,
        response: response.text,
      })),
    );

    return responses;
  }
}
