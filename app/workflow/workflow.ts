export type Step<In, Out> = {
  name: string
  execute: (input: In) => Promise<Out>
}

export type Workflow<In, Out> = {
  steps: Step<any, any>[]
  run: (input: In) => Promise<Out>
}

export type WorkflowBuilder<In, Out> = {
  step: <Next>(name: string, fn: (input: Out) => Next | Promise<Next>) => WorkflowBuilder<In, Next>
  create: () => Workflow<In, Out>
}

async function runSteps<In, Out>(steps: Step<any, any>[], input: In): Promise<Out> {
  let result: any = input
  for (const step of steps) {
    result = await step.execute(result)
  }
  return result as Out
}

function makeBuilder<In, Out>(steps: Step<any, any>[]): WorkflowBuilder<In, Out> {
  return {
    step<Next>(name: string, fn: (input: Out) => Next | Promise<Next>): WorkflowBuilder<In, Next> {
      const nextSteps = [...steps, { name, execute: fn as any }]
      return makeBuilder<In, Next>(nextSteps)
    },
    create(): Workflow<In, Out> {
      return {
        steps,
        run: (input: In) => runSteps<In, Out>(steps, input),
      }
    },
  }
}

export function workflow<In = void>(): WorkflowBuilder<In, In> {
  return makeBuilder<In, In>([])
}
