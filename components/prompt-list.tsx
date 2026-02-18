import type { PromptItem } from "@/types/prompt";

interface PromptListProps {
  prompts: PromptItem[];
  onSelect: (prompt: PromptItem) => void;
  isAdmin?: boolean;
  onMoveUp?: (promptId: string) => void;
  onMoveDown?: (promptId: string) => void;
}

export function PromptList({
  prompts,
  onSelect,
  isAdmin = false,
  onMoveUp,
  onMoveDown
}: PromptListProps) {
  if (prompts.length === 0) {
    return (
      <p className="py-10 font-light text-stone-500">
        当前筛选下没有结果，试试切换分类或搜索词。
      </p>
    );
  }

  return (
    <ul className="space-y-10">
      {prompts.map((prompt) => (
        <li key={prompt.id}>
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => onSelect(prompt)}
              className="group w-full cursor-pointer text-left"
            >
              <div className="mb-2 flex items-start justify-between gap-4">
                <h3 className="origin-left transform-gpu text-2xl font-semibold tracking-tight transition-transform duration-200 group-hover:scale-[1.03]">
                  {prompt.name}
                </h3>
                <span className="pt-1 font-mono text-xs text-stone-400 opacity-0 transition-opacity group-hover:opacity-100">
                  -&gt;
                </span>
              </div>
              <p className="max-w-2xl text-sm font-light text-stone-500">{prompt.overview}</p>
            </button>

            {isAdmin ? (
              <div className="flex shrink-0 gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => onMoveUp?.(prompt.id)}
                  className="rounded border border-stone-300 px-2 py-1 font-mono text-xs text-stone-500 transition hover:border-stone-500 hover:text-ink"
                  aria-label={`上移 ${prompt.name}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown?.(prompt.id)}
                  className="rounded border border-stone-300 px-2 py-1 font-mono text-xs text-stone-500 transition hover:border-stone-500 hover:text-ink"
                  aria-label={`下移 ${prompt.name}`}
                >
                  ↓
                </button>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
