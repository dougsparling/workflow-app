# Project Context

This is a **React Native (Expo) mobile app** called "workflow-app" that demonstrates **LangChain.js agentic workflows** running on a mobile device. It's a proof-of-concept combining:

## Tech Stack

- **React Native / Expo** — Cross-platform mobile app (iOS/Android/Web) using Expo SDK 54 with file-based routing via `expo-router`.
- **LangChain.js** — Integrates `@langchain/core`, `@langchain/openai`, and `@langchain/deepseek` to build an agentic loop.
- **Zod** — Schema validation for tool definitions.
- **Zustand** — Lightweight state management for the agent execution queue and workflow execution state.
- **pnpm** — Package manager (preferred over npm/npx).

## Architecture

- Connects to a local OpenAI-compatible API endpoint (`http://10.0.2.2:8080/v1`) running a model called `local-qwen-3.6` (likely Qwen via a local server like Ollama or vLLM), or to DeepSeek's API (with a user-provided API key stored via `@react-native-async-storage/async-storage`).
- Defines custom tools: `get_weather` and `get_exchange_rate`.
- Runs a **ReAct-style agent loop** where the LLM can call tools, get results, and continue reasoning until it produces a final answer.
- Execution state is managed via a **Zustand store** (`src/store/executionQueue.ts`) that handles job enqueueing, cancellation, message streaming, and sequential job advancement.
- Inspired by **[Mastra-style workflows](https://mastra.ai/docs/workflows/overview)** — a framework for building structured AI agent workflows — but implemented on top of LangChain.js rather than using Mastra directly.

## Patches

There's a small patch to `@langchain/core` (at `patches/@langchain__core@1.1.41.patch`) to fix a `navigator.userAgent` optional chaining issue for React Native compatibility. The patch is applied via pnpm's `patchedDependencies` in `pnpm-workspace.yaml`.

## Directory Conventions

- `src/app/` — Expo Router file-based navigation root. Contains `_layout.tsx` (root layout wrapping AssetLoader, ThemeProvider, and Stack navigator), `index.tsx` (redirect to executions tab), and `(tabs)/` (bottom tab navigator with executions, workflows, agents, and settings screens).
- `src/contexts/` — React contexts, providers, and loaders (e.g. `AssetLoader`). Each file exports a provider or hook.
- `src/components/` — Reusable UI components. Each component lives in its own directory, no barrel files. Pattern: `components/{name}/{name}.tsx`.
- `src/design/` — Design system: theme provider, design tokens, and reusable themed UI components.
- `src/domain/` — (Reserved) Reusable types and domain objects shared across the app.
- `src/hooks/` — (Reserved) Reusable React hooks (data fetching, state, etc.). Import via `@hooks/*`.
- `src/store/` — Zustand state stores (e.g. `executionQueue.ts` for agent execution lifecycle).
- `src/workflow/` — Library module containing the workflow engine, agent loop, tool definitions, model configurations, and tests.

## Design System (`src/design/`)

The design system is built around a theme context (`theme.tsx`) that provides light/dark mode tokens and a set of reusable themed components:

- **`theme.tsx`** — Theme provider (`ThemeProvider`), `useTheme` hook, `useThemedStyles` / `createThemedStyles` utilities, and full design tokens (typography, spacing, borders, animation, colors) for both dark (phosphor-green on deep charcoal) and light (warm paper) themes.
- **`Background/Background.tsx`** — Full-screen container with themed background color and standard padding.
- **`BottomSheet/BottomSheet.tsx`** — Animated modal bottom sheet with backdrop press-to-dismiss.
- **`Label/Label.tsx`** — Themed text component with `primary` / `secondary` types and `enabled` state.
- **`ListRow/ListRow.tsx`** — Pressable list row with title, subtitle, status badge, time, and optional accent border.
- **`LogLine/LogLine.tsx`** — Log entry row with timestamp, level badge (INFO/WARN/ERROR/DEBUG), and message.
- **`PrimaryButton/PrimaryButton.tsx`** — Themed button with `primary`, `ghost`, and `destructive` variants, optional icon, and press/disabled states.
- **`SecondaryButton/SecondaryButton.tsx`** — Outlined button with press/disabled states and optional icon.
- **`SectionLabel/SectionLabel.tsx`** — Uppercased section header label.
- **`StatusBadge/StatusBadge.tsx`** — Status indicator with colored dot and label for `running`, `complete`, `pending`, `failed`, `idle`, `stopped` states.
- **`StepRow/StepRow.tsx`** — Workflow step row with index badge, name, duration, and status badge; highlights running steps with a left accent border.
- **`TextInput/TextInput.tsx`** — Themed text input with label, hint, error state, and disabled state.

## TSConfig Path Aliases

```
@hooks/*       → src/hooks/*
@components/*  → src/components/*
@design/*      → src/design/*
@domain/*      → src/domain/*
@contexts/*    → src/contexts/*
@workflow/*    → src/workflow/*
@store/*       → src/store/*
```

## Key Files

- `src/workflow/agent.ts` — Core agentic loop and tool definitions (LangChain.js ReAct agent).
- `src/workflow/models.ts` — Model configurations: local Qwen (via ChatOpenAI) and DeepSeek Flash (via ChatDeepSeek), with AsyncStorage-persisted API key.
- `src/workflow/tools.ts` — Custom tool definitions: `get_weather` and `get_exchange_rate`.
- `src/workflow/workflow.ts` — Type-safe workflow builder with composable steps (Mastra-inspired).
- `src/workflow/workflow.test.ts` — Jest tests for the workflow builder.
- `src/store/executionQueue.ts` — Zustand store managing job lifecycle (enqueue, cancel, sequential execution, message streaming).
- `src/app/_layout.tsx` — Root layout wrapping AssetLoader, ThemeProvider, and Stack navigator.
- `src/app/index.tsx` — Redirect to the Executions tab.
- `src/app/(tabs)/_layout.tsx` — Bottom tab navigator (executions, workflows, agents, settings).
- `src/app/(tabs)/agents.tsx` — Agent selection screen with predefined agents (Weather, Finance, Research, Assistant) and a run-prompt bottom sheet.
- `src/app/(tabs)/executions.tsx` — Execution queue screen showing job cards with status and cancel support.
- `src/app/(tabs)/settings.tsx` — Settings screen with DeepSeek API key input and theme preference selector.
- `src/components/ExecutionDetail/ExecutionDetail.tsx` — Execution detail view showing agent name, prompt, status, and step-by-step message log.
- `src/contexts/asset-loader.tsx` — Font loading and splash screen management.
