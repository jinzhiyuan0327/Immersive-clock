# Repository Guidelines

## Project Structure & Module Organization

Immersive Clock is a React 19 + TypeScript + Vite app with PWA and Electron targets. Web source lives in `src/`: `components/` for UI, `pages/ClockPage/` for the main screen, `contexts/` for state, `hooks/` for shared behavior, and `utils/` / `services/` for storage, weather, time sync, and noise. Electron code is in `electron/`. Static assets are in `public/`, docs in `docs/`, unit tests in `src/**/__tests__/`, and E2E tests in `tests/e2e/`.

## Build, Test, and Development Commands

Use Node `>=20.19.0`.

- `npm run dev`: start the Vite web dev server.
- `npm run dev:electron`: start Electron development mode.
- `npm run build`: build the web/PWA output.
- `npm run build:electron`: build Electron output.
- `npm run preview`: preview the production web build.
- `npm run lint` / `npm run lint:fix`: check or fix ESLint issues.
- `npm run format`: format code and docs with Prettier.

## Coding Style & Naming Conventions

Use TypeScript strict mode, functional React components, CSS Modules, and semantic HTML with `aria-*` attributes. Prettier uses 2 spaces, double quotes, semicolons, trailing commas, and 100-character line width. Group imports with React first, local modules alphabetized, then styles/assets. Use PascalCase for components/interfaces, camelCase for functions, and UPPER_SNAKE_CASE for constants. Avoid `any`, single-letter variables, and `console.log`; use `src/utils/logger.ts`.

## Testing Guidelines

Vitest covers unit/component tests; Playwright covers browser flows. Name unit tests `*.test.ts(x)` or place them in `__tests__/`; name E2E files `*.e2e.spec.ts`. Run `npm run test`, `npm run test:coverage`, or `npm run test:e2e` as needed. Update `docs/testing-map.md` when tests change.

## Agent-Specific Workflow

Think before coding. State assumptions when requirements are unclear, ask before materially different choices, and surface tradeoffs briefly. Keep changes surgical: touch required files, match existing style, and avoid adjacent refactors. Favor the smallest solution. Define success criteria for non-trivial work, then verify with the narrowest relevant lint, test, or build command.

## Commit & Pull Request Guidelines

Git history follows focused Conventional Commit-style messages, often with scopes: `feat(weather): ...`, `fix: ...`, `docs(changelog): ...`. Keep commits narrow. PRs should explain what changed, why, how it was tested, and link issues. Include screenshots for UI changes, and update README or `docs/` for visible behavior.

## Security & Configuration Tips

Start from `.env.example` for local configuration. Do not commit secrets, generated output, or unrelated formatting churn. For storage changes, prefer `appSettings.ts` and add migration tests when moving localStorage keys.
