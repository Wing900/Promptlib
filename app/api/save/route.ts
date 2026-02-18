import { verifyAccessKey, verifyAdminSessionToken } from "@/lib/admin";
import { savePrompt } from "@/lib/prompts-repository";
import { isPromptLike } from "@/lib/validation";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface SaveBody {
  prompt?: unknown;
  accessKey?: string;
  token?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveBody;

    if (!isPromptLike(body.prompt)) {
      return NextResponse.json({ error: "提示词数据格式不正确。" }, { status: 400 });
    }

    const tokenIsValid = typeof body.token === "string" && verifyAdminSessionToken(body.token);
    const keyIsValid =
      typeof body.accessKey === "string" && body.accessKey.length > 0 && verifyAccessKey(body.accessKey);

    if (!tokenIsValid && !keyIsValid) {
      return NextResponse.json({ error: "未授权：需要管理员密钥。" }, { status: 401 });
    }

    const saved = await savePrompt(body.prompt);
    return NextResponse.json({ prompt: saved });
  } catch (error) {
    console.error("Failed to save prompt", error);
    return NextResponse.json({ error: "保存提示词失败。" }, { status: 500 });
  }
}
