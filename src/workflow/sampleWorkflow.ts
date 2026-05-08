import { Type } from 'typebox'
import { enqueueAsync } from '@store/executionQueue'
import { workflow } from './workflow'
import { agentStep, type AgentExecutor, type AgentMeta } from './agentstep'
import { outboxStep, OutboxOutputSchema } from './outboxStep'
import { deepseek, qwen } from './models'
import { wikipedia } from './tools'

const SummarySchema = Type.Object({
  topic: Type.String({ minLength: 10 }),
  summary: Type.String({ minLength: 50, maxLength: 5000 }),
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
      tools: [wikipedia],
      systemPrompt: 'Use Wikipedia to research the given topic, then write a 2-sentence factual summary grounded in the retrieved information.',
    },
    queueExecutor,
  ), { model: deepseek.label })
  .step('outbox', OutboxOutputSchema, outboxStep(
    {
      name: 'Outbox Writer',
      model: qwen,
      tools: [],
      systemPrompt: 'Given the input, produce a well-formatted markdown document with a descriptive title. The output must contain "title" (a short plain-text title for the document) and "markdown" (the full content as markdown, including the title as a level-1 heading).',
    },
    queueExecutor,
  ), { model: qwen.label })
  .create()
