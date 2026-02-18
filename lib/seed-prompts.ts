import type { PromptItem } from "@/types/prompt";

export const seedPrompts: PromptItem[] = [
  {
    id: "creative-xiaohongshu-generator",
    category: "创作",
    name: "小红书爆款开头生成器",
    overview:
      "基于情绪触发、符号化表达与清晰 CTA 结构生成社媒文案。",
    content:
      "你是一位资深社媒文案。请输出 5 组标题+正文组合，包含情绪反差、明确场景、一个可执行 CTA。",
    updatedAt: "2026-02-15T08:00:00.000Z",
    sortOrder: 0
  },
  {
    id: "logic-python-audit",
    category: "逻辑",
    name: "Python 逻辑审计",
    overview:
      "审查递归安全性、副作用和潜在内存风险。",
    content:
      "你是严格的 Python 审稿人。解释边界条件与复杂度陷阱，并给出修复版实现和测试。",
    updatedAt: "2026-02-14T10:30:00.000Z",
    sortOrder: 1
  },
  {
    id: "system-qa-template",
    category: "系统",
    name: "系统提示词 QA 模板",
    overview:
      "结构化验证模型语气、策略合规和输出约束。",
    content:
      "请检查回复是否符合政策、事实可追溯、格式约束，并给出通过/不通过及原因。",
    updatedAt: "2026-02-13T16:45:00.000Z",
    sortOrder: 2
  },
  {
    id: "code-review-assistant",
    category: "代码",
    name: "高信号代码评审",
    overview:
      "优先发现行为回归、正确性缺陷和测试缺口，再关注风格。",
    content:
      "你是资深工程师。按严重级别列出问题，再给出可执行修复建议和测试缺口。",
    updatedAt: "2026-02-12T09:15:00.000Z",
    sortOrder: 3
  }
];
