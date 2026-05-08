import { type BaseMessage } from '@langchain/core/messages'
import { tool } from '@langchain/core/tools'
import { type TSchema } from 'typebox'
import { Check, Errors } from 'typebox/value'
import z from 'zod'
import { type AgentDef, runAgent } from './agent'
import { type Tool } from './tools'

type AgentStepState = { ok: true; value: unknown } | { ok: false; error: Error }

export type AgentMeta = { _executionMeta: true; executionId: string }

/**
 * Pluggable execution context for the agent run during the step.
 * Executors may yield an AgentMeta value to report the executionId before messages.
 */
export type AgentExecutor = (
  def: AgentDef,
  prompt: string,
) => AsyncGenerator<BaseMessage | AgentMeta>

/**
 * Returns a step definition backed by an agent.
 *
 * @param agentDef The agent's definition.
 * @param executor Allows interception of agent runs. Can be used for agent observability + serialization, or if not set, just runs async immediately.
 * @param onExecutionCreated Called when the executor yields an AgentMeta with an executionId.
 * @returns Step definition with erased result type (validation done at runtime)
 */
export function agentStep<T = unknown>(
  agentDef: AgentDef,
  executor: AgentExecutor = runAgent,
) {
  const fn = async (input: unknown, inputSchema: TSchema, outputSchema: TSchema, onExecutionCreated?: (id: string) => void): Promise<T> => {
    const { tools, getAgentStepState } = makeStepTools(input, outputSchema)
    const systemPrompt = extendPromptForWorkflow(agentDef.systemPrompt, inputSchema, outputSchema)

    let agentError: Error | undefined
    try {
      for await (const item of executor(
        { ...agentDef, systemPrompt, tools: [...agentDef.tools, ...tools] },
        'Begin.',
      )) {
        if ('_executionMeta' in item) {
          onExecutionCreated?.(item.executionId)
          continue
        }
        // discard messages — agentStep only cares about step state via complete_step / fail_step
      }
    } catch (e) {
      agentError = e instanceof Error ? e : new Error(String(e))
    }

    const state = getAgentStepState()
    if (state?.ok) return state.value as T
    if (state && !state.ok) throw state.error
    throw agentError ?? new Error('Agent finished without calling complete_step or fail_step')
  }
  ;(fn as { _modelLabel?: string })._modelLabel = agentDef.model.label
  return fn
}

/**
 * Creates tools that allow the agent to manage the step's state.
 *
 * @param input Input to the step, which can optionally be read by the agent
 * @param outputSchema The expected output schema. Will be validated on step
 *                     completion to give agent a chance to course-correct
 * @returns A handle to the step state (modified here, exposed via closure)
 */
function makeStepTools(input: unknown, outputSchema: TSchema) {
  let state: AgentStepState | undefined

  const readInput = tool(
    ({ field }) => {
      if (input !== null && typeof input === 'object') {
        const record = input as Record<string, unknown>
        return field in record
          ? JSON.stringify(record[field])
          : `Unknown field "${field}". Available: ${Object.keys(record).join(', ')}`
      }
      return JSON.stringify(input)
    },
    {
      name: 'read_input',
      description: "Read a field from this step's input by name",
      schema: z.object({ field: z.string().describe('Field name to read') }),
    },
  )

  const completeStep = tool(
    ({ output }) => {
      if (!Check(outputSchema, output)) {
        const errors = [...Errors(outputSchema, output)]
        return `Output validation failed: ${errors.map((e) => `${e.instancePath || '(root)'}: ${e.message}`).join('; ')}`
      }
      state = { ok: true, value: output }
      return 'Step completed.'
    },
    {
      name: 'complete_step',
      description: 'Complete this step by submitting the output value',
      schema: z.object({ output: z.any().describe('Output value matching the output schema') }),
    },
  )

  const failStep = tool(
    ({ reason }) => {
      state = { ok: false, error: new Error(reason) }
      return 'Step failed.'
    },
    {
      name: 'fail_step',
      description: 'Abort this step and the workflow with a reason',
      schema: z.object({ reason: z.string().describe('Why the step cannot be completed') }),
    },
  )

  return { tools: [readInput, completeStep, failStep] as Tool[], getAgentStepState: () => state }
}

/**
 * Enhances the agent's system prompt to work without the constraints of a workflow.
 *
 * Note the input and output schema definitions embed validation information, not just shape.
 *
 * @param original The agent's base prompt.
 * @param inputSchema Schema of the step's input
 * @param outputSchema Schema of the step's output
 * @returns A single combined workflow + agent system prompt.
 */
function extendPromptForWorkflow(
  original: string,
  inputSchema: TSchema,
  outputSchema: TSchema,
): string {
  return `You are a step inside an automated workflow pipeline. There is no user to interact with.

## Your task
${original}

## Input schema
\`\`\`json
${JSON.stringify(inputSchema, null, 2)}
\`\`\`

## Output schema
\`\`\`json
${JSON.stringify(outputSchema, null, 2)}
\`\`\`

## Workflow control tools
- \`read_input\`: Read a named field from this step's input
- \`complete_step\`: Submit your output and complete this step — will fail if the output doesn't satisfy the output schema, so you may retry
- \`fail_step\`: Abort this step (and the workflow) with a reason — use only if the task cannot be completed

You MUST call either \`complete_step\` or \`fail_step\` before finishing. Do not produce a final text response without calling one of them.`
}
