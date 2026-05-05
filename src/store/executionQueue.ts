import { create } from 'zustand'
import { AIMessage, ToolMessage } from '@langchain/core/messages'

import type { BaseMessage } from '@langchain/core/messages'
import type { AgentDef } from '@workflow/agent'
import { runAgent } from '@workflow/agent'

type JobStatus = 'pending' | 'running' | 'done' | 'error'

export type MessageEntry = {
  msg: BaseMessage
  ts: number
}

export type Job = {
  id: string
  agentName: string
  prompt: string
  def: AgentDef
  messages: MessageEntry[]
  status: JobStatus
  startedAt?: number
  abort: AbortController
}

type ExecutionQueueStore = {
  jobs: Job[]
  enqueue: (agentName: string, prompt: string, def: AgentDef) => void
  cancel: (id: string) => void
  
  _nextId: number
  _advance: () => void
  _updateJob: (id: string, updater: (job: Job) => Job) => void
  _onMessage: (id: string, msg: BaseMessage) => void
  _onDone: (id: string, status: 'done' | 'error') => void
}

export const useExecutionStore = create<ExecutionQueueStore>((set, get) => ({
  jobs: [],
  _nextId: 1,

  enqueue: (agentName, prompt, def) => {
    const id = String(get()._nextId)
    set((s) => ({ _nextId: s._nextId + 1 }))
    const job: Job = {
      id,
      agentName,
      prompt,
      def,
      messages: [],
      status: 'pending',
      abort: new AbortController(),
    }
    set((s) => ({ jobs: [...s.jobs, job] }))
    if (!get().jobs.some((j) => j.status === 'running')) {
      get()._advance()
    }
  },

  cancel: (id) => {
    const job = get().jobs.find((j) => j.id === id)
    if (!job) return
    job.abort.abort()
    get()._updateJob(id, (j) => ({ ...j, status: 'error' as const }))
    get()._advance()
  },

  _updateJob: (id, updater) => {
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? updater(j) : j)),
    }))
  },

  _advance: () => {
    const next = get().jobs.find((j) => j.status === 'pending')
    if (!next) return
    get()._updateJob(next.id, (j) => ({ ...j, status: 'running' as const, startedAt: Date.now() }))
    runAgent(next.def, next.prompt, (cb) => {
      switch (cb.type) {
        case 'message':
          get()._onMessage(next.id, cb.msg)
          if (cb.last) get()._onDone(next.id, 'done')
          break
        case 'error':
          if (!next.abort.signal.aborted) get()._onDone(next.id, 'error')
          break
      }
    })
      .then(() => get()._advance())
  },

  _onMessage: (id, msg) => {
    get()._updateJob(id, (j) => ({ ...j, messages: [...j.messages, { msg, ts: Date.now() }] }))
  },

  _onDone: (id, status) => {
    get()._updateJob(id, (j) => ({ ...j, status }))
    get()._advance()
  },
}))

export function messageLevel(msg: BaseMessage): 'INFO' | 'DEBUG' | null {
  if (AIMessage.isInstance(msg)) return 'INFO'
  if (ToolMessage.isInstance(msg)) return 'DEBUG'
  return null
}
