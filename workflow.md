# Workflow Execution POC with UI Progress

## Status: Implemented ✓

All 9 files have been written and typecheck clean (`pnpm tsc --noEmit`). Ready for runtime testing.

---

## What was built

### Core workflow layer
- **`src/workflow/workflow.ts`** — added `WorkflowEvent` / `WorkflowCallback` types; `runSteps` fires `step:start`, `step:complete`, `step:error`, `done`, `error` events; `run()` default callback is `() => {}`
- **`src/workflow/agent.ts`** — exported `OnNextCallback` type
- **`src/workflow/agentstep.ts`** — exported `AgentExecutor` type; `agentStep` takes optional executor defaulting to `runAgent`

### Store layer
- **`src/store/serialQueue.ts`** — generic `createSerialQueue<J extends BaseJob>` mixin; `runJob` returns `'complete' | 'failed'` so mixin drives `_onDone`, eliminating the old double-advance race
- **`src/store/executionQueue.ts`** — refactored to spread the mixin; `Job` gains optional `callback` field; new `enqueueAsync(def, prompt, agentCallback?)` resolves/rejects via wrapped callback (no fields added to `Job`)
- **`src/store/workflowQueue.ts`** — new store; fires workflow runs immediately (agent steps serialize through executionQueue); maps `WorkflowEvent` → per-step status

### App layer
- **`src/workflow/sampleWorkflow.ts`** — 2-step deepseek pipeline (summarize → bullet-points); `queueExecutor` delegates to `enqueueAsync` so each step appears in the Executions tab
- **`src/components/WorkflowDetail/WorkflowDetail.tsx`** — FlatList of step ActionRows with status badges; footer spinner while running
- **`src/app/(tabs)/workflows.tsx`** — job list + bottom sheet detail + "Run workflow" button

---

## How it works end-to-end

1. User taps "Run workflow" → `workflowQueue.run()` starts workflow, initializes steps as `pending`
2. Workflow calls `agentStep(def, queueExecutor)` for each step
3. `queueExecutor` calls `executionQueue.enqueueAsync()` → agent job queued in Executions tab
4. `enqueueAsync` returns a promise that resolves when the agent job completes; its `agentCallback` forwards messages back to `agentStep`'s `complete_step`/`fail_step` tracking
5. `WorkflowEvent` callbacks update step statuses in `workflowQueue` in real time
6. Both tabs show live progress simultaneously

---

## Remaining / follow-up work

- [ ] Runtime test against actual model (deepseek or swap to qwen)
- [ ] Consider adding workflow cancellation (abort propagation into running agent step)
- [ ] Consider serializing workflow runs via `executionQueue` or a new queue if concurrent runs cause issues
- [ ] The `sampleWorkflow as unknown as Workflow<TSchema, TSchema>` cast in `workflows.tsx` could be cleaned up by making the store's `run` accept a structurally typed workflow interface instead of the generic

---

## Context: design decisions

**`WorkflowCallback` required in `runSteps`, default at call site** — keeps internal usage explicit; callers that don't need events pass nothing.

**No `Job._resolve/_reject`** — `enqueueAsync` wraps the agent callback in a closure; promise lives entirely there, `Job` type unchanged.

**`createSerialQueue` mixin** — parameterized by `runJob: (job) => Promise<'complete'|'failed'>`. The mixin handles advance/done/cancel; caller provides the job-specific execution logic. Removes the previous pattern where both `.then(_advance)` and `_onDone` called `_advance` redundantly.

**Workflows not serialized** — workflow runs fire immediately; serialization happens inside via `executionQueue`. If workflow-level queuing is needed later, `workflowQueue` can be refactored to also use `createSerialQueue`.
