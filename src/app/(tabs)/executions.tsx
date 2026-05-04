import { FlatList, Text, View } from 'react-native'
import { ToolMessage } from '@langchain/core/messages'
import Background from '@design/Background/Background'
import PrimaryButton from '@design/PrimaryButton/PrimaryButton'
import StepRow from '@design/StepRow/StepRow'
import type { ExecutionStatus } from '@design/StatusBadge/StatusBadge'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import { type Job, useExecutionStore } from '@store/executionQueue'

function jobBadgeStatus(status: Job['status']): ExecutionStatus {
  if (status === 'done') return 'complete'
  if (status === 'error') return 'failed'
  return status
}

function JobCard({ job, index, onCancel }: { job: Job; index: number; onCancel: () => void }) {
  const styles = useThemedStyles(themedStyles)
  const toolCalls = job.messages.filter((e) => ToolMessage.isInstance(e.msg)).length
  const duration = `${toolCalls} call${toolCalls !== 1 ? 's' : ''}`

  return (
    <View style={styles.card}>
      <StepRow
        index={index + 1}
        name={job.agentName}
        status={jobBadgeStatus(job.status)}
        duration={duration}
      />
      {job.status === 'running' && (
        <View style={styles.cancelRow}>
          <PrimaryButton label="Cancel" variant="ghost" onPress={onCancel} />
        </View>
      )}
    </View>
  )
}

export default function Executions() {
  const jobs = useExecutionStore((s) => s.jobs)
  const cancel = useExecutionStore((s) => s.cancel)
  const styles = useThemedStyles(themedStyles)

  if (jobs.length === 0) {
    return (
      <Background>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No executions yet.</Text>
        </View>
      </Background>
    )
  }

  return (
    <Background>
      <FlatList
        data={[...jobs].reverse()}
        keyExtractor={(job) => job.id}
        renderItem={({ item, index }) => (
          <JobCard job={item} index={index} onCancel={() => cancel(item.id)} />
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
  card: {
    backgroundColor: tokens.bgSurface,
    paddingVertical: tokens.space3,
  },
  cancelRow: {
    paddingHorizontal: tokens.space4,
    paddingTop: tokens.space1,
    alignItems: 'flex-end' as const,
  },
  empty: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyText: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.textDisabled,
  },
}))
