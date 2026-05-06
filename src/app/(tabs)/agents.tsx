import { useCallback, useEffect, useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import Background from '@design/Background/Background'
import BottomSheet from '@design/BottomSheet/BottomSheet'
import Button from '@design/Button/Button'
import ActionRow from '@design/ActionRow/ActionRow'
import { TextInput } from '@design/TextInput/TextInput'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import type { AgentDef } from '@workflow/agent'
import { qwen, deepseek } from '@workflow/models'
import { getWeather, getExchangeRate } from '@workflow/tools'
import { useExecutionStore } from '@store/executionQueue'

const weatherAgent: AgentDef = {
  name: 'Weather',
  systemPrompt:
    'You are a helpful assistant that provides weather reports, along with a cute interpretation.',
  model: qwen,
  tools: [getWeather],
}

const financeAgent: AgentDef = {
  name: 'Finance',
  systemPrompt:
    'You are a helpful assistant that provides exchange rate data with concise analysis.',
  model: qwen,
  tools: [getExchangeRate],
}

const researchAgent: AgentDef = {
  name: 'Research',
  systemPrompt:
    'You are a helpful research assistant. Use all available tools to answer questions thoroughly.',
  model: deepseek,
  tools: [getWeather, getExchangeRate],
}

const assistantAgent: AgentDef = {
  name: 'Assistant',
  systemPrompt:
    'You are a helpful general-purpose assistant. Answer questions directly and concisely.',
  model: qwen,
  tools: [],
}

type AgentItem = { desc: string; def: AgentDef; examplePrompt: string }

const agents: AgentItem[] = [
  {
    desc: 'Describes the current weather',
    def: weatherAgent,
    examplePrompt: 'What is the weather in Tokyo?',
  },
  {
    desc: 'Gets exchange rates and currency data',
    def: financeAgent,
    examplePrompt: 'What is the USD exchange rate for JPY?',
  },
  {
    desc: 'Weather and finance tools combined',
    def: researchAgent,
    examplePrompt: 'Is it a good time to visit Tokyo given the weather and exchange rate?',
  },
  {
    desc: 'General chat with no tools',
    def: assistantAgent,
    examplePrompt: 'Tell me a fun fact about Japan.',
  },
]

type RunPromptModalProps = {
  item: AgentItem | null
  visible: boolean
  onRun: (prompt: string) => void
  onCancel: () => void
}

function RunPromptModal({ item, visible, onRun, onCancel }: RunPromptModalProps) {
  const [prompt, setPrompt] = useState('')
  const styles = useThemedStyles(themedStyles)

  useEffect(() => setPrompt(''), [visible])

  return (
    <BottomSheet visible={visible} onDismiss={onCancel}>
      <View style={styles.modalContent}>
        {item ? (
          <>
            <Text style={styles.modalTitle}>{item.def.name}</Text>
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
          <Button label="Cancel" variant="ghost" onPress={onCancel} />
          <Button
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
  const styles = useThemedStyles(themedStyles)
  const enqueue = useExecutionStore((s) => s.enqueue)

  const handleRun = useCallback(
    (prompt: string) => {
      if (!selected) return
      enqueue(selected.def, prompt)
      setSelected(null)
    },
    [selected, enqueue],
  )

  return (
    <Background>
      <FlatList
        data={agents}
        keyExtractor={(item) => item.def.name}
        renderItem={({ item }) => (
          <ActionRow
            title={item.def.name}
            subtitles={[item.desc, `${item.def.model.label} — ${item.def.tools.length} tool(s)`]}
            trailing={<Button label="Run" icon="play" onPress={() => setSelected(item)} />}
          />
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
