import { type TSchema, type Static } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

export type Step<In extends TSchema, Out extends TSchema> = {
  name: string
  input: In
  output: Out
  execute: (input: Static<In>) => Promise<Static<Out>>
}

export type Workflow<In extends TSchema, Out extends TSchema> = {
  steps: Step<TSchema, TSchema>[]
  run: (input: Static<In>) => Promise<Static<Out>>
}

export type WorkflowBuilder<In extends TSchema, Out extends TSchema> = {
  step: <Next extends TSchema>(
    name: string,
    schema: Next,
    fn: (input: Static<Out>) => Static<Next> | Promise<Static<Next>>
  ) => WorkflowBuilder<In, Next>
  create: () => Workflow<In, Out>
}

function validate(schema: TSchema, value: unknown, stepName: string, direction: 'input' | 'output'): void {
  if (!Value.Check(schema, value)) {
    const errors = [...Value.Errors(schema, value)]
    const message = errors.map(e => `${e.path || '(root)'}: ${e.message}`).join('; ')
    throw new Error(`Step "${stepName}" ${direction} validation failed: ${message}`)
  }
}

async function runSteps(steps: Step<TSchema, TSchema>[], input: unknown): Promise<unknown> {
  let result: unknown = input
  for (const step of steps) {
    validate(step.input, result, step.name, 'input')
    result = await step.execute(result as Static<TSchema>)
    validate(step.output, result, step.name, 'output')
  }
  return result
}

function makeBuilder<In extends TSchema, Out extends TSchema>(
  inputSchema: In,
  steps: Step<TSchema, TSchema>[]
): WorkflowBuilder<In, Out> {
  return {
    step<Next extends TSchema>(
      name: string,
      schema: Next,
      fn: (input: Static<Out>) => Static<Next> | Promise<Static<Next>>
    ): WorkflowBuilder<In, Next> {
      const currentInputSchema = steps.length > 0 ? steps[steps.length - 1].output : inputSchema
      const newStep: Step<TSchema, TSchema> = {
        name,
        input: currentInputSchema,
        output: schema,
        execute: fn as (input: Static<TSchema>) => Promise<Static<TSchema>>,
      }
      return makeBuilder<In, Next>(inputSchema, [...steps, newStep])
    },
    create(): Workflow<In, Out> {
      return {
        steps,
        run: (input: Static<In>) => runSteps(steps, input) as Promise<Static<Out>>,
      }
    },
  }
}

export function workflow<In extends TSchema>(inputSchema: In): WorkflowBuilder<In, In> {
  return makeBuilder<In, In>(inputSchema, [])
}
