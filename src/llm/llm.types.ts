export const SYSTEM_PROMPT = `Tu es un assistant. Tu vas recevoir des questions concernant des marques de produits. Ton travail est de répondre à la question à l'aide d'un tableau de string, sans aucun autre texte autour sous la forme de ['Marque 1', 'Marque 2', etc].`;

export const OPENROUTER_API_URL =
  'https://openrouter.ai/api/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  model: string;
  text: string;
  durationMs: number;
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
