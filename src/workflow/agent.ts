import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages'

import { Model } from './models'
import { Tool } from './tools'

// Hermes (React Native) doesn't have AbortSignal.prototype.throwIfAborted,
// but LangChain's ChatOpenAI._generate relies on it. Polyfill once at module init.
if (typeof AbortSignal !== 'undefined' && !('throwIfAborted' in AbortSignal.prototype)) {
  ;(AbortSignal.prototype as unknown as { throwIfAborted: () => void }).throwIfAborted =
    function throwIfAborted(this: AbortSignal) {
      if (this.aborted) throw this.reason instanceof Error ? this.reason : new Error('Cancelled')
    }
}

export type AgentDef = {
  name: string
  model: Model
  tools: Tool[]
  systemPrompt: string
}

export async function* runAgent(
  agent: AgentDef,
  prompt: string,
  signal?: AbortSignal,
): AsyncGenerator<BaseMessage> {
  const messages: BaseMessage[] = [
    new SystemMessage(agent.systemPrompt),
    new HumanMessage(prompt),
  ]
  yield messages[0]
  yield messages[1]

  const model = await agent.model.factory()
  const toolsByName = Object.fromEntries(agent.tools.map((t) => [t.name, t]))

  if (!model.bindTools && agent.tools.length > 0) {
    throw new Error(
      `${agent.tools.length} tools given but not supported by ${agent.model.label}`,
    )
  }

  const readyModel = model.bindTools?.(agent.tools) ?? model

  while (true) {
    if (signal?.aborted) throw new Error('Cancelled')

    const response = await readyModel.invoke(messages, { signal })

    // DeepSeek thinking mode returns reasoning_content which must be passed back
    // to the API on subsequent calls. We preserve it in additional_kwargs so the
    // LangChain OpenAI completions converter can include it when serializing
    // messages back to the API (see the @langchain/openai patch).
    messages.push(response)

    if (AIMessage.isInstance(response) && response.tool_calls?.length) {
      for (const call of response.tool_calls) {
        const handler = toolsByName[call.name]
        const toolMsg = handler
          ? ((await handler.invoke(call)) as ToolMessage)
          : new ToolMessage({
              content: `Unknown tool: ${call.name}`,
              tool_call_id: call.id ?? '',
            })
        messages.push(toolMsg)
        yield toolMsg
      }
    } else {
      yield response
      return
    }
  }
}
