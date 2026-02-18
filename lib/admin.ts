import { createHmac, timingSafeEqual } from "crypto";

const SESSION_TTL_MS = 1000 * 60 * 60 * 6;
const DEV_ADMIN_PASSWORD = "promptlib-dev-key";

function getAdminSecret(): string | null {
  const configured = process.env.ADMIN_PASSWORD?.trim();

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEV_ADMIN_PASSWORD;
  }

  return null;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function isAdminConfigured(): boolean {
  return getAdminSecret() !== null;
}

export function verifyAccessKey(accessKey: string): boolean {
  const secret = getAdminSecret();
  if (!secret) {
    return false;
  }

  return accessKey.trim() === secret;
}

export function createAdminSessionToken(): { token: string; expiresAt: number } | null {
  const secret = getAdminSecret();
  if (!secret) {
    return null;
  }

  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt }), "utf8").toString(
    "base64url"
  );
  const signature = signPayload(payload, secret);

  return {
    token: `${payload}.${signature}`,
    expiresAt
  };
}

export function verifyAdminSessionToken(token: string): boolean {
  const secret = getAdminSecret();
  if (!secret) {
    return false;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = signPayload(payload, secret);
  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
    };

    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export function getSessionTtlMs(): number {
  return SESSION_TTL_MS;
}

