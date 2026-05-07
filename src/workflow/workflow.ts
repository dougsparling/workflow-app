import { type TSchema, type Static } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

export type WorkflowEvent =
  | { type: 'step:start';    stepIndex: number; stepName: string }
  | { type: 'step:complete'; stepIndex: number; stepName: string }
  | { type: 'step:error';    stepIndex: number; stepName: string; error: Error }
  | { type: 'done' }
  | { type: 'error';         error: Error }

export type WorkflowCallback = (event: WorkflowEvent) => void

export type Step<In extends TSchema, Out extends TSchema> = {
  name: string
  input: In
  output: Out
  execute: (input: Static<In>, inputSchema: TSchema, outputSchema: TSchema) => Promise<Static<Out>>
}

export type Workflow<In extends TSchema, Out extends TSchema> = {
  steps: Step<TSchema, TSchema>[]
  run: (input: Static<In>, callback?: WorkflowCallback) => Promise<Static<Out>>
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

async function runSteps(steps: Step<TSchema, TSchema>[], input: unknown, callback: WorkflowCallback): Promise<unknown> {
  let result: unknown = input
  for (const [i, step] of steps.entries()) {
    callback({ type: 'step:start', stepIndex: i, stepName: step.name })
    validate(step.input, result, step.name, 'input')
    try {
      result = await step.execute(result as Static<TSchema>, step.input, step.output)
      validate(step.output, result, step.name, 'output')
      callback({ type: 'step:complete', stepIndex: i, stepName: step.name })
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      callback({ type: 'step:error', stepIndex: i, stepName: step.name, error })
      callback({ type: 'error', error })
      throw e
    }
  }
  callback({ type: 'done' })
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
        run: (input: Static<In>, callback: WorkflowCallback = () => {}) => runSteps(steps, input, callback) as Promise<Static<Out>>,
      }
    },
  }
}

export function workflow<In extends TSchema>(inputSchema: In): WorkflowBuilder<In, In> {
  return makeBuilder<In, In>(inputSchema, [])
}
