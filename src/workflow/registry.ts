import { Type } from 'typebox'
import type { TSchema } from 'typebox'
import { tool } from '@langchain/core/tools'
import { enqueueAsync } from '@store/executionQueue'
import { workflow } from './workflow'
import type { Workflow } from './workflow'
import { agentStep, type AgentExecutor, type AgentMeta } from './agentstep'
import { outboxStep, OutboxOutputSchema } from './outboxStep'
import { deepseekPro, deepseekFlash, qwen } from './models'
import { wikipedia } from './tools'

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

const researcherWorkflow = workflow(Type.Void)
  .step(
    'ideate',
    Type.Object({ topic: Type.String() }),
    agentStep(
      {
        name: 'Ideation',
        model: deepseekFlash,
        tools: [randomCategory],
        systemPrompt:
          'Come up with a random but broad topic for research, based on a random category.',
      },
      queueExecutor,
    ),
    { model: deepseekFlash.label },
  )
  .step(
    'research',
    ResearchSchema,
    agentStep(
      {
        name: 'Researcher',
        model: deepseekPro,
        tools: [wikipedia],
        systemPrompt:
          'Use Wikipedia (at most five tool calls) to conduct brief research on the given topic, then write a report (500-1000 words) with an emphasis on surprising or unusual facts. Add citation anchors as <#> and include urls in the citation list.',
      },
      queueExecutor,
    ),
    { model: deepseekPro.label },
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

// ── Travel Itinerary ─────────────────────────────────────────────────────────

const ItineraryInputSchema = Type.Object({
  destination: Type.String({ minLength: 2, description: 'Country or region to visit' }),
  days: Type.Integer({ minimum: 1, maximum: 14, description: 'Number of days' }),
})

const ScoutOutputSchema = Type.Object({
  destination: Type.String(),
  days: Type.Integer(),
  cities: Type.Array(Type.String(), { minItems: 1 }),
})

const PlanOutputSchema = Type.Object({
  destination: Type.String(),
  plans: Type.Array(
    Type.Object({
      city: Type.String(),
      itinerary: Type.String({ minLength: 50 }),
    }),
    { minItems: 1 },
  ),
})

const itineraryWorkflow = workflow(ItineraryInputSchema)
  .step(
    'scout',
    ScoutOutputSchema,
    agentStep(
      {
        name: 'Scout',
        model: deepseekPro,
        tools: [wikipedia],
        systemPrompt:
          'You are a travel expert. Use Wikipedia to research the given destination (country or region). Then select exactly the number of cities or areas specified in `days` — one per day — that together make a well-paced trip (vary size, character, and geography). Output them as the `cities` array.',
      },
      queueExecutor,
    ),
    { model: deepseekPro.label },
  )
  .step(
    'plan',
    PlanOutputSchema,
    agentStep(
      {
        name: 'Planner',
        model: deepseekFlash,
        tools: [wikipedia],
        systemPrompt:
          'You are a travel planner. For each city in the `cities` array, call Wikipedia to research it (top attractions, food, local tips, logistics). Then write a one-day itinerary for that city covering morning, afternoon, and evening. Produce one `plans` entry per city with `city` and `itinerary` fields.',
      },
      queueExecutor,
    ),
    { model: deepseekFlash.label },
  )
  .step(
    'format',
    OutboxOutputSchema,
    outboxStep(
      {
        name: 'Formatter',
        model: qwen,
        tools: [],
        systemPrompt:
          'Format the travel plan as a polished markdown guide. The title should name the destination and number of days (e.g. "5 Days in Japan"). Write a short intro paragraph, then a section per day headed "Day N — City" with the itinerary as bullet points.',
      },
      queueExecutor,
    ),
    { model: qwen.label },
  )
  .create()

export type WorkflowEntry = {
  id: string
  label: string
  workflow: Workflow<TSchema, TSchema>
}

export const workflowRegistry: WorkflowEntry[] = [
  {
    id: 'researcher',
    label: 'Researcher',
    workflow: researcherWorkflow,
  },
  {
    id: 'itinerary',
    label: 'Travel Itinerary',
    workflow: itineraryWorkflow,
  },
]
