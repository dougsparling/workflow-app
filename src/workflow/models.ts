import { Platform } from 'react-native'
import { BaseChatModel } from "@langchain/core/language_models/chat_models"
import { ChatAnthropic } from "@langchain/anthropic"
import { ChatDeepSeek } from "@langchain/deepseek"
import { ChatOpenAI } from "@langchain/openai"
import AsyncStorage from "@react-native-async-storage/async-storage"

const DEEPSEEK_KEY_STORAGE = 'deepseek_api_key'
const ANTHROPIC_KEY_STORAGE = 'anthropic_api_key'

const localBaseUrl = Platform.select({
  android: 'http://10.0.2.2:8080/v1',
  ios: 'http://localhost:8080/v1',
  default: 'http://localhost:8080/v1',
})

export type Model = {
  label: string,
  factory: () => Promise<BaseChatModel>
}

const makeQwen = async () => new ChatOpenAI({
  model: 'local-qwen-3.6',
  apiKey: 'nil',
  configuration: {
    baseURL: localBaseUrl,
  },
  timeout: 30000,
  modelKwargs: { enable_thinking: true },
})

export const deepseekApiKey = {
  set: async (key: string) => AsyncStorage.setItem(DEEPSEEK_KEY_STORAGE, key),
  get: async () => await AsyncStorage.getItem(DEEPSEEK_KEY_STORAGE)
}

export const anthropicApiKey = {
  set: async (key: string) => AsyncStorage.setItem(ANTHROPIC_KEY_STORAGE, key),
  get: async () => await AsyncStorage.getItem(ANTHROPIC_KEY_STORAGE)
}

const makeClaudeHaiku = async () => {
  const apiKey = await anthropicApiKey.get() ?? undefined
  return new ChatAnthropic({
    model: 'claude-haiku-4-5-20251001',
    apiKey,
    clientOptions: { timeout: 30000 },
  })
}

const makeClaudeSonnet = async () => {
  const apiKey = await anthropicApiKey.get() ?? undefined
  return new ChatAnthropic({
    model: 'claude-sonnet-4-6',
    apiKey,
    clientOptions: { timeout: 60000 },
  })
}

const makeDeepSeekFlash = async () => {
  const apiKey = await deepseekApiKey.get() ?? undefined
  return new ChatDeepSeek({
    model: 'deepseek-v4-flash',
    apiKey,
    timeout: 30000,
  })
}

const makeDeepSeekPro = async () => {
  const apiKey = await deepseekApiKey.get() ?? undefined
  return new ChatDeepSeek({
    model: 'deepseek-v4-pro',
    apiKey,
    timeout: 30000,
  })
}

const qwen = { label: "Qwen (Local)", factory: makeQwen }
const deepseekFlash = { label: "DeepSeek (Flash)", factory: makeDeepSeekFlash }
const deepseekPro = { label: "DeepSeek (Pro)", factory: makeDeepSeekPro }
const claudeHaiku = { label: "Claude Haiku", factory: makeClaudeHaiku }
const claudeSonnet = { label: "Claude Sonnet", factory: makeClaudeSonnet }
const models: Model[] = [qwen, deepseekFlash, deepseekPro, claudeHaiku, claudeSonnet]

export { models as default, qwen, deepseekFlash, deepseekPro, claudeHaiku, claudeSonnet }
