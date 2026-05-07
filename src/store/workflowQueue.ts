import { create } from 'zustand'
import type { TSchema } from 'typebox'
import type { ExecutionStatus } from '@design/StatusBadge/StatusBadge'
import type { Workflow, WorkflowEvent } from '@workflow/workflow'

export type WorkflowStepState = {
  name: string
  status: ExecutionStatus
  error?: string
}

export type WorkflowJob = {
  id: string
  name: string
  status: ExecutionStatus
  steps: WorkflowStepState[]
  error?: string
}

type WorkflowQueueStore = {
  jobs: WorkflowJob[]
  run: (name: string, wf: Workflow<TSchema, TSchema>, input: unknown) => string
  _nextId: () => string
  _updateJob: (id: string, fn: (j: WorkflowJob) => WorkflowJob) => void
  _onEvent: (id: string, event: WorkflowEvent) => void
}

export const useWorkflowStore = create<WorkflowQueueStore>((set, get) => ({
  jobs: [],

  _nextId: (() => {
    let n = 1
    return () => String(n++)
  })(),

  _updateJob: (id, fn) =>
    set(s => ({ jobs: s.jobs.map(j => (j.id === id ? fn(j) : j)) })),

  run: (name, wf, input) => {
    const id = get()._nextId()
    set(s => ({
      jobs: [...s.jobs, {
        id,
        name,
        status: 'running' as ExecutionStatus,
        steps: wf.steps.map(step => ({ name: step.name, status: 'pending' as ExecutionStatus })),
      }],
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(wf as any).run(input, (event: WorkflowEvent) => get()._onEvent(id, event))
      .catch(() => {})
    return id
  },

  _onEvent: (id, event) => {
    switch (event.type) {
      case 'step:start':
        get()._updateJob(id, j => ({
          ...j,
          steps: j.steps.map((s, i) =>
            i === event.stepIndex ? { ...s, status: 'running' as ExecutionStatus } : s
          ),
        }))
        break
      case 'step:complete':
        get()._updateJob(id, j => ({
          ...j,
          steps: j.steps.map((s, i) =>
            i === event.stepIndex ? { ...s, status: 'complete' as ExecutionStatus } : s
          ),
        }))
        break
      case 'step:error':
        get()._updateJob(id, j => ({
          ...j,
          steps: j.steps.map((s, i) =>
            i === event.stepIndex
              ? { ...s, status: 'failed' as ExecutionStatus, error: event.error.message }
              : s
          ),
        }))
        break
      case 'done':
        get()._updateJob(id, j => ({ ...j, status: 'complete' as ExecutionStatus }))
        break
      case 'error':
        get()._updateJob(id, j => ({ ...j, status: 'failed' as ExecutionStatus, error: event.error.message }))
        break
    }
  },
}))
