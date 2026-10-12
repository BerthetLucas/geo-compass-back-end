export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  model: string;
  text: string;
  durationMs: number;
  promptId?: number;
}

export interface OpenRouterChoice {
  message: {
    role: string;
    content: string;
  };
}

export interface OpenRouterApiResponse {
  choices: OpenRouterChoice[];
}

export type StoredLlmResponse = Pick<LlmResponse, 'model' | 'text'>;
