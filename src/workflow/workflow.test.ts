import { describe, it, expect } from "@jest/globals"
import { Type } from "typebox"
import { workflow, type Workflow, type WorkflowBuilder } from "@workflow/workflow"

describe("workflow", () => {
  it("creates an identity workflow", async () => {
    const builder = workflow(Type.String())
    expect(await builder.create().run("value")).toBe("value")
  })

  it("creates a single-step synchronous workflow", async () => {
    const getLength = workflow(Type.String())
      .step("get length", Type.Number(), (str) => str.length)
      .create()
    expect(await getLength.run("value")).toBe(5)
  })

  it("creates a single-step async workflow", async () => {
    const getLength = workflow(Type.String())
      .step("get length", Type.Number(), async (str) => {
        await delay(20)
        return str.length
      })
      .create()
    expect(await getLength.run("value")).toBe(5)
  })

  describe("validation", () => {
    it("throws on invalid input", async () => {
      const w = workflow(Type.String())
        .step("get length", Type.Number(), (str) => str.length)
        .create()
      await expect(w.run(42 as unknown as string)).rejects.toThrow(
        'Step "get length" input validation failed'
      )
    })

    it("throws on invalid output", async () => {
      const w = workflow(Type.String())
        .step("shout", Type.String(), (_str) => 42 as unknown as string)
        .create()
      await expect(w.run("hello")).rejects.toThrow(
        'Step "shout" output validation failed'
      )
    })

    it("throws on invalid intermediate", async () => {
      const w = workflow(Type.String())
        .step("copy", Type.String(), (str) => str + str)
        .step("uppercase", Type.String({pattern: "^[A-Z]+$"}), (str) => str.toUpperCase())
        .create()
      await expect(w.run("hello123")).rejects.toThrow(
        'Step "uppercase" output validation failed'
      )
    })

    it("accepts complex types", async () => {
      const PersonSchema = Type.Object({
        name: Type.String(),
        age: Type.Number(),
      })
      const w = workflow(PersonSchema)
        .step("greet", Type.String(), (person) => `Hello, ${person.name}`)
        .create()
      expect(await w.run({ name: "Alice", age: 30 })).toBe("Hello, Alice")
    })
  })
})

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
