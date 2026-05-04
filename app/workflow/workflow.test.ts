import { describe, it, expect } from "@jest/globals"
import { workflow, type Workflow, type WorkflowBuilder } from "@workflow/workflow"

describe("workflow", () => {
  it("creates an identity workflow", async () => {
    const builder = workflow<string>()
    expect(await builder.create().run("value")).toBe("value")
  })

  it("creates a single-step synchronous workflow", async () => {
    const getLength = workflow<string>().step("get length", (str) => str.length).create()
    expect(await getLength.run("value")).toBe(5)
  })

  it("creates a single-step async workflow", async () => {
    const getLength = workflow<string>().step("get length", async (str) => {
      delay(20)
      return str.length
    }).create()
    expect(await getLength.run("value")).toBe(5)
  })
})

export const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
