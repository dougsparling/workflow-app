import { tool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import * as z from 'zod'
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages'

import { polyfillWebCrypto } from 'expo-standard-web-crypto'

// type Workflow = {
//   steps: Step[]
// }

// type

// type Step<Inputs, Outputs>

// required for langchain UUID
polyfillWebCrypto()

type MessageThread = BaseMessage[]

const qwen = new ChatOpenAI({
  model: 'local-qwen-3.6',
  apiKey: 'nil',
  configuration: {
    baseURL: 'http://10.0.2.2:8080/v1',
  },
  modelKwargs: { enable_thinking: true },
})

const weatherDB: Record<string, string> = {
  tokyo: 'Cloudy, 18°C, 70% humidity',
  'san francisco': 'Foggy, 14°C, windy',
  montreal: 'Light snow, -10°C, 40km/h gusts',
}

const getWeather = tool(
  (input) => weatherDB[input.city.toLowerCase()] ?? `Unknown city: ${input.city}`,
  {
    name: 'get_weather',
    description: 'Get the current weather for a given city',
    schema: z.object({
      city: z.string().describe('The city to get the weather for'),
    }),
  },
)

const getExchangeRate = tool(
  (input) =>
    `1 ${input.from.toUpperCase()} = ${input.from.toUpperCase() === 'JPY' ? '0.0067' : input.from.toUpperCase() === 'CAD' ? '0.74' : '1.00'} USD`,
  {
    name: 'get_exchange_rate',
    description: 'Get the exchange rate from a currency to USD',
    schema: z.object({
      from: z.string().describe('The source currency code, e.g. JPY, CAD'),
    }),
  },
)

const tools = [getWeather, getExchangeRate]
const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
const modelWithTools = qwen.bindTools(tools)

const agenticLoop = async (initial: MessageThread) => {
  const messages = [...initial]
  while (true) {
    const response = await modelWithTools.invoke(messages)
    messages.push(response)
    if (AIMessage.isInstance(response) && response.tool_calls?.length) {
      //
      for (const call of response.tool_calls) {
        // @ts-expect-error union tool invoke signatures are incompatible — dispatched dynamically by name
        messages.push(await toolsByName[call.name].invoke(call))
      }
    } else {
      break
    }
  }

  return messages
}

export async function runAgent(prompt: string) {
  const resp = await agenticLoop([new HumanMessage('prompt')])
  const content = resp.map((m) => m.content).join('\n')
  console.log(content)
  return content
}
