"use client";

import { AdminKeyModal } from "@/components/admin-key-modal";
import { PromptList } from "@/components/prompt-list";
import { PromptLibLogo } from "@/components/promptlib-logo";
import { ShelfTabs } from "@/components/shelf-tabs";
import { StudioOverlay } from "@/components/studio-overlay";
import { clearAdminSession, readAdminSession } from "@/lib/client-admin-session";
import { ALL_CATEGORY, CATEGORIES, SEARCH_SHORTCUT_HINT } from "@/lib/constants";
import { jsonFetch } from "@/lib/fetcher";
import type { AdminSession, PromptItem, PromptsApiResponse, ReorderApiResponse } from "@/types/prompt";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

const listMotion = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 32 : -32
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.34,
      ease: [0.16, 1, 0.3, 1] as const
    }
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -32 : 32,
    transition: {
      duration: 0.22,
      ease: [0.6, 0.05, 0.01, 0.9] as const
    }
  })
};

function normalizeOrder(prompts: PromptItem[]): PromptItem[] {
  return [...prompts]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((prompt, index) => ({ ...prompt, sortOrder: index }));
}

function reorderSubsetInPlace(allPrompts: PromptItem[], nextVisibleIds: string[]): PromptItem[] {
  const visibleSet = new Set(nextVisibleIds);
  const promptById = new Map(allPrompts.map((item) => [item.id, item] as const));
  const queue = nextVisibleIds
    .map((id) => promptById.get(id))
    .filter((item): item is PromptItem => Boolean(item));

  return allPrompts.map((item) => {
    if (!visibleSet.has(item.id)) {
      return item;
    }

    const nextItem = queue.shift();
    return nextItem ?? item;
  });
}

function isUnauthorizedMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("unauthorized") || message.includes("未授权");
}

export function PromptLibrary() {
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>(
    ALL_CATEGORY
  );
  const [direction, setDirection] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => {
    return typeof window === "undefined" ? null : readAdminSession();
  });
  const [status, setStatus] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error, mutate } = useSWR<PromptsApiResponse>(
    "/api/prompts",
    jsonFetch,
    { revalidateOnFocus: false }
  );

  const prompts = useMemo(() => data?.prompts ?? [], [data?.prompts]);
  const isAdmin = Boolean(adminSession);
  const lowerQuery = searchValue.trim().toLowerCase();

  const visiblePrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      const categoryMatch =
        activeCategory === ALL_CATEGORY ||
        prompt.category.toLowerCase() === activeCategory.toLowerCase();

      if (!categoryMatch) {
        return false;
      }

      if (!lowerQuery) {
        return true;
      }

      const searchable = `${prompt.name} ${prompt.overview} ${prompt.content}`.toLowerCase();
      return searchable.includes(lowerQuery);
    });
  }, [activeCategory, lowerQuery, prompts]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "Escape" && selectedPrompt) {
        setSelectedPrompt(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedPrompt]);

  function handleCategoryChange(nextCategory: string, index: number) {
    const currentIndex = CATEGORIES.findIndex((category) => category === activeCategory);
    setDirection(index >= currentIndex ? 1 : -1);
    setActiveCategory(nextCategory as (typeof CATEGORIES)[number]);
  }

  function handlePromptSaved(updatedPrompt: PromptItem) {
    setSelectedPrompt(updatedPrompt);

    mutate(
      (currentData) => {
        const currentPrompts = currentData?.prompts ?? [];
        const currentIndex = currentPrompts.findIndex((item) => item.id === updatedPrompt.id);
        const nextPrompts = [...currentPrompts];

        if (currentIndex >= 0) {
          nextPrompts[currentIndex] = updatedPrompt;
        } else {
          nextPrompts.push(updatedPrompt);
        }

        return { prompts: normalizeOrder(nextPrompts) };
      },
      { revalidate: false }
    );
  }

  function handlePromptDeleted(id: string) {
    setSelectedPrompt(null);

    mutate(
      (currentData) => {
        const currentPrompts = currentData?.prompts ?? [];
        const nextPrompts = currentPrompts.filter((item) => item.id !== id);
        return { prompts: normalizeOrder(nextPrompts) };
      },
      { revalidate: false }
    );
  }

  async function persistReorder(nextPrompts: PromptItem[]) {
    if (!adminSession) {
      return;
    }

    try {
      await jsonFetch<ReorderApiResponse>("/api/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: adminSession.token,
          ids: nextPrompts.map((item) => item.id)
        })
      });
      setStatus("排序已保存。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "排序保存失败。";

      if (isUnauthorizedMessage(message)) {
        clearAdminSession();
        setAdminSession(null);
        setShowAdminModal(true);
      }

      setStatus(message);
    }
  }

  function movePrompt(promptId: string, offset: -1 | 1) {
    if (!isAdmin) {
      return;
    }

    const currentIndex = visiblePrompts.findIndex((item) => item.id === promptId);
    const targetIndex = currentIndex + offset;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= visiblePrompts.length) {
      return;
    }

    const nextVisibleIds = visiblePrompts.map((item) => item.id);
    const [moved] = nextVisibleIds.splice(currentIndex, 1);
    nextVisibleIds.splice(targetIndex, 0, moved);

    const reordered = reorderSubsetInPlace(prompts, nextVisibleIds);
    const normalized = normalizeOrder(reordered);
    mutate({ prompts: normalized }, { revalidate: false });
    void persistReorder(normalized);
  }

  function handleLogout() {
    clearAdminSession();
    setAdminSession(null);
    setStatus("已退出管理员模式。");
  }

  return (
    <div className="px-6 pb-16 pt-8 md:px-10">
      <header className="mx-auto mt-8 max-w-4xl">
        <div className="mb-8 flex items-center gap-3 text-ink">
          <PromptLibLogo className="h-9 w-9" />
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-stone-500">
            PromptLib 提示词库
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <ShelfTabs
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onChange={handleCategoryChange}
          />

          <div className="flex items-center gap-3">
            {isAdmin ? (
              <div className="rounded-full border border-stone-300 px-3 py-1 font-mono text-xs text-stone-500">
                管理员：{adminSession?.adminName}
              </div>
            ) : null}

            <label className="flex items-center gap-2 border-b border-stone-300 pb-1 font-mono text-xs text-stone-400">
              <span>搜索</span>
              <input
                ref={searchInputRef}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="w-48 bg-transparent text-sm text-ink outline-none"
                placeholder={SEARCH_SHORTCUT_HINT}
              />
            </label>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl">
        {isLoading ? (
          <p className="py-10 text-stone-500">正在加载提示词...</p>
        ) : error ? (
          <p className="py-10 text-rose-600">
            {error instanceof Error ? error.message : "提示词加载失败。"}
          </p>
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeCategory}
              custom={direction}
              variants={listMotion}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <PromptList
                prompts={visiblePrompts}
                onSelect={setSelectedPrompt}
                isAdmin={isAdmin}
                onMoveUp={(id) => movePrompt(id, -1)}
                onMoveDown={(id) => movePrompt(id, 1)}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <footer className="mx-auto mt-14 flex max-w-4xl justify-between border-t border-stone-200 pt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="transition hover:text-ink"
          >
            PromptLib 2026 版权所有
          </button>
          {isAdmin ? (
            <button type="button" onClick={handleLogout} className="transition hover:text-ink">
              退出管理员
            </button>
          ) : null}
        </div>
        <span>{status ?? "ESC：关闭工作台"}</span>
      </footer>

      <StudioOverlay
        prompt={selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
        onSaved={handlePromptSaved}
        onDeleted={handlePromptDeleted}
        onAdminVerified={setAdminSession}
      />

      <AdminKeyModal
        open={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        title="开启管理员模式"
        description="输入管理员名字和访问密钥后可编辑、删除和排序。"
        onVerified={(session) => {
          setAdminSession(session);
          setStatus(`欢迎，${session.adminName}。`);
        }}
      />
    </div>
  );
}
