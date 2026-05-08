import { create } from 'zustand'

export type OutboxDocument = {
  id: string
  title: string
  content: string
  timestamp: number
}

type OutboxStore = {
  documents: OutboxDocument[]
  add: (title: string, content: string) => string
  remove: (id: string) => void
  clear: () => void
}

let _nextId = 1
function genId(): string {
  return `outbox_${Date.now()}_${_nextId++}`
}

export const useOutboxStore = create<OutboxStore>((set) => ({
  documents: [],
  add: (title: string, content: string) => {
    const id = genId()
    set((s) => ({
      documents: [...s.documents, { id, title, content, timestamp: Date.now() }],
    }))
    return id
  },
  remove: (id: string) => {
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }))
  },
  clear: () => {
    set({ documents: [] })
  },
}))
