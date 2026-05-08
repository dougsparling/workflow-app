import { ToolMessage } from '@langchain/core/messages'
import type { Tool } from './tools'

export class ToolRegistry {
  private toolsByName: Record<string, Tool>

  constructor(tools: Tool[]) {
    this.toolsByName = Object.fromEntries(tools.map((t) => [t.name, t]))
  }

  async call(name: string, id: string, args: Record<string, unknown>): Promise<ToolMessage> {
    const base = { tool_call_id: id, name, additional_kwargs: { args } }
    const handler = this.toolsByName[name]
    if (!handler) {
      return new ToolMessage({ ...base, content: `Unknown tool: ${name}` })
    }

    try {
      const result = await handler.invoke({ ...args })
      return new ToolMessage({
        ...base,
        content: typeof result === 'string' ? result : JSON.stringify(result),
      })
    } catch (err) {
      return new ToolMessage({
        ...base,
        content: `Error invoking tool ${name}: ${err instanceof Error ? err.message : String(err)}`,
      })
    }
  }
}
