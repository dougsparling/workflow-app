import { ActivityIndicator, FlatList, Text, View } from 'react-native'
import StatusBadge, { type ExecutionStatus } from '@design/StatusBadge/StatusBadge'
import ActionRow, { type FeatherIconName } from '@design/ActionRow/ActionRow'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import { useWorkflowStore } from '@store/workflowQueue'

interface Props {
  workflowId: string
}

function stepIcon(status: ExecutionStatus): FeatherIconName {
  switch (status) {
    case 'complete': return 'check-square'
    case 'running':  return 'zap'
    case 'failed':   return 'alert-triangle'
    default:         return 'circle'
  }
}

export default function WorkflowDetail({ workflowId }: Props) {
  const job = useWorkflowStore(s => s.jobs.find(j => j.id === workflowId))
  const styles = useThemedStyles(themedStyles)

  if (!job) return null

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{job.name}</Text>
        <StatusBadge status={job.status} />
      </View>
      <FlatList
        data={job.steps}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <ActionRow
            title={item.name}
            status={item.status}
            icon={stepIcon(item.status)}
            subtitles={item.error ? [item.error] : undefined}
          />
        )}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          job.status === 'running' ? (
            <View style={styles.progressRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.runningLabel}>Running...</Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: tokens.space4,
    paddingBottom: tokens.space3,
    borderBottomWidth: 1,
    borderBottomColor: tokens.borderSubtle,
  },
  name: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textLg,
    fontWeight: tokens.weightSemibold,
    color: tokens.textPrimary,
    flex: 1,
  },
  list: {
    paddingBottom: tokens.space4,
  },
  progressRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: tokens.space2,
    paddingHorizontal: tokens.space4,
    paddingVertical: tokens.space2,
  },
  runningLabel: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.statusRunning,
  },
}))
