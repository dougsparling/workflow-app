import { create } from 'zustand'
import type { TSchema } from 'typebox'
import type { ExecutionStatus } from '@design/StatusBadge/StatusBadge'
import type { Workflow, WorkflowEvent } from '@workflow/workflow'
import { createSerialQueue, type BaseJob, type JobStatus, type SerialQueueSlice } from './serialQueue'

export type WorkflowStepState = {
  name: string
  status: ExecutionStatus
  error?: string
}

export type WorkflowJob = BaseJob & {
  name: string
  steps: WorkflowStepState[]
  error?: string
  wf: Workflow<TSchema, TSchema>
  input: unknown
}

type WorkflowQueueStore = SerialQueueSlice<WorkflowJob> & {
  enqueue: (name: string, wf: Workflow<TSchema, TSchema>, input: unknown) => string
  _onEvent: (id: string, event: WorkflowEvent) => void
}

export const useWorkflowStore = create<WorkflowQueueStore>((set, get) => {
  const queue = createSerialQueue<WorkflowJob>(
    set as (fn: (s: { jobs: WorkflowJob[] }) => { jobs: WorkflowJob[] }) => void,
    get,
    (job) => {
      return job.wf.run(job.input, (event: WorkflowEvent) => get()._onEvent(job.id, event)).then(() => {})
    },
  )

  return {
    ...queue,

    enqueue: (name, wf, input) => {
      const id = queue._nextId()
      set(s => ({
        jobs: [...s.jobs, {
          id,
          name,
          status: 'pending' as JobStatus,
          steps: wf.steps.map(step => ({ name: step.name, status: 'pending' as ExecutionStatus })),
          abort: new AbortController(),
          wf,
          input,
        }],
      }))
      get()._advance()
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
          get()._updateJob(id, j => ({ ...j, status: 'complete' as JobStatus }))
          break
        case 'error':
          get()._updateJob(id, j => ({ ...j, status: 'failed' as JobStatus, error: event.error.message }))
          break
      }
    },
  }
})
