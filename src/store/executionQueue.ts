import { create } from 'zustand'
import { AIMessage, ToolMessage } from '@langchain/core/messages'

import type { BaseMessage } from '@langchain/core/messages'
import type { AgentDef } from '@workflow/agent'
import { runAgent } from '@workflow/agent'
import { createSerialQueue, type BaseJob, type SerialQueueSlice } from './serialQueue'

export type MessageEntry = {
  msg: BaseMessage
  ts: number
}

export type Job = BaseJob & {
  prompt: string
  def: AgentDef
  messages: MessageEntry[]
  error?: Error
}

type ExecutionQueueStore = SerialQueueSlice<Job> & {
  enqueueAgent: (def: AgentDef, prompt: string) => string
  _onMessage: (id: string, msg: BaseMessage) => void
}

export const useExecutionStore = create<ExecutionQueueStore>((set, get) => {
  const runJob = async (job: Job): Promise<void> => {
    try {
      for await (const msg of runAgent(job.def, job.prompt, job.abort.signal)) {
        get()._onMessage(job.id, msg)
      }
    } catch (err) {
      get()._updateJob(job.id, j => ({ ...j, error: err instanceof Error ? err : new Error(String(err)) }))
      throw err
    }
  }

  const queue = createSerialQueue<Job>(runJob)(
    set as (fn: (s: { jobs: Job[] }) => { jobs: Job[] }) => void,
    get as () => SerialQueueSlice<Job>,
  )

  return {
    ...queue,
    enqueueAgent: (def, prompt) => queue.enqueue({ def, prompt, messages: [] }),
    _onMessage: (id, msg) =>
      get()._updateJob(id, j => ({ ...j, messages: [...j.messages, { msg, ts: Date.now() }] })),
  }
})

export function enqueueAsync(def: AgentDef, prompt: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const id = useExecutionStore.getState().enqueueAgent(def, prompt)
    const unsub = useExecutionStore.subscribe((state) => {
      const job = state.jobs.find(j => j.id === id)
      if (!job) return
      if (job.status === 'complete' || job.status === 'aborted') {
        unsub()
        resolve()
      }
      if (job.status === 'failed') {
        unsub()
        reject(job.error ?? new Error('Job failed'))
      }
    })
  })
}

export function messageLevel(msg: BaseMessage): 'INFO' | 'DEBUG' | null {
  if (AIMessage.isInstance(msg)) return 'INFO'
  if (ToolMessage.isInstance(msg)) return 'DEBUG'
  return null
}
