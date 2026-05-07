import { Type } from 'typebox'
import { enqueueAsync } from '@store/executionQueue'
import { workflow } from './workflow'
import { agentStep, type AgentExecutor } from './agentstep'
import { deepseek, qwen } from './models'

const SummarySchema = Type.Object({
  topic: Type.String({ minLength: 10 }),
  summary: Type.String({ minLength: 50, maxLength: 5000 }),
})

const BulletsSchema = Type.Object({
  bullets: Type.Array(Type.String({ minLength: 10, maxLength: 200 }), { minItems: 3, maxItems: 3 }),
})

const queueExecutor: AgentExecutor = async function* (def, prompt) {
  await enqueueAsync(def, prompt)
}

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
      model: qwen,
      tools: [],
      systemPrompt: 'Convert the provided summary into exactly 3 concise bullet points.',
    },
    queueExecutor,
  ))
  .create()
