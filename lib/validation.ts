import type { PromptItem } from "@/types/prompt";

export function isPromptLike(value: unknown): value is PromptItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PromptItem>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.overview === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.updatedAt === "string" &&
    (typeof candidate.sortOrder === "number" || typeof candidate.sortOrder === "undefined")
  );
}
