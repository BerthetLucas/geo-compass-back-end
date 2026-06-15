export type User = {
  id: number;
  email: string;
  password: string;
  emailNotifications: boolean;
  openRouterApiKey: string | null;
};
