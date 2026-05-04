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
  _nextId: number
  enqueue: (agentName: string, prompt: string, def: AgentDef) => void
  cancel: (id: string) => void
  _advance: () => void
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
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, status: 'error' as const } : j)),
    }))
    get()._advance()
  },

  _advance: () => {
    const next = get().jobs.find((j) => j.status === 'pending')
    if (!next) return
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === next.id ? { ...j, status: 'running' as const, startedAt: Date.now() } : j
      ),
    }))
    runAgent(next.def, next.prompt, ({ msg }) => {
      get()._onMessage(next.id, msg)
    })
      .then(() => get()._onDone(next.id, 'done'))
      .catch(() => {
        if (!next.abort.signal.aborted) get()._onDone(next.id, 'error')
      })
  },

  _onMessage: (id, msg) => {
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === id ? { ...j, messages: [...j.messages, { msg, ts: Date.now() }] } : j
      ),
    }))
  },

  _onDone: (id, status) => {
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, status } : j)),
    }))
    get()._advance()
  },
}))

export function messageLevel(msg: BaseMessage): 'INFO' | 'DEBUG' | null {
  if (AIMessage.isInstance(msg)) return 'INFO'
  if (ToolMessage.isInstance(msg)) return 'DEBUG'
  return null
}
