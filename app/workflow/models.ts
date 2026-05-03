import { BaseChatModel } from "@langchain/core/language_models/chat_models"
import { ChatDeepSeek } from "@langchain/deepseek"
import { ChatOpenAI } from "@langchain/openai"
import AsyncStorage from "@react-native-async-storage/async-storage"

const DEEPSEEK_KEY_STORAGE = 'deepseek_api_key'

export type Model = {
  label: string,
  factory: () => Promise<BaseChatModel>
}

const makeQwen = async () => new ChatOpenAI({
  model: 'local-qwen-3.6',
  apiKey: 'nil',
  configuration: {
    baseURL: 'http://10.0.2.2:8080/v1',
  },
  modelKwargs: { enable_thinking: true },
})

export const deepseekApiKey = {
  set: async (key: string): Promise<void>,
  get: async () => await AsyncStorage.getItem(DEEPSEEK_KEY_STORAGE)
}

const makeDeepSeek = async () => {
  let apiKey = await deepseekApiKey.get() ?? undefined
  return new ChatDeepSeek({
    model: 'deepseek-v4-flash',
    apiKey,
  })
}

const models: Model[] = [
  { label: "Qwen (Local)", factory: makeQwen },
  { label: "DeepSeek (Flash)", factory: makeDeepSeek }
]

export { models as default }
