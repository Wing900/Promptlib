import { ALL_CATEGORY } from "@/lib/constants";
import { listPrompts } from "@/lib/prompts-repository";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const query = url.searchParams.get("q")?.toLowerCase().trim();

    const prompts = await listPrompts();
    const filtered = prompts.filter((prompt) => {
      const categoryMatch =
        !category ||
        category === ALL_CATEGORY ||
        category === "All" ||
        prompt.category.toLowerCase() === category.toLowerCase();

      if (!categoryMatch) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = `${prompt.name} ${prompt.overview} ${prompt.content}`.toLowerCase();
      return searchable.includes(query);
    });

    return NextResponse.json({ prompts: filtered });
  } catch (error) {
    console.error("Failed to list prompts", error);
    return NextResponse.json({ error: "获取提示词失败。" }, { status: 500 });
  }
}
