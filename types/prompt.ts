export interface PromptItem {
  id: string;
  category: string;
  name: string;
  overview: string;
  content: string;
  updatedAt: string;
  sortOrder: number;
}

export interface PromptsApiResponse {
  prompts: PromptItem[];
}

export interface SaveApiResponse {
  prompt: PromptItem;
}

export interface VerifyApiResponse {
  token: string;
  expiresAt: number;
  adminName: string;
}

export interface AdminSession {
  token: string;
  expiresAt: number;
  adminName: string;
}

export interface DeleteApiResponse {
  id: string;
}

export interface ReorderApiResponse {
  prompts: PromptItem[];
}
