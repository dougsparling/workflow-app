import { useCallback, useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import Background from '@design/Background/Background'
import PrimaryButton from '@design/PrimaryButton/PrimaryButton'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import { AgentDef, runAgent } from '@workflow/agent'
import { qwen, deepseek } from '@workflow/models'
import { getWeather, getExchangeRate } from '@workflow/tools'

const weatherAgent: AgentDef = {
  systemPrompt: 'You are a helpful assistant that provides weather reports, along with a cute interpretation.',
  model: qwen,
  tools: [getWeather],
}

const financeAgent: AgentDef = {
  systemPrompt: 'You are a helpful assistant that provides exchange rate data with concise analysis.',
  model: qwen,
  tools: [getExchangeRate],
}

const researchAgent: AgentDef = {
  systemPrompt: 'You are a helpful research assistant. Use all available tools to answer questions thoroughly.',
  model: deepseek,
  tools: [getWeather, getExchangeRate],
}

const assistantAgent: AgentDef = {
  systemPrompt: 'You are a helpful general-purpose assistant. Answer questions directly and concisely.',
  model: qwen,
  tools: [],
}

type AgentItem = { name: string; desc: string; def: AgentDef; defaultPrompt: string }

const agents: AgentItem[] = [
  { name: 'Weather', desc: 'Describes the current weather', def: weatherAgent, defaultPrompt: 'What is the weather in Tokyo?' },
  { name: 'Finance', desc: 'Gets exchange rates and currency data', def: financeAgent, defaultPrompt: 'What is the USD exchange rate for JPY?' },
  { name: 'Research', desc: 'Weather and finance tools combined', def: researchAgent, defaultPrompt: 'Is it a good time to visit Tokyo given the weather and exchange rate?' },
  { name: 'Assistant', desc: 'General chat with no tools', def: assistantAgent, defaultPrompt: 'Tell me a fun fact about Japan.' },
]

function AgentRow({ item }: { item: AgentItem }) {
  const [running, setRunning] = useState(false)
  const styles = useThemedStyles(themedStyles)

  const handleExecute = useCallback(() => {
    if (running) return
    setRunning(true)
    runAgent(item.def, item.defaultPrompt, ({ msg, last }) => {
      if (last) setRunning(false)
    }).catch(() => setRunning(false))
  }, [item, running])

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={1}>{item.desc}</Text>
      </View>
      <PrimaryButton
        label={running ? 'Running' : 'Run'}
        icon={running ? 'loader' : 'play'}
        onPress={handleExecute}
        disabled={running}
      />
    </View>
  )
}

export default function Agents() {
  const styles = useThemedStyles(themedStyles)

  return (
    <Background>
      <FlatList
        data={agents}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => <AgentRow item={item} />}
        contentContainerStyle={styles.list}
      />
    </Background>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  list: {
    gap: tokens.space2,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: tokens.space3,
    paddingHorizontal: tokens.space4,
    paddingVertical: tokens.space3,
    minHeight: tokens.touchTargetSm,
    backgroundColor: tokens.bgSurface,
  },
  info: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textBase,
    fontWeight: tokens.weightMedium,
    color: tokens.textPrimary,
  },
  desc: {
    fontFamily: tokens.fontSans,
    fontSize: tokens.textSm,
    color: tokens.textMuted,
  },
}))
