import { Type } from 'typebox'
import type { TSchema } from 'typebox'
import { enqueueAsync } from '@store/executionQueue'
import { workflow } from './workflow'
import type { Workflow } from './workflow'
import { agentStep, type AgentExecutor, type AgentMeta } from './agentstep'
import { outboxStep, OutboxOutputSchema } from './outboxStep'
import { deepseekPro, deepseekFlash, qwen, claudeHaiku, claudeSonnet, type Model } from './models'
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

const ResearcherInputSchema = Type.Object({
  category: Type.String({ minLength: 2, description: 'Topic category to research' }),
})

type ModelTier = { reasoning: Model; chat: Model }

function makeResearcherWorkflow({ reasoning, chat }: ModelTier) {
  return workflow(ResearcherInputSchema)
    .step(
      'ideate',
      Type.Object({ topic: Type.String() }),
      agentStep(
        {
          name: 'Ideation',
          model: chat,
          tools: [],
          systemPrompt:
            'Given the input category, come up with a specific topic within that category that would make for interesting research.',
        },
        queueExecutor,
      ),
      { model: chat.label },
    )
    .step(
      'research',
      ResearchSchema,
      agentStep(
        {
          name: 'Researcher',
          model: reasoning,
          tools: [wikipedia],
          systemPrompt:
            'Using Wikipedia, conduct a few surface-level inquiries into the given topic, then write a report (500-1000 words) with an emphasis on surprising or unusual facts. Add citation anchors as <#> and include urls in the citation list.',
        },
        queueExecutor,
      ),
      { model: reasoning.label },
    )
    .step(
      'outbox',
      OutboxOutputSchema,
      outboxStep(
        {
          name: 'Mailer',
          model: chat,
          tools: [],
          systemPrompt:
            'Given the input, produce a well-formatted markdown document with a descriptive title. The output must contain "title" (a short plain-text title for the document) and "markdown" (the full content as markdown, including the title as a level-1 heading).',
        },
        queueExecutor,
      ),
      { model: chat.label },
    )
    .create()
}

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
  citations: Type.Array(
    Type.Object({
      label: Type.String,
      url: Type.String,
    }),
  ),
})

function makeItineraryWorkflow({ reasoning, chat }: ModelTier) {
  return workflow(ItineraryInputSchema)
    .step(
      'scout',
      ScoutOutputSchema,
      agentStep(
        {
          name: 'Scout',
          model: reasoning,
          tools: [wikipedia],
          systemPrompt:
            'You are a travel expert. Use Wikipedia to research the given destination (country or region). Then select a number of cities or areas, spending 3-4 days per city. Output them as the `cities` array.',
        },
        queueExecutor,
      ),
      { model: reasoning.label },
    )
    .step(
      'plan',
      PlanOutputSchema,
      agentStep(
        {
          name: 'Planner',
          model: chat,
          tools: [wikipedia],
          systemPrompt:
            'You are a travel planner. For each city in the `cities` array, call Wikipedia to research it (top attractions, food, local tips, logistics). Then write a one-day itinerary for that city covering morning, afternoon, and evening. Produce one `plans` entry per city with `city` and `itinerary` fields. Ground your response in the articles returned by the Wikipedia tool, including them in citations.',
        },
        queueExecutor,
      ),
      { model: chat.label },
    )
    .step(
      'format',
      OutboxOutputSchema,
      outboxStep(
        {
          name: 'Formatter',
          model: chat,
          tools: [],
          systemPrompt:
            'Format the travel plan as a polished markdown guide. The title should name the destination and number of days (e.g. "5 Days in Japan"). Write a short intro paragraph, then a section per day headed "Day N — City" with the itinerary as bullet points.',
        },
        queueExecutor,
      ),
      { model: chat.label },
    )
    .create()
}

export type WorkflowEntry = {
  id: string
  label: string
  workflow: Workflow<TSchema, TSchema>
}

export const workflowRegistry: WorkflowEntry[] = [
  {
    id: 'researcher-deepseek',
    label: 'Researcher — DeepSeek',
    workflow: makeResearcherWorkflow({ reasoning: deepseekPro, chat: deepseekFlash }),
  },
  {
    id: 'researcher-qwen',
    label: 'Researcher — Qwen',
    workflow: makeResearcherWorkflow({ reasoning: qwen, chat: qwen }),
  },
  {
    id: 'itinerary-qwen',
    label: `Itinerary — Qwen`,
    workflow: makeItineraryWorkflow({ reasoning: qwen, chat: qwen }),
  },
  {
    id: 'itinerary-deepseek',
    label: `Itinerary — DeepSeek`,
    workflow: makeItineraryWorkflow({ reasoning: deepseekPro, chat: deepseekFlash }),
  },
  {
    id: 'itinerary-claude',
    label: `Itinerary — Claude`,
    workflow: makeItineraryWorkflow({ reasoning: claudeSonnet, chat: claudeHaiku }),
  },
]
