import { WikipediaQueryRun } from '@langchain/community/tools/wikipedia_query_run'
import { tool, type StructuredToolInterface } from '@langchain/core/tools'
import z from 'zod'

const weatherDB: Record<string, string> = {
  tokyo: 'Cloudy, 18°C, 70% humidity',
  'san francisco': 'Foggy, 14°C, windy',
  montreal: 'Light snow, -10°C, 40km/h gusts',
}

export type Tool = StructuredToolInterface

export const getWeather = tool(
  (input) => weatherDB[input.city.toLowerCase()] ?? `Unknown city: ${input.city}`,
  {
    name: 'get_weather',
    description: 'Get the current weather for a given city',
    schema: z.object({
      city: z.string().describe('The city to get the weather for'),
    }),
  },
) as Tool

export const getExchangeRate = tool(
  (input) =>
    `1 ${input.from.toUpperCase()} = ${input.from.toUpperCase() === 'JPY' ? '0.0067' : input.from.toUpperCase() === 'CAD' ? '0.74' : '1.00'} USD`,
  {
    name: 'get_exchange_rate',
    description: 'Get the exchange rate from a currency to USD',
    schema: z.object({
      from: z.string().describe('The source currency code, e.g. JPY, CAD'),
    }),
  },
) as Tool

export const wikipedia = new WikipediaQueryRun({
  topKResults: 3,
  maxDocContentLength: 4000,
}) as Tool

const tools: Tool[] = [getWeather, getExchangeRate, wikipedia]

export default tools
