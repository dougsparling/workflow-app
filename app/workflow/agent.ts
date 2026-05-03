import { ChatOpenAI } from '@langchain/openai'
import * as z from 'zod'
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages'

import { polyfillWebCrypto } from 'expo-standard-web-crypto'
import { Model } from './models'
import tools, { Tool } from './tools'

// required for langchain UUID
polyfillWebCrypto()

type MessageThread = BaseMessage[]

type OnNextCallback = {
  msg: BaseMessage
  last: boolean
}

type AgentDef = {
  model: Model
  tools: Tool[]
  prompt: string
}

export const runAgent = async (agent: AgentDef, callback: (_: OnNextCallback) => void) => {
  const messages: MessageThread = [new HumanMessage(agent.prompt)]
  messages.forEach((msg) => callback({ msg, last: false }))

  const model = await agent.model.factory()
  const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]))

  // TODO: cleanup
  const readyModel =
    agent.tools.length > 0
      ? (() => {
          if (!model.bindTools)
            throw new Error(
              `${agent.tools.length} tools given but not supported by ${agent.model.label}`,
            )
          return model.bindTools!!(tools)
        })()
      : model

  while (true) {
    const response = await readyModel.invoke(messages)
    messages.push(response)
    if (AIMessage.isInstance(response) && response.tool_calls?.length) {
      // only tool calls require harness intervention for now
      for (const call of response.tool_calls) {
        // @ts-expect-error specific tool types erased in toolsByName
        const toolMsg = (await toolsByName[call.name].invoke(call)) as ToolMessage
        callback({ msg: toolMsg, last: false })
        messages.push(toolMsg)
      }
    } else {
      callback({ msg: response, last: true })
      break
    }
  }

  return messages
}
