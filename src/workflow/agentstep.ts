import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { tool } from '@langchain/core/tools'
import { type TSchema } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import z from 'zod'
import { type AgentDef, runAgent } from './agent'
import { type Tool } from './tools'

type AgentStepState = { ok: true; value: unknown } | { ok: false; error: Error }

export function agentStep(agentDef: AgentDef) {
  return async (input: unknown, inputSchema: TSchema, outputSchema: TSchema): Promise<unknown> => {

    const { tools, getAgentStepState } = makeStepTools(input, outputSchema)
    const systemPrompt = extendPromptForWorkflow(agentDef.systemPrompt, inputSchema, outputSchema)

    let agentError: Error | undefined
    await runAgent(
      { ...agentDef, systemPrompt, tools: [...agentDef.tools, ...tools] },
      'Begin.',
      (event) => { if (event.type === 'error') agentError = event.error },
    )

    const state = getAgentStepState()
    if (state?.ok) return state.value
    if (state && !state.ok) throw state.error
    throw agentError ?? new Error('Agent finished without calling complete_step or fail_step')
  }
}

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
      if (!Value.Check(outputSchema, output)) {
        const errors = [...Value.Errors(outputSchema, output)]
        return `Output validation failed: ${errors.map((e) => `${e.path || '(root)'}: ${e.message}`).join('; ')}`
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
