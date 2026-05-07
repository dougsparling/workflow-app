export type JobStatus = 'pending' | 'running' | 'complete' | 'failed'

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
  _onDone: (id: string, status: 'complete' | 'failed') => void
  cancel: (id: string) => void
}

export function createSerialQueue<J extends BaseJob>(
  set: (fn: (s: { jobs: J[] }) => { jobs: J[] }) => void,
  get: () => SerialQueueSlice<J>,
  runJob: (job: J) => Promise<'complete' | 'failed'>,
): SerialQueueSlice<J> {
  return {
    jobs: [],
    _nextId: (() => {
      let n = 1
      return () => String(n++)
    })(),
    _updateJob: (id, fn) =>
      set(s => ({ jobs: s.jobs.map(j => (j.id === id ? fn(j) : j)) })),
    _advance: () => {
      const next = get().jobs.find(j => j.status === 'pending')
      if (!next) return
      get()._updateJob(next.id, j => ({ ...j, status: 'running' as const, startedAt: Date.now() }))
      runJob(next)
        .then(status => get()._onDone(next.id, status))
        .catch(() => get()._onDone(next.id, 'failed'))
    },
    _onDone: (id, status) => {
      get()._updateJob(id, j => ({ ...j, status }))
      get()._advance()
    },
    cancel: (id) => {
      const job = get().jobs.find(j => j.id === id)
      if (!job) return
      job.abort.abort()
      get()._updateJob(id, j => ({ ...j, status: 'failed' as const }))
      get()._advance()
    },
  }
}
