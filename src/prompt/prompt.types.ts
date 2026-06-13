export type UpdatePromptBody = { text?: string; isActive?: boolean };

export type PromptResponse = {
  id: number;
  text: string;
  isActive: boolean;
};
