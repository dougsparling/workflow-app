import { create } from 'zustand'
import type { TSchema } from 'typebox'
import type { Workflow, WorkflowEvent } from '@workflow/workflow'
import { createSerialQueue, type BaseJob, type JobStatus, type SerialQueueSlice } from './serialQueue'

export type WorkflowStepState =
  | { name: string; status: 'pending' }
  | { name: string; status: 'running';  inputData: unknown; executionId?: string }
  | { name: string; status: 'complete'; inputData: unknown; outputData: unknown; executionId?: string }
  | { name: string; status: 'failed';   inputData: unknown; error: string; executionId?: string }

export type WorkflowJob = BaseJob & {
  name: string
  steps: WorkflowStepState[]
  error?: string
  wf: Workflow<TSchema, TSchema>
  input: unknown
}

type WorkflowQueueStore = SerialQueueSlice<WorkflowJob> & {
  enqueueWorkflow: (name: string, wf: Workflow<TSchema, TSchema>, input: unknown) => string
  _onEvent: (id: string, event: WorkflowEvent) => void
}

export const useWorkflowStore = create<WorkflowQueueStore>((set, get) => {
  const queue = createSerialQueue<WorkflowJob>(
    (job) => job.wf.run(job.input, (event: WorkflowEvent) => get()._onEvent(job.id, event)).then(() => {}),
  )(
    set as (fn: (s: { jobs: WorkflowJob[] }) => { jobs: WorkflowJob[] }) => void,
    get as () => SerialQueueSlice<WorkflowJob>,
  )

  return {
    ...queue,
    enqueueWorkflow: (name, wf, input) => queue.enqueue({
      name,
      wf,
      input,
      steps: wf.steps.map(step => ({ name: step.name, status: 'pending' as const })),
    }),
    _onEvent: (id, event) => {
      switch (event.type) {
        case 'step:start':
          get()._updateJob(id, j => ({
            ...j,
            steps: j.steps.map((s, i) =>
              i === event.stepIndex
                ? { name: s.name, status: 'running' as const, inputData: event.input }
                : s
            ),
          }))
          break
        case 'step:execution-created':
          get()._updateJob(id, j => ({
            ...j,
            steps: j.steps.map((s, i) =>
              i === event.stepIndex && s.status !== 'pending'
                ? { ...s, executionId: event.executionId }
                : s
            ),
          }))
          break
        case 'step:complete':
          get()._updateJob(id, j => ({
            ...j,
            steps: j.steps.map((s, i) => {
              if (i !== event.stepIndex || s.status === 'pending') return s
              return { name: s.name, status: 'complete' as const, inputData: s.inputData, outputData: event.output, executionId: s.executionId }
            }),
          }))
          break
        case 'step:error':
          get()._updateJob(id, j => ({
            ...j,
            steps: j.steps.map((s, i) => {
              if (i !== event.stepIndex || s.status === 'pending') return s
              return { name: s.name, status: 'failed' as const, inputData: s.inputData, error: event.error.message, executionId: s.executionId }
            }),
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
