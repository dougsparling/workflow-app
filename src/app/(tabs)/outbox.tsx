import { FlatList, View, Text } from 'react-native'
import { router } from 'expo-router'
import Background from '@design/Background/Background'
import EmptyState from '@design/EmptyState/EmptyState'
import ActionRow from '@design/ActionRow/ActionRow'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import { useOutboxStore, type OutboxDocument } from '@store/outboxStore'

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function DocCard({ doc, onPress }: { doc: OutboxDocument; onPress: () => void }) {
  return (
    <ActionRow
      title={doc.title}
      time={formatTime(doc.timestamp)}
      onPress={onPress}
    />
  )
}

export default function Outbox() {
  const documents = useOutboxStore((s) => s.documents)
  const styles = useThemedStyles(themedStyles)

  const sorted = [...documents].sort((a, b) => b.timestamp - a.timestamp)

  if (sorted.length === 0) {
    return (
      <Background>
        <EmptyState message="Outbox is empty." />
      </Background>
    )
  }

  return (
    <Background>
      <FlatList
        data={sorted}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <DocCard doc={item} onPress={() => router.push(`/outbox/${item.id}`)} />
        )}
        contentContainerStyle={styles.list}
      />
    </Background>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  list: {
    gap: tokens.space2,
    paddingBottom: tokens.space4,
  },
}))
