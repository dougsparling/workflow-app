import { Type, type TSchema } from 'typebox'
import { type AgentDef } from './agent'
import { agentStep, type AgentExecutor } from './agentstep'
import { type StepEvent } from './workflow'
import { useOutboxStore } from '@store/outboxStore'

export const OutboxOutputSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 20 }),
  markdown: Type.String({ minLength: 1, maxLength: 5000 }),
})

export type OutboxOutput = { title: string; markdown: string }

export function outboxStep(
  agentDef: AgentDef,
  executor?: AgentExecutor,
) {
  const stepExecutor = agentStep<OutboxOutput>(agentDef, executor)
  return async (input: unknown, inputSchema: TSchema, outputSchema: TSchema, emit: (e: StepEvent) => void): Promise<OutboxOutput> => {
    const result = await stepExecutor(input, inputSchema, outputSchema, emit)
    useOutboxStore.getState().add(result.title, result.markdown)
    return result
  }
}
