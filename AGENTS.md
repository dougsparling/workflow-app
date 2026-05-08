# Project Context

This is a **React Native (Expo) mobile app** called "workflow-app" that demonstrates **LangChain.js agentic workflows** running on a mobile device.

## Setup

After cloning, activate the shared git hooks:

```sh
git config core.hooksPath .githooks
```

This enables the pre-commit guardrails (lint + typecheck + test).

## General Agent Guidance

- Do not delete comments when making adjacent refactoring unless the comment's validity is impacted by the change, in which case it should be rewritten, not removed.
- Use `pnpm` instead of npm/npx

## Tech Stack

- **React Native / Expo** — Cross-platform mobile app (iOS/Android/Web) using Expo SDK 54 with file-based routing via `expo-router`.
- **LangChain.js** — Integrates `@langchain/core`, `@langchain/openai`, and `@langchain/deepseek` to build an agentic loop.
- **TypeBox** — Runtime schema validation for workflow step I/O, with JSON Schema reflection for agent context.
- **Zod** — Schema validation for tool definitions.
- **Zustand** — Lightweight state management for the agent execution queue and workflow execution state.
- **pnpm** — Package manager (preferred over npm/npx).

## Architecture

- Connects to a local OpenAI-compatible API endpoint (`http://10.0.2.2:8080/v1`) running a model called `local-qwen-3.6` (likely Qwen via a local server like Ollama or vLLM), or to DeepSeek's API (with a user-provided API key stored via `@react-native-async-storage/async-storage`).
- Defines custom tools: `get_weather` and `get_exchange_rate`.
- Runs a **ReAct-style agent loop** where the LLM can call tools, get results, and continue reasoning until it produces a final answer.
- Execution state is managed via a **Zustand store** (`src/store/executionQueue.ts`) that handles job enqueueing, cancellation, message streaming, and sequential job advancement.
- Inspired by **[Mastra-style workflows](https://mastra.ai/docs/workflows/overview)** — a framework for building structured AI agent workflows — but implemented on top of LangChain.js rather than using Mastra directly.
- Workflow steps carry TypeBox input/output schemas at runtime, enabling schema reflection, validation, and agent-aware steps that receive their schemas automatically via the executor signature.

## Patches

There's a small patch to `@langchain/core` (at `patches/@langchain__core@1.1.41.patch`) to fix a `navigator.userAgent` optional chaining issue for React Native compatibility. The patch is applied via pnpm's `patchedDependencies` in `pnpm-workspace.yaml`.

There is another patch to `@langchain/openai` to provide pass-through support for DeepSeek-specific reasoning_content. This is to prevent 400 errors when calling DeepSeek API in multi-turn scenarios.

## Directory Conventions

- `src/app/` — Expo Router file-based navigation root. Contains `_layout.tsx` (root layout wrapping AssetLoader, ThemeProvider, and Stack navigator), `index.tsx` (redirect to workflows tab), and `(tabs)/` (bottom tab navigator with outbox, workflows, and settings screens).
- `src/contexts/` — React contexts, providers, and loaders (e.g. `AssetLoader`). Each file exports a provider or hook.
- `src/components/` — Reusable UI components. Each component lives in its own directory, no barrel files. Pattern: `components/{name}/{name}.tsx`.
- `src/design/` — Design system: theme provider, design tokens, and reusable themed UI components.
- `src/domain/` — Reusable types and domain objects shared across the app.
- `src/hooks/` — Reusable React hooks (data fetching, state, etc.). Import via `@hooks/*`.
- `src/store/` — Zustand state stores (e.g. `executionQueue.ts` for agent execution lifecycle).
- `src/workflow/` — Library module containing the workflow engine, agent loop, tool definitions, model configurations, and tests.

## Code Organization

- **Test files** — Tests (`it`/`test` blocks) should appear first, followed by helper functions at the bottom of the file.
- **Component files** — The default export component should be the first export in the file.
- **Type discipline** — Avoid `any` and `unknown` as much as possible. Prefer precise types, generics, or branded types over escape hatches.

## Design System (`src/design/`)

The design system is built around a theme context (`theme.tsx`) that provides light/dark mode tokens and a set of reusable themed components:

- **`theme.tsx`** — Theme provider (`ThemeProvider`), `useTheme` hook, `useThemedStyles` / `createThemedStyles` utilities, and full design tokens (typography, spacing, borders, animation, colors) for both dark (phosphor-green on deep charcoal) and light (warm paper) themes.
- **`ActionRow/ActionRow.tsx`** — Pressable list row with title, up to two subtitles, status badge, time, optional accent border, and a `trailing` slot (defaults to a chevron).
- **`Background/Background.tsx`** — Full-screen container with themed background color and standard padding.
- **`BottomSheet/BottomSheet.tsx`** — Animated modal bottom sheet with backdrop press-to-dismiss.
- **`Button/Button.tsx`** — Themed button with `primary`, `ghost`, `destructive`, and `secondary` variants, optional icon, and press/disabled states.
- **`EmptyState/EmptyState.tsx`** — Centered placeholder with a single muted message string.
- **`LogLine/LogLine.tsx`** — Log entry row with timestamp, level badge (INFO/WARN/ERROR/DEBUG), and message.
- **`MultiToggle/MultiToggle.tsx`** — Segmented toggle control for selecting among a fixed set of labeled options.
- **`SectionLabel/SectionLabel.tsx`** — Uppercased section header label (no horizontal padding; relies on parent container for layout padding).
- **`StatusBadge/StatusBadge.tsx`** — Status indicator with colored dot and label for `running`, `complete`, `pending`, `failed`, `idle`, `stopped`, `aborted` states.
- **`TextInput/TextInput.tsx`** — Themed text input with label, hint, error state, and disabled state.

### Style rules

- **Use token values directly — no arithmetic.** Never write `tokens.space2 + 2` or `tokens.textBase - 1` in style definitions. If the available tokens don't fit, snap to the nearest token and flag it for a token addition instead.

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

- `src/workflow/agent.ts` — Core agentic loop (`runAgent`) with tool dispatch and streaming callback.
- `src/workflow/agentstep.ts` — Binds an agent to a workflow step: injects workflow control tools (`read_input`, `complete_step`, `fail_step`), extends the system prompt with input/output schemas, and resolves via an outcome state object after `runAgent` completes. Used as `.step("name", Schema, agentStep(agent))`.
- `src/workflow/models.ts` — Model configurations: local Qwen (via ChatOpenAI) and DeepSeek Flash (via ChatDeepSeek), with AsyncStorage-persisted API key.
- `src/workflow/tools.ts` — Tool definitions: `wikipedia` (WikipediaQueryRun).
- `src/workflow/workflow.ts` — Type-safe workflow builder with composable steps (Mastra-inspired). Each step's executor receives `(input, inputSchema, outputSchema)` — plain lambdas can ignore the schema params
- `src/workflow/workflow.test.ts` — Jest tests for the workflow builder.
- `src/store/executionQueue.ts` — Zustand store managing job lifecycle (enqueue, cancel, sequential execution, message streaming).
- `src/app/_layout.tsx` — Root layout wrapping AssetLoader, ThemeProvider, and Stack navigator.
- `src/app/index.tsx` — Redirect to the workflows tab.
- `src/app/(tabs)/_layout.tsx` — Bottom tab navigator (outbox, workflows, settings). The executions route exists but is hidden (`href: null`) and accessible only via programmatic navigation.
- `src/app/(tabs)/outbox.tsx` — Outbox document list screen.
- `src/app/(tabs)/executions.tsx` — Execution queue screen showing job cards with status and cancel support (hidden tab, reachable via navigation).
- `src/app/(tabs)/settings.tsx` — Settings screen with API key inputs (DeepSeek, Anthropic) and theme preference selector.
- `src/components/ExecutionDetail/ExecutionDetail.tsx` — Execution detail view showing agent name, prompt, status, and step-by-step message log.
- `src/contexts/asset-loader.tsx` — Font loading and splash screen management.
