import { Type } from 'typebox'
import { enqueueAsync } from '@store/executionQueue'
import { workflow } from './workflow'
import { agentStep, type AgentExecutor, type AgentMeta } from './agentstep'
import { outboxStep, OutboxOutputSchema } from './outboxStep'
import { deepseek, qwen } from './models'
import { wikipedia } from './tools'
import { tool } from '@langchain/core/tools'

const ResearchSchema = Type.Object({
  topic: Type.String({ minLength: 10 }),
  report: Type.String({ minLength: 50, maxLength: 25000 }),
  citations: Type.Array(Type.Tuple([Type.Number, Type.String])),
})

const queueExecutor: AgentExecutor = async function* (def, prompt): AsyncGenerator<AgentMeta> {
  const { jobId, promise } = enqueueAsync(def, prompt)
  yield { _executionMeta: true, executionId: jobId }
  await promise
}

const randomCategory = tool(
  () => {
    const categories = [
      'Artificial Intelligence',
      'Space Exploration',
      'Ancient Civilizations',
      'Climate Science',
      'Neuroscience',
      'Quantum Computing',
      'Marine Biology',
      'Renewable Energy',
      'Philosophy of Mind',
      'Genetic Engineering',
      'Cybersecurity',
      'Cultural Anthropology',
      'Economic Theory',
      'Particle Physics',
      'Evolutionary Biology',
    ]
    return categories[Math.floor(Math.random() * categories.length)]
  },
  {
    name: 'get_category',
    description: 'Returns a random category',
  },
)

export const sampleWorkflow = workflow(Type.Object({ topic: Type.String() }))
  .step(
    'ideate',
    Type.Void,
    agentStep(
      {
        name: 'Ideation',
        model: deepseek,
        tools: [randomCategory],
        systemPrompt:
          'Come up with a random and specific topic for research, based on a random category.',
      },
      queueExecutor,
    ),
    { model: deepseek.label },
  )
  .step(
    'research',
    ResearchSchema,
    agentStep(
      {
        name: 'Researcher',
        model: deepseek,
        tools: [wikipedia],
        systemPrompt:
          'Use Wikipedia (at most five tool calls) to conduct brief research the given topic, then write a report (500-1000 words) with an emphasis on surprising or uncommon discoveries. Add citation anchors as <#> and include urls in the citation list.',
      },
      queueExecutor,
    ),
    { model: deepseek.label },
  )
  .step(
    'outbox',
    OutboxOutputSchema,
    outboxStep(
      {
        name: 'Mailer',
        model: qwen,
        tools: [],
        systemPrompt:
          'Given the input, produce a well-formatted markdown document with a descriptive title. The output must contain "title" (a short plain-text title for the document) and "markdown" (the full content as markdown, including the title as a level-1 heading).',
      },
      queueExecutor,
    ),
    { model: qwen.label },
  )
  .create()


