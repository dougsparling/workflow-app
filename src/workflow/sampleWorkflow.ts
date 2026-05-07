import { Type } from '@sinclair/typebox'
import { useExecutionStore } from '@store/executionQueue'
import { workflow } from './workflow'
import { agentStep, type AgentExecutor } from './agentstep'
import { deepseek } from './models'

const SummarySchema = Type.Object({
  topic: Type.String(),
  summary: Type.String(),
})

const BulletsSchema = Type.Object({
  bullets: Type.Array(Type.String()),
})

const queueExecutor: AgentExecutor = (def, prompt, cb) =>
  useExecutionStore.getState().enqueueAsync(def, prompt, cb)

// agentStep returns Promise<unknown> which the builder accepts via 'as never' cast
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const step = agentStep as (...args: any[]) => any

export const sampleWorkflow = workflow(Type.Object({ topic: Type.String() }))
  .step('summarize', SummarySchema, step(
    {
      name: 'Summarizer',
      model: deepseek,
      tools: [],
      systemPrompt: 'Write a 2-sentence factual summary of the given topic.',
    },
    queueExecutor,
  ))
  .step('bullet-points', BulletsSchema, step(
    {
      name: 'Bullet Formatter',
      model: deepseek,
      tools: [],
      systemPrompt: 'Convert the provided summary into exactly 3 concise bullet points.',
    },
    queueExecutor,
  ))
  .create()
