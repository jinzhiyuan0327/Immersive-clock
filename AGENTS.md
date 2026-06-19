# Repository Guidelines

## Project Structure & Module Organization

Immersive Clock is a React 19 + TypeScript + Vite app with PWA and Electron targets. Web source lives in `src/`: `components/` for reusable UI, `pages/ClockPage/` for the main clock experience, `contexts/` for app state, `hooks/` for shared behavior, `utils/` and `services/` for storage, weather, time sync, and noise logic. Electron code is in `electron/`. Static assets, icons, fonts, sounds, and app manifest files are in `public/`. Documentation lives in `docs/`, unit tests colocate under `src/**/__tests__/`, and end-to-end tests live in `tests/e2e/`.

## Build, Test, and Development Commands

Use Node `>=20.19.0`. Project docs use `cnpm`, but equivalent npm commands may work.

- `cnpm run dev`: start the Vite web dev server.
- `cnpm run dev:electron`: start Electron development mode.
- `cnpm run build`: build the web/PWA output.
- `cnpm run build:electron`: build the Electron output.
- `cnpm run preview`: preview the production web build.
- `cnpm run lint` / `cnpm run lint:fix`: run or fix ESLint issues in `src`.
- `cnpm run format`: format TypeScript, CSS, Markdown, and JSON with Prettier.

## Coding Style & Naming Conventions

Use TypeScript strict mode, functional React components, CSS Modules, and semantic HTML with accessible `aria-*` attributes. Prettier settings are 2 spaces, double quotes, semicolons, trailing commas, and 100-character line width. Keep imports grouped with React first, local modules alphabetized, then styles/assets. Prefer explicit return types for exported functions. Use PascalCase for components and interfaces, camelCase for functions, and UPPER_SNAKE_CASE for constants. Avoid `any`, single-letter variables, and `console.log`; use `src/utils/logger.ts`.

## Testing Guidelines

Vitest covers unit and component tests; Playwright covers browser flows. Name unit tests as `*.test.ts(x)` or place them in `__tests__/`. Name E2E files `*.e2e.spec.ts`. Run `cnpm run test` for unit tests, `cnpm run test:coverage` for coverage, and `cnpm run test:e2e` for E2E. When adding or changing user-facing behavior, update `docs/testing-map.md` if tests are added or changed.

## Commit & Pull Request Guidelines

Git history follows focused Conventional Commit-style messages, often with scopes, for example `feat(weather): ...`, `fix: ...`, `docs(changelog): ...`, and `refactor(weatherService): ...`. Keep commits narrow and descriptive. PRs should explain what changed, why it changed, how it was tested, and link related issues. Include screenshots or recordings for UI changes, and update README or `docs/` for new settings or visible behavior.

## Security & Configuration Tips

Start from `.env.example` when local configuration is needed. Do not commit secrets, generated build output, or unrelated formatting churn. For storage changes, prefer `appSettings.ts` for persistent user preferences and add migration tests when moving existing localStorage keys.
