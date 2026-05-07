import { describe, it, expect, jest } from "@jest/globals"
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages"
import { runAgent, type AgentDef } from "./agent"
import type { Tool } from "./tools"

describe("runAgent", () => {
  describe("basic execution", () => {
    it("yields system message then human message", async () => {
      const { agent } = createMockAgent()
      const gen = runAgent(agent, "Hello!")

      const first = await gen.next()
      expect(first.done).toBe(false)
      const firstMsg = first.value as BaseMessage
      expect(firstMsg).toBeInstanceOf(SystemMessage)
      expect(firstMsg.content).toBe("You are a test agent.")

      const second = await gen.next()
      expect(second.done).toBe(false)
      const secondMsg = second.value as BaseMessage
      expect(secondMsg).toBeInstanceOf(HumanMessage)
      expect(secondMsg.content).toBe("Hello!")

      gen.return?.([])
    })

    it("yields final answer and completes when model returns without tool_calls", async () => {
      const { agent, modelInvoke } = createMockAgent()
      modelInvoke.mockResolvedValue(new AIMessage({ content: "Hello, world!" }))

      const yielded = await exhaust(agent, "Hi")

      expect(yielded).toHaveLength(3)
      expect(yielded[0]).toBeInstanceOf(SystemMessage)
      expect(yielded[1]).toBeInstanceOf(HumanMessage)
      expect(yielded[2]).toBeInstanceOf(AIMessage)
      expect(yielded[2].content).toBe("Hello, world!")
    })


  })

  describe("tool calling", () => {
    it("dispatches tool_calls to named tools and yields results", async () => {
      const toolAInvoke = jest.fn<(...args: any[]) => Promise<any>>()
      const toolBInvoke = jest.fn<(...args: any[]) => Promise<any>>()
      const tools = [mockTool("tool_a", toolAInvoke), mockTool("tool_b", toolBInvoke)]
      const { agent, modelInvoke } = createMockAgent({ tools })

      modelInvoke
        .mockResolvedValueOnce(
          new AIMessage({
            content: "",
            tool_calls: [
              { name: "tool_a", args: { x: 1 }, id: "call_a" },
              { name: "tool_b", args: { y: 2 }, id: "call_b" },
            ],
          }),
        )
        .mockResolvedValue(new AIMessage({ content: "Done" }))
      toolAInvoke.mockResolvedValue(new ToolMessage({ content: "Result A", tool_call_id: "call_a" }))
      toolBInvoke.mockResolvedValue(new ToolMessage({ content: "Result B", tool_call_id: "call_b" }))

      const yielded = await exhaust(agent, "Go")

      expect(yielded).toHaveLength(5)
      expect(yielded[2]).toBeInstanceOf(ToolMessage)
      expect(yielded[2].content).toBe("Result A")
      expect(yielded[3]).toBeInstanceOf(ToolMessage)
      expect(yielded[3].content).toBe("Result B")
      expect(toolAInvoke).toHaveBeenCalledTimes(1)
      expect(toolBInvoke).toHaveBeenCalledTimes(1)
    })

    it("yields unknown-tool warning when no handler matches", async () => {
      const { agent, modelInvoke } = createMockAgent()

      modelInvoke
        .mockResolvedValueOnce(
          new AIMessage({
            content: "",
            tool_calls: [{ name: "nonexistent", args: {}, id: "call_1" }],
          }),
        )
        .mockResolvedValue(new AIMessage({ content: "Done" }))

      const yielded = await exhaust(agent, "Go")

      expect(yielded).toHaveLength(4)
      expect(yielded[2]).toBeInstanceOf(ToolMessage)
      expect(yielded[2].content).toMatch(/Unknown tool/)
    })

    it("supports multiple rounds: tools then final answer", async () => {
      const { agent, modelInvoke, toolInvoke } = createMockAgent()

      modelInvoke
        .mockResolvedValueOnce(
          new AIMessage({
            content: "",
            tool_calls: [{ name: "test_tool", args: { x: 1 }, id: "c1" }],
          }),
        )
        .mockResolvedValueOnce(new AIMessage({ content: "Done" }))
      toolInvoke.mockResolvedValue(new ToolMessage({ content: "Weather", tool_call_id: "c1" }))

      const yielded = await exhaust(agent, "Go")

      expect(yielded).toHaveLength(4)
      expect(yielded[2]).toBeInstanceOf(ToolMessage)
      expect(yielded[3]).toBeInstanceOf(AIMessage)
      expect(yielded[3].content).toBe("Done")
      expect(modelInvoke).toHaveBeenCalledTimes(2)
    })
  })

  describe("error handling", () => {
    it("throws on model invoke error", async () => {
      const { agent, modelInvoke } = createMockAgent()
      modelInvoke.mockRejectedValue(new Error("LLM down"))

      await expect(exhaust(agent, "Hi")).rejects.toThrow("LLM down")
    })

    it("throws on tool invoke error", async () => {
      const toolFailing = mockTool("failing")
      toolFailing.invoke = jest.fn<(...args: any[]) => Promise<any>>().mockRejectedValue(new Error("Tool exploded"))
      const { agent, modelInvoke } = createMockAgent({ tools: [toolFailing] })

      modelInvoke
        .mockResolvedValueOnce(
          new AIMessage({
            content: "",
            tool_calls: [{ name: "failing", args: {}, id: "c1" }],
          }),
        )
        .mockResolvedValue(new AIMessage({ content: "never" }))

      await expect(exhaust(agent, "Hi")).rejects.toThrow("Tool exploded")
    })

    it("throws when tools provided but model lacks bindTools", async () => {
      const toolInvoke = jest.fn<(...args: any[]) => Promise<any>>()
      const tools = [mockTool("t", toolInvoke)]
      const modelInvoke = jest.fn<(...args: any[]) => Promise<any>>()

      const agent: AgentDef = {
        name: "fail-agent",
        model: {
          label: "model-without-tool-use",
          factory: () => Promise.resolve({ invoke: modelInvoke } as never),
        },
        tools,
        systemPrompt: "You are a simple model.",
      }

      await expect(exhaust(agent, "Hi")).rejects.toThrow(
        "1 tools given but not supported by model-without-tool-use",
      )
      expect(modelInvoke).not.toHaveBeenCalled()
    })

    it("works when no tools and model lacks bindTools", async () => {
      const modelInvoke = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(new AIMessage({ content: "Yes" }))

      const agent: AgentDef = {
        name: "no-tools",
        model: {
          label: "model-without-tool-use",
          factory: () => Promise.resolve({ invoke: modelInvoke } as never),
        },
        tools: [],
        systemPrompt: "Answer.",
      }

      const yielded = await exhaust(agent, "Hi?")
      expect(yielded).toHaveLength(3)
      expect(yielded[2].content).toBe("Yes")
      expect(modelInvoke).toHaveBeenCalledTimes(1)
    })
  })

  describe("cancellation via AbortSignal", () => {
    it("throws and skips invoke when signal is already aborted", async () => {
      const { agent, modelInvoke } = createMockAgent()
      const ac = new AbortController()
      ac.abort()

      await expect(exhaust(agent, "Hi", ac.signal)).rejects.toThrow()
      expect(modelInvoke).not.toHaveBeenCalled()
    })

    it("passes signal to model.invoke options", async () => {
      const { agent, modelInvoke } = createMockAgent()
      modelInvoke.mockResolvedValue(new AIMessage({ content: "OK" }))
      const ac = new AbortController()

      await exhaust(agent, "Hi", ac.signal)

      expect(modelInvoke).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ signal: ac.signal }),
      )
    })

    it("aborts at loop boundary preventing a second invoke", async () => {
      const { agent, modelInvoke, toolInvoke } = createMockAgent()
      const ac = new AbortController()

      modelInvoke
        .mockResolvedValueOnce(
          new AIMessage({
            content: "",
            tool_calls: [{ name: "test_tool", args: {}, id: "c1" }],
          }),
        )
        .mockResolvedValue(new AIMessage({ content: "won't happen" }))
      toolInvoke.mockResolvedValue(new ToolMessage({ content: "R", tool_call_id: "c1" }))

      const gen = runAgent(agent, "Hi", ac.signal)
      await gen.next() // system
      await gen.next() // human
      await gen.next() // invoke → AIMessage(tool_calls) → yield ToolMessage

      // Generator is paused between iterations (after the for loop, before while top)
      // Abort the same signal the generator is holding by reference
      ac.abort()

      // Signal check at top of while(true) should fire before second invoke
      await expect(gen.next()).rejects.toThrow()
      expect(modelInvoke).toHaveBeenCalledTimes(1)
    })
  })
})

// ---- Helpers ----

type AsyncMock = jest.Mock<(...args: any[]) => Promise<any>>

function mockTool(name = "test_tool", invoke?: AsyncMock) {
  return {
    name,
    description: `Mock ${name}`,
    schema: {} as Record<string, unknown>,
    invoke: invoke ?? jest.fn<(...args: any[]) => Promise<any>>(),
  } as unknown as Tool
}

interface MockAgent {
  agent: AgentDef
  modelInvoke: AsyncMock
  toolInvoke: AsyncMock
  bindTools: jest.Mock<(...args: any[]) => any>
}

function createMockAgent(overrides?: {
  tools?: Tool[]
  modelInvoke?: AsyncMock
}): MockAgent {
  const toolInvoke = jest.fn<(...args: any[]) => Promise<any>>()
  const tools = overrides?.tools ?? [mockTool("test_tool", toolInvoke)]
  const modelInvoke = overrides?.modelInvoke ?? jest.fn<(...args: any[]) => Promise<any>>()
  const bindTools = jest.fn<(...args: any[]) => any>().mockReturnValue({ invoke: modelInvoke })

  const agent: AgentDef = {
    name: "test-agent",
    model: {
      label: "test",
      factory: () => Promise.resolve({ invoke: modelInvoke, bindTools } as never),
    },
    tools,
    systemPrompt: "You are a test agent.",
  }

  return { agent, modelInvoke, toolInvoke, bindTools }
}

/** Consume an agent generator via for-await-of, collecting yielded messages. */
async function exhaust(
  agent: AgentDef,
  prompt: string,
  signal?: AbortSignal,
): Promise<BaseMessage[]> {
  const yielded: BaseMessage[] = []
  for await (const msg of runAgent(agent, prompt, signal)) {
    yielded.push(msg)
  }
  return yielded
}