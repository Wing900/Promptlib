import { verifyAccessKey, verifyAdminSessionToken } from "@/lib/admin";
import { deletePrompt } from "@/lib/prompts-repository";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface DeleteBody {
  id?: string;
  accessKey?: string;
  token?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DeleteBody;

    if (!body.id || body.id.trim().length === 0) {
      return NextResponse.json({ error: "缺少提示词 ID。" }, { status: 400 });
    }

    const tokenIsValid = typeof body.token === "string" && verifyAdminSessionToken(body.token);
    const keyIsValid =
      typeof body.accessKey === "string" && body.accessKey.length > 0 && verifyAccessKey(body.accessKey);

    if (!tokenIsValid && !keyIsValid) {
      return NextResponse.json({ error: "未授权：需要管理员密钥。" }, { status: 401 });
    }

    const deleted = await deletePrompt(body.id);
    if (!deleted) {
      return NextResponse.json({ error: "提示词不存在。" }, { status: 404 });
    }

    return NextResponse.json({ id: body.id });
  } catch (error) {
    console.error("Failed to delete prompt", error);
    return NextResponse.json({ error: "删除提示词失败。" }, { status: 500 });
  }
}

