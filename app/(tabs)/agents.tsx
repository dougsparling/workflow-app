import { useCallback, useEffect, useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import Background from '@design/Background/Background'
import BottomSheet from '@design/BottomSheet/BottomSheet'
import PrimaryButton from '@design/PrimaryButton/PrimaryButton'
import { TextInput } from '@design/TextInput/TextInput'
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

type AgentItem = { name: string; desc: string; def: AgentDef; examplePrompt: string }

const agents: AgentItem[] = [
  { name: 'Weather', desc: 'Describes the current weather', def: weatherAgent, examplePrompt: 'What is the weather in Tokyo?' },
  { name: 'Finance', desc: 'Gets exchange rates and currency data', def: financeAgent, examplePrompt: 'What is the USD exchange rate for JPY?' },
  { name: 'Research', desc: 'Weather and finance tools combined', def: researchAgent, examplePrompt: 'Is it a good time to visit Tokyo given the weather and exchange rate?' },
  { name: 'Assistant', desc: 'General chat with no tools', def: assistantAgent, examplePrompt: 'Tell me a fun fact about Japan.' },
]

function AgentRow({ item, onSelect }: { item: AgentItem; onSelect: (item: AgentItem) => void }) {
  const styles = useThemedStyles(themedStyles)

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={1}>{item.desc}</Text>
      </View>
      <PrimaryButton
        label="Run"
        icon="play"
        onPress={() => onSelect(item)}
      />
    </View>
  )
}

type RunPromptModalProps = {
  item: AgentItem
  visible: boolean
  onRun: (prompt: string) => void
  onCancel: () => void
}

function RunPromptModal({
  item,
  visible,
  onRun,
  onCancel,
}: RunPromptModalProps) {
  const [prompt, setPrompt] = useState('')
  const styles = useThemedStyles(themedStyles)

  useEffect(() => setPrompt(''), [visible])

  return (
    <BottomSheet visible={visible} onDismiss={onCancel}>
      <View style={styles.modalContent}>
        {item ? (
          <>
            <Text style={styles.modalTitle}>{item.name}</Text>
            <Text style={styles.modalDesc}>{item.desc}</Text>
          </>
        ) : null}
        <TextInput
          label="Prompt"
          value={prompt}
          onChangeText={setPrompt}
          placeholder={item?.examplePrompt}
          multiline
          numberOfLines={4}
        />
        <View style={styles.modalButtons}>
          <PrimaryButton label="Cancel" variant="ghost" onPress={onCancel} />
          <PrimaryButton
            label="Run"
            icon="play"
            onPress={() => onRun(prompt)}
            disabled={!prompt.trim()}
          />
        </View>
      </View>
    </BottomSheet>
  )
}

export default function Agents() {
  const [selected, setSelected] = useState(null as AgentItem | null)
  const [running, setRunning] = useState(false)
  const styles = useThemedStyles(themedStyles)

  const handleRun = useCallback((prompt: string) => {
    if (!selected || running) return
    setRunning(true)
    runAgent(selected.def, prompt, ({ msg, last }) => {
      if (last) {
        setRunning(false)
        setSelected(null)
      }
    }).catch(() => {
      setRunning(false)
      setSelected(null)
    })
  }, [selected, running])

  return (
    <Background>
      <FlatList
        data={agents}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <AgentRow item={item} onSelect={setSelected} />
        )}
        contentContainerStyle={styles.list}
      />
      <RunPromptModal
        item={selected}
        visible={selected !== null}
        onRun={handleRun}
        onCancel={() => setSelected(null)}
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
  modalContent: {
    gap: tokens.space4,
  },
  modalTitle: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textLg,
    fontWeight: tokens.weightSemibold,
    color: tokens.textPrimary,
  },
  modalDesc: {
    fontFamily: tokens.fontSans,
    fontSize: tokens.textBase,
    color: tokens.textSecondary,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    gap: tokens.space3,
    justifyContent: 'flex-end' as const,
  },
}))
