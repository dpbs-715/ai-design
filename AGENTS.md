# Repository Guidelines

## Project Structure & Module Organization

This pnpm and Turborepo monorepo contains two applications and shared packages:

- `apps/web/`: the Vue 3 and TypeScript visual-screen editor.
- `apps/api/`: the NestJS API.
- `packages/contracts/`: framework-independent Zod schemas, data contracts, and TypeScript types
  that can be consumed by both applications.

The web application remains organized primarily by feature:

- `apps/web/src/editor/`: editor shell, toolbars, canvas behavior, property panels, and editor theme controls.
- `apps/web/src/materials/`: chart/text material definitions, runtime components, and preview cards.
- `apps/web/src/components/`: reusable application components.
- `apps/web/src/stores/`, `apps/web/src/schema/`, `apps/web/src/theme/`, and `apps/web/src/runtime/`: state, contracts, theming, and runtime infrastructure.
- `apps/web/src/pages/` and `apps/web/src/router/`: routed editor preview and published-screen pages.
- `apps/web/src/styles/`: global CSS and shared theme variables. Static assets belong in `apps/web/public/`.

Keep feature-specific helpers beside their owner; share code only when it is genuinely cross-feature.
Code in `packages/contracts/` must remain independent of Vue, NestJS, browser globals, and
application-specific services.

## Build, Test, and Development Commands

Use pnpm; `pnpm-lock.yaml` is authoritative.

- `pnpm install`: install the locked dependency graph.
- `pnpm dev`: start all development servers through Turborepo.
- `pnpm dev:web`: start only the Vite development server.
- `pnpm dev:api`: start only the NestJS development server.
- `pnpm type-check`: type-check all workspaces.
- `pnpm lint`: run lint tasks exposed by workspaces; web lint commands may fix files.
- `pnpm format`: run formatting tasks exposed by workspaces.
- `pnpm build`: build all workspaces.
- `pnpm --filter @ai-design/web preview`: serve the web production bundle locally.

## Coding Style & Naming Conventions

Follow `.editorconfig` and `.prettierrc.json`: two-space indentation, LF endings, no semicolons, single quotes, and a 100-character print width. Prefer Vue Composition API with `<script setup lang="ts">`. Name Vue components in PascalCase (`CanvasZoomControl.vue`), composables with a `use` prefix (`useCanvasViewport.ts`), and ordinary functions/variables in camelCase. In the web application, use `@/` for `apps/web/src/` imports; do not hand-edit generated `apps/web/components.d.ts` or `apps/web/auto-imports.d.ts`.

## UI Component Selection

For shared UI—especially Table, Form, Dialog, Select, Search, Descriptions, and Pagination—use `@vunio/ui` first and check its concrete component before building a custom alternative. Use Element Plus only when Vunio lacks the required component or behavior. Consider another library only when neither is sufficient, and explain the fallback in the pull request.

## Testing Guidelines

No automated test runner or coverage threshold is currently configured. Every change must at least pass `pnpm type-check` and `pnpm build`. Manually verify affected editor flows, including canvas zoom/selection, narrow layouts, light/dark themes, and preview rendering where relevant. If adding tests, colocate them in `__tests__/` and use descriptive `*.spec.ts` names.

## Commit & Pull Request Guidelines

History follows Conventional Commit-style subjects such as `fix(theme): ...`, `feat(editor): ...`, and `style(editor): ...`. Keep commits focused and scopes tied to the owning feature. Pull requests should explain user-visible behavior, summarize implementation choices, link issues, list verification commands, and include screenshots or recordings for visual changes.
