export type Prompt = {
  id: number;
  text: string;
  isActive: boolean;
};

export type PromptUpdate = { text?: string; isActive?: boolean };
