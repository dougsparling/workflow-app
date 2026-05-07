/**
 * Verify that the @langchain/openai patches for reasoning_content are applied.
 *
 * DeepSeek thinking mode returns `reasoning_content` in API responses, which
 * must be passed back on subsequent turns. The patches add serialization of
 * `additional_kwargs.reasoning_content` → `completionParam.reasoning_content`
 * in `convertMessagesToCompletionsMessageParams`.
 *
 * This test imports the converter from both the root @langchain/openai and
 * the copy resolved from @langchain/deepseek's peer dependency, verifying
 * the fix is present in both.
 */
import { describe, it, expect } from "@jest/globals"
import { AIMessage } from "@langchain/core/messages"

// Root @langchain/openai (whatever version is installed)
import { convertMessagesToCompletionsMessageParams as convertRoot } from "@langchain/openai"

describe("reasoning_content patch", () => {
  const msg = new AIMessage({
    content: "Let me think...",
    additional_kwargs: {
      reasoning_content: "I need to consider the options carefully.",
    },
  })

  it("is applied in root @langchain/openai", () => {
    const params = convertRoot({ messages: [msg] }) as unknown as Record<string, unknown>[]
    expect(params).toHaveLength(1)
    expect(params[0]).toHaveProperty("reasoning_content")
    expect(params[0].reasoning_content).toBe(
      "I need to consider the options carefully.",
    )
  })

  it("is applied in @langchain/openai resolved from @langchain/deepseek", async () => {
    // Resolve the nested @langchain/openai from @langchain/deepseek's location
    // to verify the peer dependency copy is also patched
    const { createRequire } = await import("node:module")
    const deepseekPkgDir = new URL(
      "../node_modules/@langchain/deepseek",
      import.meta.url,
    ).pathname
    const deepseekRequire = createRequire(deepseekPkgDir)
    const deepseekOpenai = deepseekRequire("@langchain/openai") as {
      convertMessagesToCompletionsMessageParams: (args: {
        messages: unknown[]
      }) => Record<string, unknown>[]
    }
    const convert = deepseekOpenai.convertMessagesToCompletionsMessageParams
    expect(convert).toBeDefined()
    const params = convert({ messages: [msg] })
    expect(params).toHaveLength(1)
    expect(params[0]).toHaveProperty("reasoning_content")
    expect(params[0].reasoning_content).toBe(
      "I need to consider the options carefully.",
    )
  })

  it("does not add reasoning_content when absent from additional_kwargs", () => {
    const plain = new AIMessage({ content: "No reasoning here." })
    const params = convertRoot({ messages: [plain] }) as unknown as Record<string, unknown>[]
    expect(params).toHaveLength(1)
    expect(params[0]).not.toHaveProperty("reasoning_content")
  })
})
