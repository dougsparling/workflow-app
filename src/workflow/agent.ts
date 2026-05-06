import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages'

import { polyfillWebCrypto } from 'expo-standard-web-crypto'
import { Model } from './models'
import tools, { Tool } from './tools'

// required for langchain UUID
polyfillWebCrypto()

type MessageThread = BaseMessage[]

type OnNextCallback =
  | { readonly type: 'message'; msg: BaseMessage; last: boolean }
  | { readonly type: 'error'; error: Error }

export type AgentDef = {
  name: string
  model: Model
  tools: Tool[]
  systemPrompt: string
}

export const runAgent = async (
  agent: AgentDef,
  prompt: string,
  callback: (_: OnNextCallback) => void,
) => {
  const messages: MessageThread = [new SystemMessage(agent.systemPrompt), new HumanMessage(prompt)]
  messages.forEach((msg) => callback({ type: 'message', msg, last: false }))

  const model = await agent.model.factory()
  const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]))

  if (!model.bindTools && agent.tools.length > 0) {
    throw new Error(`${agent.tools.length} tools given but not supported by ${agent.model.label}`)
  }

  const readyModel = model.bindTools?.(tools) ?? model

  try {
    while (true) {
      const response = await readyModel.invoke(messages)
      messages.push(response)
      if (AIMessage.isInstance(response) && response.tool_calls?.length) {
        // only tool calls require harness intervention for now
        for (const call of response.tool_calls) {
          const toolMsg = (await toolsByName[call.name].invoke(call)) as ToolMessage
          callback({ type: 'message', msg: toolMsg, last: false })
          messages.push(toolMsg)
        }
      } else {
        callback({ type: 'message', msg: response, last: true })
        break
      }
    }
  } catch (e) {
    callback({ type: 'error', error: e instanceof Error ? e : new Error(String(e)) })
  }

  return messages
}
