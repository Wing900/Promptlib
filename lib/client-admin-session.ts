import { SESSION_STORAGE_KEY } from "@/lib/constants";
import type { AdminSession } from "@/types/prompt";

function inBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readAdminSession(): AdminSession | null {
  if (!inBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AdminSession;

    if (
      typeof parsed?.token !== "string" ||
      typeof parsed?.expiresAt !== "number" ||
      typeof parsed?.adminName !== "string" ||
      parsed.adminName.trim().length === 0 ||
      parsed.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function saveAdminSession(session: AdminSession): void {
  if (!inBrowser()) {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  if (!inBrowser()) {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function hasActiveAdminSession(): boolean {
  return readAdminSession() !== null;
}
