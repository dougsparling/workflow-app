import { Type } from 'typebox'
import { enqueueAsync } from '@store/executionQueue'
import { workflow } from './workflow'
import { agentStep, type AgentExecutor, type AgentMeta } from './agentstep'
import { deepseek, qwen } from './models'

const SummarySchema = Type.Object({
  topic: Type.String({ minLength: 10 }),
  summary: Type.String({ minLength: 50, maxLength: 5000 }),
})

const BulletsSchema = Type.Object({
  bullets: Type.Array(Type.String({ minLength: 10, maxLength: 200 }), { minItems: 3, maxItems: 3 }),
})

const queueExecutor: AgentExecutor = async function* (def, prompt): AsyncGenerator<AgentMeta> {
  const { jobId, promise } = enqueueAsync(def, prompt)
  yield { _executionMeta: true, executionId: jobId }
  await promise
}

export const sampleWorkflow = workflow(Type.Object({ topic: Type.String() }))
  .step('summarize', SummarySchema, agentStep(
    {
      name: 'Summarizer',
      model: deepseek,
      tools: [],
      systemPrompt: 'Write a 2-sentence factual summary of the given topic.',
    },
    queueExecutor,
  ), { model: deepseek.label })
  .step('bullet-points', BulletsSchema, agentStep(
    {
      name: 'Bullet Formatter',
      model: qwen,
      tools: [],
      systemPrompt: 'Convert the provided summary into exactly 3 concise bullet points.',
    },
    queueExecutor,
  ), { model: qwen.label })
  .create()
