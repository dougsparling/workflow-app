import { FlatList, Text, View } from 'react-native'
import Background from '@design/Background/Background'
import LogLine from '@design/LogLine/LogLine'
import PrimaryButton from '@design/PrimaryButton/PrimaryButton'
import StatusBadge from '@design/StatusBadge/StatusBadge'
import type { ExecutionStatus } from '@design/StatusBadge/StatusBadge'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import { type Job, messageLevel, useExecutionStore } from '@store/executionQueue'

function jobBadgeStatus(status: Job['status']): ExecutionStatus {
  if (status === 'done') return 'complete'
  if (status === 'error') return 'failed'
  return status
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function JobCard({ job, onCancel }: { job: Job; onCancel: () => void }) {
  const styles = useThemedStyles(themedStyles)
  const visibleMessages = job.messages.filter((e) => messageLevel(e.msg) !== null)

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardMeta}>
          <Text style={styles.agentName}>{job.agentName}</Text>
          <StatusBadge status={jobBadgeStatus(job.status)} />
        </View>
        {job.status === 'running' && (
          <PrimaryButton label="Cancel" variant="ghost" onPress={onCancel} />
        )}
      </View>
      <Text style={styles.prompt} numberOfLines={2}>{job.prompt}</Text>
      {visibleMessages.length > 0 && (
        <View style={styles.messages}>
          {visibleMessages.map((entry, i) => {
            const level = messageLevel(entry.msg)!
            const content = typeof entry.msg.content === 'string'
              ? entry.msg.content
              : JSON.stringify(entry.msg.content)
            return (
              <LogLine
                key={i}
                time={formatTime(entry.ts)}
                level={level}
                message={content}
              />
            )
          })}
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
        renderItem={({ item }) => (
          <JobCard job={item} onCancel={() => cancel(item.id)} />
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
    gap: tokens.space2,
    paddingVertical: tokens.space3,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: tokens.space4,
  },
  cardMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: tokens.space2,
  },
  agentName: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textBase,
    fontWeight: tokens.weightMedium,
    color: tokens.textPrimary,
  },
  prompt: {
    fontFamily: tokens.fontSans,
    fontSize: tokens.textSm,
    color: tokens.textMuted,
    paddingHorizontal: tokens.space4,
  },
  messages: {
    marginTop: tokens.space1,
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
