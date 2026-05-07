export type JobStatus = 'pending' | 'running' | 'complete' | 'failed' | 'aborted'

export type BaseJob = {
  id: string
  status: JobStatus
  abort: AbortController
  startedAt?: number
}

export type SerialQueueSlice<J extends BaseJob> = {
  jobs: J[]
  _nextId: () => string
  _updateJob: (id: string, fn: (j: J) => J) => void
  _advance: () => void
  _onDone: (id: string, status: 'complete' | 'failed' | 'aborted') => void
  cancel: (id: string) => void
}

export function createSerialQueue<J extends BaseJob>(
  set: (fn: (s: { jobs: J[] }) => { jobs: J[] }) => void,
  get: () => SerialQueueSlice<J>,
  runJob: (job: J) => Promise<void>,
): SerialQueueSlice<J> {
  return {
    jobs: [],
    _nextId: (() => {
      let n = 1
      return () => String(n++)
    })(),
    _updateJob: (id, fn) => set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? fn(j) : j)) })),
    _advance: () => {
      const next = get().jobs.find((j) => j.status === 'pending')
      if (!next) return
      get()._updateJob(next.id, (j) => ({ ...j, status: 'running', startedAt: Date.now() }))
      runJob(next)
        .then(() => get()._onDone(next.id, 'complete'))
        .catch((err) => {
          if (!next.abort.signal.aborted) {
            console.error('agent execution failed', err)
          }
          get()._onDone(next.id, next.abort.signal.aborted ? 'aborted' : 'failed')
        })
    },
    _onDone: (id, status) => {
      get()._updateJob(id, (j) => ({ ...j, status }))
      get()._advance()
    },
    cancel: (id) => {
      const job = get().jobs.find((j) => j.id === id)
      if (!job) return
      job.abort.abort()
      // optimistically update status, will be set again when catching abort error
      get()._updateJob(id, (j) => ({ ...j, status: 'aborted' }))
      get()._advance()
    },
  }
}
