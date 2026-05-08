import { WikipediaQueryRun } from '@langchain/community/tools/wikipedia_query_run'
import { type StructuredToolInterface } from '@langchain/core/tools'

export type Tool = StructuredToolInterface

export const wikipedia = new WikipediaQueryRun({
  topKResults: 3,
  maxDocContentLength: 10_000,
}) as Tool
