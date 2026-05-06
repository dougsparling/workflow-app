import { useState } from 'react'
import { FlatList, Pressable, View } from 'react-native'
import { ToolMessage } from '@langchain/core/messages'
import Background from '@design/Background/Background'
import BottomSheet from '@design/BottomSheet/BottomSheet'
import Button from '@design/Button/Button'
import EmptyState from '@design/EmptyState/EmptyState'
import ActionRow from '@design/ActionRow/ActionRow'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import ExecutionDetail from '@components/ExecutionDetail/ExecutionDetail'
import { type Job, useExecutionStore } from '@store/executionQueue'

function JobCard({ job, index, onCancel }: { job: Job; index: number; onCancel: () => void }) {
  const styles = useThemedStyles(themedStyles)
  const toolCalls = job.messages.filter((e) => ToolMessage.isInstance(e.msg)).length
  const duration = `${toolCalls} call${toolCalls !== 1 ? 's' : ''}`

  return (
    <View style={styles.card}>
      <ActionRow
        title={job.agentName}
        status={job.status}
        time={duration}
      />
      {job.status === 'running' && (
        <View style={styles.cancelRow}>
          <Button label="Cancel" variant="ghost" onPress={onCancel} />
        </View>
      )}
    </View>
  )
}

export default function Executions() {
  const jobs = useExecutionStore((s) => s.jobs)
  const cancel = useExecutionStore((s) => s.cancel)
  const styles = useThemedStyles(themedStyles)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (jobs.length === 0) {
    return (
      <Background>
        <EmptyState message="No executions yet." />
      </Background>
    )
  }

  return (
    <Background>
      <FlatList
        data={[...jobs].reverse()}
        keyExtractor={(job) => job.id}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => setSelectedId(item.id)}>
            <JobCard job={item} index={index} onCancel={() => cancel(item.id)} />
          </Pressable>
        )}
        contentContainerStyle={styles.list}
      />
      <BottomSheet visible={selectedId !== null} onDismiss={() => setSelectedId(null)}>
        {selectedId && <ExecutionDetail executionId={selectedId} />}
      </BottomSheet>
    </Background>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  list: {
    gap: tokens.space2,
    paddingBottom: tokens.space4,
  },
  card: {
    backgroundColor: tokens.bgSurface,
    paddingVertical: tokens.space3,
  },
  cancelRow: {
    paddingHorizontal: tokens.space4,
    paddingTop: tokens.space1,
    alignItems: 'flex-end' as const,
  },
}))
