import {
  createAdminSessionToken,
  getSessionTtlMs,
  isAdminConfigured,
  verifyAccessKey
} from "@/lib/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "生产环境缺少 ADMIN_PASSWORD 配置。" },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as { accessKey?: string; adminName?: string };

    if (!body.adminName || body.adminName.trim().length === 0) {
      return NextResponse.json({ error: "请输入管理员名字。" }, { status: 400 });
    }

    if (!body.accessKey || !verifyAccessKey(body.accessKey)) {
      return NextResponse.json({ error: "访问密钥错误。" }, { status: 401 });
    }

    const session = createAdminSessionToken();
    if (!session) {
      return NextResponse.json({ error: "管理员会话签发失败。" }, { status: 500 });
    }

    return NextResponse.json({
      token: session.token,
      expiresAt: session.expiresAt,
      expiresInMs: getSessionTtlMs(),
      adminName: body.adminName.trim()
    });
  } catch (error) {
    console.error("Failed to verify admin key", error);
    return NextResponse.json({ error: "请求体格式错误。" }, { status: 400 });
  }
}
