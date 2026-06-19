# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Immersive Clock is a React 19 + TypeScript + Vite application for clock, countdown, stopwatch, and study modes. It ships as a web/PWA app and can also be built with Electron.

Use `package.json` as the source of truth for runtime requirements and scripts. The current Node requirement is `>=20.19.0`.

## Common commands

The contributor docs use `cnpm`, but the checked-in lockfile is `package-lock.json`; `npm` works for the same scripts unless you specifically need to match the docs.

```bash
# Install dependencies
npm install

# Copy local env template when working on weather/location integrations
# PowerShell:
copy .env.example .env
# macOS/Linux:
cp .env.example .env

# Web development server: http://127.0.0.1:3005/
npm run dev

# Electron development mode
npm run dev:electron

# Production web build and preview
npm run build
npm run preview

# Electron build / package
npm run build:electron
npm run pack:electron
npm run dist:electron

# Lint / format
npm run lint
npm run lint:fix
npm run format

# Unit tests
npm run test
npm run test:coverage

# Run one Vitest file or one test name
npm run test -- src/utils/__tests__/formatTime.test.ts
npm run test -- src/utils/__tests__/formatTime.test.ts -t "formats"

# E2E tests
npm run test:e2e:install
npm run test:e2e
```

E2E notes:
- `playwright.config.ts` starts the app at `http://127.0.0.1:3005` and defaults to the system Edge channel (`msedge`).
- The Playwright web server command is hardcoded as `cnpm run dev`. If `cnpm` is unavailable, either install/use `cnpm`, or start `npm run dev` yourself first so Playwright can reuse the already-running server.
- To use bundled Playwright browsers instead of system Edge, set `PW_BUNDLED_BROWSERS=1` before running E2E tests.

## Configuration and environment

`.env.example` documents weather/location keys:

- `VITE_QWEATHER_API_HOST`
- `VITE_QWEATHER_API_KEY`
- `VITE_AMAP_API_KEY`

Weather flows can still be exercised in tests with mocks, but real weather/location behavior needs valid keys and browser permissions.

## High-level architecture

### Entrypoints and shell

- `src/main.tsx` bootstraps the browser app. Before rendering it initializes local storage migrations, applies the error-center mode from persisted settings, enables global error capture, mounts `BrowserRouter` + `AppContextProvider` + `App`, and conditionally registers the PWA.
- `src/App.tsx` is the top-level route shell. Both `/` and the fallback route render `ClockPage`; this component also controls startup animation, announcement timing, and tour-completion confetti.
- `src/pages/ClockPage/ClockPage.tsx` is the main screen and mode dispatcher. It renders the active clock/countdown/stopwatch/study view, HUD, settings panel, countdown modal, announcements, and global message popups.

### State and mode flow

- `src/contexts/AppContext.tsx` is the central React state store, implemented with `useReducer`.
- The main modes are `clock`, `countdown`, `stopwatch`, and `study` (`src/types/index.ts`). `SET_MODE` switches modes and hides the HUD.
- Initial mode and many settings are loaded from persisted app settings. Several reducer actions write through to local storage with `updateAppSettings` / `updateStudySettings`, so state changes are often persistent, not just in-memory.
- `ClockPage` handles HUD visibility: click or `Space`/`Enter` shows the HUD, with an 8-second auto-hide unless focus remains inside the HUD or the tour is active.
- `ClockPage` filters global message popups by mode: study mode can show all popup types; non-study modes retain only weather-related popups.

### Components

- Feature UI lives in `src/components/`, organized by domain (`Clock`, `Countdown`, `Stopwatch`, `Study`, `SettingsPanel`, `Weather`, `NoiseMonitor`, etc.).
- `SettingsPanel` is split into section components under `src/components/SettingsPanel/sections/`.
- Shared types are concentrated in `src/types/`.
- Styling uses CSS Modules plus global CSS variables in `src/styles/`.

### Services vs utils

A useful boundary in this codebase:

- `src/services/` contains network/device/API orchestration and workflow-level services.
- `src/utils/` contains persistence, settings, migrations, domain helpers, and browser-storage wrappers.

Examples:

- Weather orchestration: `src/services/weatherService.ts`, `locationService.ts`, `qweatherClient.ts`, `apiGovernance.ts`.
- Noise capture pipeline: `src/services/noise/noiseStreamService.ts`, `noiseCapture.ts`, `noiseFrameProcessor.ts`, `noiseSliceAggregator.ts`.
- Settings and persistence: `src/utils/appSettings.ts`, `storageInitializer.ts`, `weatherStorage.ts`, `noiseSliceService.ts`, `studyScheduleStorage.ts`, `studyBackgroundStorage.ts`, `studyFontStorage.ts`, `announcementStorage.ts`, `errorCenter.ts`.

### Weather system

Weather support combines settings, cached location/weather state, and API clients:

- `weatherService.ts` composes weather fetch flows.
- `locationService.ts` resolves cached, browser geolocation, IP fallback, manual city, and manual coordinate flows.
- `qweatherClient.ts` wraps QWeather requests and credentials.
- `weatherStorage.ts`, `weatherAlert.ts`, and `minutelyPrecipLogic.ts` handle cache and alert/precipitation logic.

Weather tests are clustered in `src/services/__tests__/weatherService*.test.ts` and `src/utils/__tests__/weather*.test.ts` / `minutelyPrecipLogic.test.ts`.

### Noise system

Noise monitoring is split so capture, frame processing, aggregation, scoring, and persistence can be tested independently:

- `noiseStreamService.ts` coordinates shared capture lifecycle and subscriptions.
- `noiseFrameProcessor.ts` processes raw frames.
- `noiseSliceAggregator.ts` aggregates frames into slices.
- `noiseScoreEngine.ts`, `noiseSliceService.ts`, and `noiseHistoryBuilder.ts` score, store, and report history.

Relevant tests live under `src/services/noise/__tests__/` and `src/utils/__tests__/noise*.test.ts`.

### Storage and migrations

Most persistent app state is browser storage:

- `src/utils/appSettings.ts` defines the canonical `AppSettings` shape and default settings.
- `src/utils/storageInitializer.ts` runs startup migration/cleanup before the React app renders.
- Additional storage helpers own their domains (weather cache, announcements, error center, study schedule/background/font, noise slices).
- `ClockPage` also uses `sessionStorage` for transient minute-level precipitation popup state.

When changing settings shape, update defaults, merge/migration behavior, and the related storage tests.

### Electron

- Vite switches behavior when run with `--mode electron`.
- `electron/main.ts` creates the `BrowserWindow`, loads the Vite dev server in dev or `app://local/index.html` in production, registers the privileged `app://` protocol, restricts navigation/window opening, and registers time-sync IPC.
- `electron/preload.ts` exposes a small `window.electronAPI` bridge, currently including platform and NTP time sync.
- `vite.config.ts` builds Electron main/preload outputs into `dist-electron` and uses `./` as the Electron base path.

### Build/PWA behavior

`vite.config.ts` combines React, PWA, Electron, and `versionCachePlugin`:

- Dev server is forced to `127.0.0.1:3005`.
- PWA is disabled in Electron mode via `__ENABLE_PWA__`.
- The app version is taken from `VITE_APP_VERSION` or falls back to `package.json`.
- Production builds use Terser and route assets into `fonts/`, `images/`, `audio/`, `assets/`, and `js/` buckets.

## Testing map

- Unit tests use Vitest with `jsdom`, configured in `vitest.config.ts`; setup is `src/setupTests.ts`.
- Vitest includes `src/**/*.{test,spec}.{ts,tsx}` and excludes E2E, `node_modules`, `dist`, and `dist-electron`.
- E2E tests are in `tests/e2e/`; helpers in `tests/e2e/e2eUtils.ts` dismiss blocking modals and show the HUD before interacting.
- `docs/testing-map.md` maps important behavior areas to their test files and is the best starting point when choosing regression tests.

Useful targeted test clusters:

- Reducer/state: `src/contexts/__tests__/AppContext.test.ts`
- Clock page behavior: `src/pages/ClockPage/__tests__/`
- Settings/storage/migrations: `src/utils/__tests__/appSettings.test.ts`, `storageInitializer.*.test.ts`
- Weather: `src/services/__tests__/weatherService*.test.ts`, `src/utils/__tests__/weather*.test.ts`
- Noise: `src/services/noise/__tests__/`, `src/utils/__tests__/noise*.test.ts`
- Core E2E flows: `tests/e2e/mode-switch.e2e.spec.ts`, `countdown.e2e.spec.ts`, `stopwatch.e2e.spec.ts`, `study-smoke.e2e.spec.ts`, `settings-persistence.e2e.spec.ts`

## Repository conventions from docs/config

- TypeScript is preferred; shared type definitions belong in `src/types/` when they are not local to a component/service.
- General UI components live in `src/components/` by feature/domain name.
- Use CSS Modules and the existing CSS-variable tokens in `src/styles/`.
- Interaction changes should preserve keyboard access and ARIA behavior; HUD access via click/`Space`/`Enter` is a documented user flow.
- If changes affect user-facing docs, keep Chinese and English docs/README content aligned where relevant.
