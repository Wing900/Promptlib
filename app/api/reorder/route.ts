import { verifyAccessKey, verifyAdminSessionToken } from "@/lib/admin";
import { reorderPrompts } from "@/lib/prompts-repository";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ReorderBody {
  ids?: string[];
  accessKey?: string;
  token?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReorderBody;

    if (!Array.isArray(body.ids) || body.ids.some((id) => typeof id !== "string")) {
      return NextResponse.json({ error: "排序参数错误。" }, { status: 400 });
    }

    const tokenIsValid = typeof body.token === "string" && verifyAdminSessionToken(body.token);
    const keyIsValid =
      typeof body.accessKey === "string" && body.accessKey.length > 0 && verifyAccessKey(body.accessKey);

    if (!tokenIsValid && !keyIsValid) {
      return NextResponse.json({ error: "未授权：需要管理员密钥。" }, { status: 401 });
    }

    const prompts = await reorderPrompts(body.ids);
    return NextResponse.json({ prompts });
  } catch (error) {
    console.error("Failed to reorder prompts", error);
    return NextResponse.json({ error: "排序保存失败。" }, { status: 500 });
  }
}

