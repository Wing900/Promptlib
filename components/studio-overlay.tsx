"use client";

import { clearAdminSession, hasActiveAdminSession, readAdminSession } from "@/lib/client-admin-session";
import { ALL_CATEGORY, CATEGORIES } from "@/lib/constants";
import { jsonFetch } from "@/lib/fetcher";
import type { AdminSession, DeleteApiResponse, PromptItem, SaveApiResponse } from "@/types/prompt";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { AdminKeyModal } from "@/components/admin-key-modal";

interface StudioOverlayProps {
  prompt: PromptItem | null;
  onClose: () => void;
  onSaved: (prompt: PromptItem) => void;
  onDeleted: (id: string) => void;
  onAdminVerified?: (session: AdminSession) => void;
}

function isUnauthorizedMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("unauthorized") || message.includes("未授权");
}

export function StudioOverlay({
  prompt,
  onClose,
  onSaved,
  onDeleted,
  onAdminVerified
}: StudioOverlayProps) {
  const [draft, setDraft] = useState<PromptItem | null>(prompt);
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);

  const isOpen = Boolean(prompt);
  const isEditing = mode === "edit";

  useEffect(() => {
    setDraft(prompt);
    setMode("read");
    setStatus(null);
  }, [prompt]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isEditing) {
        setMode("read");
      } else {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEditing, isOpen, onClose]);

  const updatedLabel = useMemo(() => {
    if (!draft?.updatedAt) {
      return "-";
    }

    const date = new Date(draft.updatedAt);
    if (Number.isNaN(date.getTime())) {
      return draft.updatedAt;
    }

    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }, [draft?.updatedAt]);

  function updateDraft<K extends keyof PromptItem>(key: K, value: PromptItem[K]) {
    setDraft((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        [key]: value
      };
    });
  }

  async function handleCopy() {
    if (!draft) {
      return;
    }

    try {
      await navigator.clipboard.writeText(draft.content);
      setStatus("提示词已复制。");
    } catch {
      setStatus("当前环境无法访问剪贴板。");
    }
  }

  function handleEditIntent() {
    if (hasActiveAdminSession()) {
      setMode("edit");
      setStatus(null);
      return;
    }

    setShowUnlock(true);
  }

  async function handleSave() {
    if (!draft) {
      return;
    }

    const session = readAdminSession();
    if (!session) {
      clearAdminSession();
      setMode("read");
      setShowUnlock(true);
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const response = await jsonFetch<SaveApiResponse>("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: session.token,
          prompt: draft
        })
      });

      onSaved(response.prompt);
      setDraft(response.prompt);
      setMode("read");
      setStatus("已保存。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "保存失败。";

      if (isUnauthorizedMessage(message)) {
        clearAdminSession();
        setMode("read");
        setShowUnlock(true);
      }

      setStatus(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!draft) {
      return;
    }

    const confirmed = window.confirm(`确认删除「${draft.name}」吗？该操作不可撤销。`);
    if (!confirmed) {
      return;
    }

    const session = readAdminSession();
    if (!session) {
      clearAdminSession();
      setMode("read");
      setShowUnlock(true);
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const response = await jsonFetch<DeleteApiResponse>("/api/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: session.token,
          id: draft.id
        })
      });

      onDeleted(response.id);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "删除失败。";

      if (isUnauthorizedMessage(message)) {
        clearAdminSession();
        setMode("read");
        setShowUnlock(true);
      }

      setStatus(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && draft ? (
          <motion.section
            className="fixed inset-0 z-50 overflow-y-auto bg-white p-6 md:p-12"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mx-auto max-w-3xl">
              <div className="mb-14 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs uppercase tracking-[0.22em] text-stone-400 transition hover:text-ink"
                >
                  &larr; 返回
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-full border border-stone-300 px-4 py-2 font-mono text-xs uppercase tracking-widest text-stone-500 transition hover:border-stone-500 hover:text-ink"
                  >
                    复制
                  </button>

                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSaving}
                        className="rounded-full border border-rose-300 px-4 py-2 font-mono text-xs uppercase tracking-widest text-rose-600 transition hover:border-rose-500 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        删除
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("read")}
                        className="rounded-full border border-stone-300 px-4 py-2 font-mono text-xs uppercase tracking-widest text-stone-500 transition hover:border-stone-500 hover:text-ink"
                      >
                        退出编辑
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-full bg-ink px-5 py-2 font-mono text-xs uppercase tracking-widest text-paper transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "保存中..." : "保存"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEditIntent}
                      className="rounded-full bg-ink px-5 py-2 font-mono text-xs uppercase tracking-widest text-paper transition hover:opacity-90"
                    >
                      编辑
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-12">
                <div className="grid gap-8 md:grid-cols-[3fr_1fr]">
                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                      名称
                    </label>
                    <input
                      value={draft.name}
                      onChange={(event) => updateDraft("name", event.target.value)}
                      readOnly={!isEditing}
                      className="input-minimal text-3xl font-semibold"
                      placeholder="提示词标题"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                      分类
                    </label>
                    {isEditing ? (
                      <select
                        value={draft.category}
                        onChange={(event) => updateDraft("category", event.target.value)}
                        className="input-minimal text-sm"
                      >
                        {CATEGORIES.filter((category) => category !== ALL_CATEGORY).map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="border-b border-stone-300 pb-2 text-sm text-stone-600">{draft.category}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                    概述
                  </label>
                  <input
                    value={draft.overview}
                    onChange={(event) => updateDraft("overview", event.target.value)}
                    readOnly={!isEditing}
                    className="input-minimal text-lg font-light text-stone-600"
                    placeholder="一句话说明用途"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                    提示词内容
                  </label>
                  <textarea
                    value={draft.content}
                    onChange={(event) => updateDraft("content", event.target.value)}
                    readOnly={!isEditing}
                    rows={12}
                    className={`w-full rounded-lg p-6 font-mono text-sm leading-relaxed outline-none ring-1 ring-stone-200 ${
                      isEditing ? "bg-stone-50" : "bg-stone-100/60"
                    }`}
                    placeholder="在这里输入完整提示词..."
                  />
                </div>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-4 font-mono text-xs text-stone-400">
                <span>更新时间：{updatedLabel}</span>
                <span>{status ?? (isEditing ? "编辑模式已开启。" : "当前为只读模式。")}</span>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <AdminKeyModal
        open={showUnlock}
        onClose={() => setShowUnlock(false)}
        onVerified={(session) => {
          setMode("edit");
          setStatus("管理员会话已激活。");
          onAdminVerified?.(session);
        }}
      />
    </>
  );
}
