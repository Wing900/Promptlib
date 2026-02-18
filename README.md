# PromptLib

一个基于 Next.js App Router 的极简提示词管理库，支持：

- 分类浏览与搜索
- 全屏 Studio 编辑
- 管理员名字 + 密钥验证
- 提示词编辑、删除、排序
- Vercel Redis/KV 持久化（未配置时自动内存兜底）

## 本地运行

```bash
npm install
npm run dev
```

## 环境变量

复制 `.env.example` 为 `.env.local`，至少配置：

```env
ADMIN_PASSWORD=your-admin-password
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

## 构建验证

```bash
npm run lint
npm run build
```

