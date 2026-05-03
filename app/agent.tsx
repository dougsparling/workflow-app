import { useCallback, useState } from 'react'
import { Button, Text, View } from 'react-native'
import { runAgent } from './workflow/agent'

export default function Agent() {
  let [text, setText] = useState('nil')

  let runner = useCallback(async () => {
    let resp = await runAgent('What is the weather in Tokyo?')
    setText(resp)
  }, [])

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>Response: {text}</Text>
      <Button title="Go!" onPress={runner} />
    </View>
  )
}
