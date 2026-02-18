import { kv } from "@vercel/kv";
import { seedPrompts } from "@/lib/seed-prompts";
import { isPromptLike } from "@/lib/validation";
import type { PromptItem } from "@/types/prompt";

const PROMPTS_KEY = "promptlib:prompts";
const HAS_KV = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
let memoryStore: PromptItem[] = [...seedPrompts];

function sortPrompts(prompts: PromptItem[]): PromptItem[] {
  return [...prompts].sort((left, right) => {
    const leftOrder = typeof left.sortOrder === "number" ? left.sortOrder : Number.MAX_SAFE_INTEGER;
    const rightOrder =
      typeof right.sortOrder === "number" ? right.sortOrder : Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });
}

function normalizePrompt(prompt: PromptItem, fallbackOrder: number): PromptItem {
  return {
    ...prompt,
    updatedAt: prompt.updatedAt || new Date().toISOString(),
    sortOrder: typeof prompt.sortOrder === "number" ? prompt.sortOrder : fallbackOrder
  };
}

function normalizePromptArray(value: unknown): PromptItem[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  if (!value.every(isPromptLike)) {
    return null;
  }

  return value.map((item, index) => normalizePrompt(item, index));
}

async function readKvPrompts(): Promise<PromptItem[]> {
  const raw = await kv.get<unknown>(PROMPTS_KEY);
  const parsed = normalizePromptArray(raw);

  if (parsed && parsed.length > 0) {
    return parsed;
  }

  await kv.set(PROMPTS_KEY, seedPrompts);
  return [...seedPrompts];
}

async function getPromptStore(): Promise<PromptItem[]> {
  if (HAS_KV) {
    try {
      return await readKvPrompts();
    } catch (error) {
      console.error("KV read failed. Falling back to in-memory store.", error);
    }
  }

  return [...memoryStore];
}

async function writePromptStore(prompts: PromptItem[]): Promise<void> {
  if (HAS_KV) {
    try {
      await kv.set(PROMPTS_KEY, prompts);
      return;
    } catch (error) {
      console.error("KV write failed. Falling back to in-memory store.", error);
    }
  }

  memoryStore = [...prompts];
}

export async function listPrompts(): Promise<PromptItem[]> {
  const prompts = await getPromptStore();
  return sortPrompts(prompts);
}

export async function savePrompt(prompt: PromptItem): Promise<PromptItem> {
  const existing = await getPromptStore();
  const current = existing.find((item) => item.id === prompt.id);
  const maxSortOrder = existing.reduce((max, item) => Math.max(max, item.sortOrder), -1);

  const nextPrompt = normalizePrompt(
    {
      ...prompt,
      sortOrder: current?.sortOrder ?? prompt.sortOrder ?? maxSortOrder + 1,
      updatedAt: new Date().toISOString()
    },
    maxSortOrder + 1
  );

  const next = upsertPrompt(existing, nextPrompt);
  await writePromptStore(next);
  return nextPrompt;
}

export async function deletePrompt(id: string): Promise<boolean> {
  const existing = await getPromptStore();
  const next = existing.filter((item) => item.id !== id);

  if (next.length === existing.length) {
    return false;
  }

  const normalized = next.map((item, index) => ({
    ...item,
    sortOrder: index
  }));

  await writePromptStore(normalized);
  return true;
}

export async function reorderPrompts(nextIdsInOrder: string[]): Promise<PromptItem[]> {
  const existing = await getPromptStore();
  const byId = new Map(existing.map((item) => [item.id, item] as const));
  const ordered: PromptItem[] = [];

  for (const id of nextIdsInOrder) {
    const prompt = byId.get(id);
    if (!prompt) {
      continue;
    }

    ordered.push(prompt);
    byId.delete(id);
  }

  for (const prompt of existing) {
    if (byId.has(prompt.id)) {
      ordered.push(prompt);
    }
  }

  const normalized = ordered.map((item, index) => ({
    ...item,
    sortOrder: index
  }));

  await writePromptStore(normalized);
  return sortPrompts(normalized);
}

function upsertPrompt(source: PromptItem[], item: PromptItem): PromptItem[] {
  const index = source.findIndex((prompt) => prompt.id === item.id);
  const next = [...source].map((prompt, orderIndex) => normalizePrompt(prompt, orderIndex));

  if (index >= 0) {
    next[index] = item;
  } else {
    next.push(item);
  }

  return sortPrompts(next).map((prompt, orderIndex) => ({
    ...prompt,
    sortOrder: orderIndex
  }));
}
