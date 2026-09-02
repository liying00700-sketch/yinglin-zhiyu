# 萤林知育

儿童学习与家庭育儿成长平台。品牌主张：**懂育儿，也懂孩子如何学习。**

从萤林个人工作台中拆出的独立产品，聚焦“问答—计划—执行—观察—复盘”家庭闭环。

## 已包含

- 孩子最小档案与动态月龄；
- 育儿问答的事实补充、安全分流、结构化回答与效果反馈；
- 七领域成长总览；
- 7天×每天4项的本周计划；
- 照护者执行、完成记录和观察反馈；
- 成长回看与下一周轻量提示；
- 桌面端、移动端和浏览器本地持久化。

完整产品边界见 [docs/PRODUCT_SCOPE.md](./docs/PRODUCT_SCOPE.md)。
品牌命名与商业定位见 [docs/BRAND_POSITIONING.md](./docs/BRAND_POSITIONING.md)。

## 本地运行

```bash
pnpm install
pnpm run dev
```

默认访问 `http://localhost:4178/`。

本地育儿问答默认转发到 `http://127.0.0.1:3000/api/parenting/ai`。如问答服务在其他地址，在 `.env.local` 设置：

```bash
PARENTING_API_ORIGIN=https://你的问答服务域名
```

## 构建

```bash
pnpm run build
pnpm run preview
```

构建产物位于 `dist/`。

## Netlify

仓库已包含 `netlify.toml`：

- Build command：`pnpm run build`
- Publish directory：`dist`
- Node.js：22

Netlify 上还需设置服务端环境变量：

- `PARENTING_API_URL`：完整的生产问答接口，例如 `https://api.example.com/api/parenting/ai`；
- `PARENTING_API_TOKEN`：可选；上游接口需要 Bearer Token 时设置。

浏览器始终请求本站 `/api/parenting/ai`，Netlify Function 再转发到上游，因此不会把上游地址或 Token 写进前端包。详细步骤见 [docs/NETLIFY_DEPLOY.md](./docs/NETLIFY_DEPLOY.md)。

## 当前限制

当前数据只保存在单个浏览器，不具备账号、家庭隔离、云同步或跨设备照护协作能力。育儿问答已经接好真实接口契约，但必须先部署并配置生产问答 API；接口不可用时产品不会生成替代答案。因此V0.2适合产品验证和单设备私用，不应表述为生产级会员产品。
