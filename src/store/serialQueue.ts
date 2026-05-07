export type JobStatus = 'pending' | 'running' | 'complete' | 'failed' | 'aborted'

export type BaseJob = {
  id: string
  status: JobStatus
  abort: AbortController
  startedAt?: number
}

export type SerialQueueSlice<SomeJob extends BaseJob> = {
  jobs: SomeJob[]
  _nextId: () => string
  _updateJob: (id: string, fn: (j: SomeJob) => SomeJob) => void
  _advance: () => void
  _onDone: (id: string, status: 'complete' | 'failed' | 'aborted') => void
  cancel: (id: string) => void
  enqueue: (extra: Omit<SomeJob, 'id' | 'status' | 'abort' | 'startedAt'>) => string
}

export function createSerialQueue<J extends BaseJob>(
  runJob: (job: J) => Promise<void>,
) {
  return (
    set: (fn: (s: { jobs: J[] }) => { jobs: J[] }) => void,
    get: () => SerialQueueSlice<J>,
  ): SerialQueueSlice<J> => {
    let n = 1
    return {
      jobs: [],
      _nextId: () => String(n++),
      _updateJob: (id, fn) => set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? fn(j) : j)) })),
      _advance: () => {
        const next = get().jobs.find((j) => j.status === 'pending')
        if (!next) return
        get()._updateJob(next.id, (j) => ({ ...j, status: 'running', startedAt: Date.now() }))
        runJob(next)
          .then(() => get()._onDone(next.id, 'complete'))
          .catch((err) => {
            const aborted = next.abort.signal.aborted
            if (!aborted) {
              console.error('agent execution failed', err)
            }
            get()._onDone(next.id, aborted ? 'aborted' : 'failed')
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
        get()._updateJob(id, (j) => ({ ...j, status: 'aborted' }))
        get()._advance()
      },
      enqueue: (extra) => {
        const id = get()._nextId()
        const job = {
          id,
          status: 'pending' as JobStatus,
          abort: new AbortController(),
          ...extra,
        } as J
        set((s) => ({ jobs: [...s.jobs, job] }))
        get()._advance()
        return id
      },
    }
  }
}
