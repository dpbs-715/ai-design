# ai-design

基于 pnpm workspace 和 Turborepo 管理的 monorepo。

## 项目结构

- `apps/web`：Vue 3 可视化大屏编辑器。
- `apps/server`：NestJS 服务端。
- `packages/contracts`：前后端共享的数据协议、Zod Schema 和纯 TypeScript 类型。
- `infra`：本地开发所需的 PostgreSQL 等基础设施配置。

共享代码统一放在 `packages/` 下，但只在确实被多个应用使用时抽取。前端组件、Vue
上下文和编辑器逻辑仍留在 `apps/web`，避免把 `packages` 变成没有边界的通用目录。

## 开发命令

- `pnpm dev`：同时启动所有应用。
- `pnpm dev:web`：只启动前端。
- `pnpm dev:server`：只启动服务端。
- `pnpm infra:up`：启动本地基础设施。
- `pnpm infra:down`：停止本地基础设施。
- `pnpm type-check`：检查所有 workspace 的类型。
- `pnpm build`：构建所有 workspace。
- `pnpm lint`：检查所有提供 lint 脚本的 workspace。

## todo list

画布的尺寸目前只支持px 后面尝试铺满容器 需要设计
createComponent 自定义组件 方便ai创建组件
tab物料？ 需要设计物料
...

后期:
mcp服务
