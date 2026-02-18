"use client";

import { saveAdminSession } from "@/lib/client-admin-session";
import { jsonFetch } from "@/lib/fetcher";
import type { AdminSession, VerifyApiResponse } from "@/types/prompt";
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useState } from "react";

interface AdminKeyModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onVerified?: (session: AdminSession) => void;
}

export function AdminKeyModal({
  open,
  title = "管理员访问",
  description = "输入访问密钥以解锁编辑权限。",
  onClose,
  onVerified
}: AdminKeyModalProps) {
  const [adminName, setAdminName] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminName.trim()) {
      setError("请输入管理员名字。");
      return;
    }

    if (!accessKey.trim()) {
      setError("请输入访问密钥。");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await jsonFetch<VerifyApiResponse>("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          adminName: adminName.trim(),
          accessKey: accessKey.trim()
        })
      });

      const session: AdminSession = {
        token: response.token,
        expiresAt: response.expiresAt,
        adminName: response.adminName
      };

      saveAdminSession(session);
      setAdminName("");
      setAccessKey("");
      onVerified?.(session);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "密钥验证失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/35 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-xl"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="mb-2 text-xl font-semibold">{title}</h2>
            <p className="mb-6 text-sm text-stone-500">{description}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-name"
                  className="mb-2 block font-mono text-xs tracking-widest text-stone-500"
                >
                  管理员名字
                </label>
                <input
                  id="admin-name"
                  type="text"
                  value={adminName}
                  onChange={(event) => setAdminName(event.target.value)}
                  className="input-minimal font-mono text-sm"
                  placeholder="请输入你的名字"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="admin-access-key" className="mb-2 block font-mono text-xs tracking-widest text-stone-500">
                  访问密钥
                </label>
                <input
                  id="admin-access-key"
                  type="password"
                  value={accessKey}
                  onChange={(event) => setAccessKey(event.target.value)}
                  className="input-minimal font-mono text-sm"
                  placeholder="请输入管理员密钥"
                />
              </div>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-widest text-stone-500 transition hover:border-stone-500 hover:text-ink"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-ink px-5 py-2 font-mono text-xs uppercase tracking-widest text-paper transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "验证中..." : "解锁"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
