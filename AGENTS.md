# Repository Guidelines

## Project Structure & Module Organization

This Vue 3 and TypeScript visual-screen editor is organized primarily by feature:

- `src/editor/`: editor shell, toolbars, canvas behavior, property panels, and editor theme controls.
- `src/materials/`: chart/text material definitions, runtime components, and preview cards.
- `src/components/`: reusable application components.
- `src/stores/`, `src/schema/`, `src/theme/`, and `src/runtime/`: state, contracts, theming, and runtime infrastructure.
- `src/pages/` and `src/router/`: routed editor preview and published-screen pages.
- `src/styles/`: global CSS and shared theme variables. Static assets belong in `public/`.

Keep feature-specific helpers beside their owner; share code only when it is genuinely cross-feature.

## Build, Test, and Development Commands

Use pnpm; `pnpm-lock.yaml` is authoritative.

- `pnpm install`: install the locked dependency graph.
- `pnpm dev`: start the Vite development server.
- `pnpm type-check`: run `vue-tsc --build`.
- `pnpm lint`: run Oxlint and ESLint; both commands may fix files.
- `pnpm format`: format `src/` with Prettier.
- `pnpm build`: type-check and produce the production bundle in `dist/`.
- `pnpm preview`: serve the production bundle locally.

## Coding Style & Naming Conventions

Follow `.editorconfig` and `.prettierrc.json`: two-space indentation, LF endings, no semicolons, single quotes, and a 100-character print width. Prefer Vue Composition API with `<script setup lang="ts">`. Name Vue components in PascalCase (`CanvasZoomControl.vue`), composables with a `use` prefix (`useCanvasViewport.ts`), and ordinary functions/variables in camelCase. Use `@/` for `src/` imports; do not hand-edit generated `components.d.ts` or `auto-imports.d.ts`.

## UI Component Selection

For shared UI—especially Table, Form, Dialog, Select, Search, Descriptions, and Pagination—use `@vunio/ui` first and check its concrete component before building a custom alternative. Use Element Plus only when Vunio lacks the required component or behavior. Consider another library only when neither is sufficient, and explain the fallback in the pull request.

## Testing Guidelines

No automated test runner or coverage threshold is currently configured. Every change must at least pass `pnpm type-check` and `pnpm build`. Manually verify affected editor flows, including canvas zoom/selection, narrow layouts, light/dark themes, and preview rendering where relevant. If adding tests, colocate them in `__tests__/` and use descriptive `*.spec.ts` names.

## Commit & Pull Request Guidelines

History follows Conventional Commit-style subjects such as `fix(theme): ...`, `feat(editor): ...`, and `style(editor): ...`. Keep commits focused and scopes tied to the owning feature. Pull requests should explain user-visible behavior, summarize implementation choices, link issues, list verification commands, and include screenshots or recordings for visual changes.
