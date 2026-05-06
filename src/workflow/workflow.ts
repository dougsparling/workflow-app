import { type TSchema, type Static } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

export type Step<In extends TSchema, Out extends TSchema> = {
  name: string
  input: In
  output: Out
  execute: (input: Static<In>, inputSchema: TSchema, outputSchema: TSchema) => Promise<Static<Out>>
}

export type Workflow<In extends TSchema, Out extends TSchema> = {
  steps: Step<TSchema, TSchema>[]
  run: (input: Static<In>) => Promise<Static<Out>>
}

export type WorkflowBuilder<In extends TSchema, Out extends TSchema> = {
  step: <Next extends TSchema>(
    name: string,
    schema: Next,
    fn: (input: Static<Out>, inputSchema: TSchema, outputSchema: TSchema) => Static<Next> | Promise<Static<Next>>
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
    result = await step.execute(result as Static<TSchema>, step.input, step.output)
    validate(step.output, result, step.name, 'output')
  }
  return result
}

function makeBuilder<In extends TSchema, Out extends TSchema>(
  initialSchema: In,
  steps: Step<TSchema, TSchema>[]
): WorkflowBuilder<In, Out> {
  return {
    step<Next extends TSchema>(
      name: string,
      schema: Next,
      fn: (input: Static<Out>, inputSchema: TSchema, outputSchema: TSchema) => Static<Next> | Promise<Static<Next>>
    ): WorkflowBuilder<In, Next> {
      const inputSchema = steps.length > 0 ? steps[steps.length - 1].output : initialSchema
      return makeBuilder<In, Next>(initialSchema, [...steps, {
        name,
        input: inputSchema,
        output: schema,
        execute: (input, inputSchema, outputSchema) => Promise.resolve(fn(input as Static<Out>, inputSchema, outputSchema)),
      }])
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
