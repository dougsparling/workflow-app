# Project Context

This is a **React Native (Expo) mobile app** called "workflow-app" that demonstrates **LangChain.js agentic workflows** running on a mobile device. It's a proof-of-concept combining:

## Tech Stack

- **React Native / Expo** — Cross-platform mobile app (iOS/Android/Web) using Expo SDK 54 with file-based routing via `expo-router`.
- **LangChain.js** — Integrates `@langchain/core` and `@langchain/openai` to build an agentic loop.
- **Zod** — Schema validation for tool definitions.
- **pnpm** — Package manager (preferred over npm/npx).

## Architecture

- Connects to a local OpenAI-compatible API endpoint (`http://10.0.2.2:8080/v1`) running a model called `local-qwen-3.6` (likely Qwen via a local server like Ollama or vLLM).
- Defines custom tools: `get_weather` and `get_exchange_rate`.
- Runs a **ReAct-style agent loop** where the LLM can call tools, get results, and continue reasoning until it produces a final answer.
- Inspired by **[Mastra-style workflows](https://mastra.ai/docs/workflows/overview)** — a framework for building structured AI agent workflows — but implemented on top of LangChain.js rather than using Mastra directly.

## Patches

There's a small patch to `@langchain/core` (at `patches/@langchain__core@1.1.41.patch`) to fix a `navigator.userAgent` optional chaining issue for React Native compatibility. The patch is applied via pnpm's `patchedDependencies` in `pnpm-workspace.yaml`.

## Key Files

- `app/workflow/index.ts` — Core agentic loop and tool definitions.
- `app/index.tsx` — Main screen that triggers the agent.
- `app/_layout.tsx` — Root layout (Expo Router stack).
