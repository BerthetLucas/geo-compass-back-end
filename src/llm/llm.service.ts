import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { type AxiosResponse } from 'axios';

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
  ) {}

  async sendLlmQuery(
    messages: { role: string; content: string }[],
    model: string,
  ): Promise<LlmResponse> {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    const start = Date.now();

    const response = await firstValueFrom<AxiosResponse<any>>(
      this.httpService.post(
        'https://openrouter.ai/api/v1/chat/completions',
        { model, messages, max_tokens: 500 },
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
    return Promise.all(results);
  }
}
