import { create } from 'zustand'
import { AIMessage, ToolMessage } from '@langchain/core/messages'

import type { BaseMessage } from '@langchain/core/messages'
import type { AgentDef } from '@workflow/agent'
import type { OnNextCallback } from '@workflow/agent'
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
  callback?: (event: OnNextCallback) => void
}

type ExecutionQueueStore = SerialQueueSlice<Job> & {
  enqueue: (def: AgentDef, prompt: string, callback?: (event: OnNextCallback) => void) => void
  enqueueAsync: (def: AgentDef, prompt: string, agentCallback?: (event: OnNextCallback) => void) => Promise<void>
  _onMessage: (id: string, msg: BaseMessage) => void
}

export const useExecutionStore = create<ExecutionQueueStore>((set, get) => {
  const runJob = (job: Job): Promise<'complete' | 'failed'> =>
    new Promise(resolve => {
      runAgent(job.def, job.prompt, (cb) => {
        job.callback?.(cb)
        if (cb.type === 'message') {
          get()._onMessage(job.id, cb.msg)
          if (cb.last) resolve('complete')
        } else if (cb.type === 'error') {
          if (!job.abort.signal.aborted) resolve('failed')
        }
      })
    })

  const queue = createSerialQueue<Job>(set as Parameters<typeof createSerialQueue<Job>>[0], get as () => SerialQueueSlice<Job>, runJob)

  return {
    ...queue,

    enqueue: (def, prompt, callback?) => {
      const id = get()._nextId()
      const job: Job = {
        id,
        prompt,
        def,
        messages: [],
        status: 'pending',
        abort: new AbortController(),
        callback,
      }
      set(s => ({ jobs: [...s.jobs, job] }))
      if (!get().jobs.some(j => j.status === 'running')) get()._advance()
    },

    enqueueAsync: (def, prompt, agentCallback?) => {
      return new Promise<void>((resolve, reject) => {
        const callback = (cb: OnNextCallback) => {
          agentCallback?.(cb)
          if (cb.type === 'message' && cb.last) resolve()
          else if (cb.type === 'error') reject(cb.error)
        }
        get().enqueue(def, prompt, callback)
      })
    },

    _onMessage: (id, msg) =>
      get()._updateJob(id, j => ({ ...j, messages: [...j.messages, { msg, ts: Date.now() }] })),
  }
})

export function messageLevel(msg: BaseMessage): 'INFO' | 'DEBUG' | null {
  if (AIMessage.isInstance(msg)) return 'INFO'
  if (ToolMessage.isInstance(msg)) return 'DEBUG'
  return null
}
