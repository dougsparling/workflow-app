import { useCallback, useState } from 'react'
import { Button, FlatList, Text, View } from 'react-native'
import { runAgent, AgentDef } from '@workflow/agent'
import { BaseMessage } from '@langchain/core/messages'
import PrimaryButton from '@design/PrimaryButton/PrimaryButton'
import { qwen } from '@workflow/models'
import { getWeather } from '@workflow/tools'

const weatherAgent: AgentDef = {
  systemPrompt: 'You are a helpful assistant that provides weather reports.',
  model: qwen,
  tools: [getWeather],
}



export default function Agent() {
  const [msgs, setMsgs] = useState([] as BaseMessage[])
  const [running, setRunning] = useState(false)

  const runner = useCallback(async () => {
    setRunning(true)
    runAgent(weatherAgent, "What is the weather in Tokyo?", ({ msg, last }) => {
      setMsgs(prev => [...prev, msg])
      if (last) {
        setRunning(false)
      }
    }).finally(() => setRunning(false))
  }, [])

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <FlatList data={msgs} renderItem={({ item }) => <Text>{item.content.toString()}</Text>} />

      <PrimaryButton label="Go" onPress={runner} disabled={running} />
    </View>
  )
}
