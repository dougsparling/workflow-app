import { useRef, useEffect } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import StatusBadge from '@design/StatusBadge/StatusBadge'
import StepRow from '@design/StepRow/StepRow'
import type { FeatherIconName } from '@design/StepRow/StepRow'
import type { ExecutionStatus } from '@design/StatusBadge/StatusBadge'
import { createThemedStyles, useThemedStyles, useTheme } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import { useExecutionStore } from '@store/executionQueue'

interface Props {
  executionId: string
}

function messageIcon(msg: HumanMessage | AIMessage | ToolMessage): FeatherIconName {
  if (HumanMessage.isInstance(msg)) return 'user'
  if (AIMessage.isInstance(msg)) {
    if (msg.tool_calls?.length) return 'zap'
    return 'message-circle'
  }
  if (ToolMessage.isInstance(msg)) return 'check-square'
  return 'circle'
}

function messageIconColor(msg: HumanMessage | AIMessage | ToolMessage, tokens: ThemeTokens): string {
  if (HumanMessage.isInstance(msg)) return tokens.accentBase
  if (AIMessage.isInstance(msg)) {
    if (msg.tool_calls?.length) return tokens.amberBase
    return tokens.accentBase
  }
  if (ToolMessage.isInstance(msg)) return tokens.statusComplete
  return tokens.textMuted
}

function messageLabel(msg: HumanMessage | AIMessage | ToolMessage): string {
  if (HumanMessage.isInstance(msg)) return 'Prompt'
  if (AIMessage.isInstance(msg)) {
    if (msg.tool_calls?.length) {
      return msg.tool_calls.map((tc) => tc.name).join(', ')
    }
    return 'Response'
  }
  if (ToolMessage.isInstance(msg)) return msg.name ?? 'Tool'
  return 'Step'
}

function jobToStatus(status: string): ExecutionStatus {
  if (status === 'done') return 'complete'
  if (status === 'error') return 'failed'
  return status as ExecutionStatus
}

export default function ExecutionDetail({ executionId }: Props) {
  const job = useExecutionStore((s) => s.jobs.find((j) => j.id === executionId))
  const { tokens } = useTheme()
  const styles = useThemedStyles(themedStyles)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    if (job?.messages.length) {
      listRef.current?.scrollToEnd({ animated: true })
    }
  }, [job?.messages.length])

  if (!job) return null

  const filtered = job.messages.filter(
    (e): e is { msg: HumanMessage | AIMessage | ToolMessage; ts: number } =>
      !SystemMessage.isInstance(e.msg),
  )
  const isRunning = job.status === 'running'

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.agentName}>{job.agentName}</Text>
          <Text style={styles.prompt} numberOfLines={2}>
            {job.prompt}
          </Text>
        </View>
        <StatusBadge status={jobToStatus(job.status)} />
      </View>

      <FlatList
        ref={listRef}
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <StepRow
            name={messageLabel(item.msg)}
            status="complete"
            icon={messageIcon(item.msg)}
            iconColor={messageIconColor(item.msg, tokens)}
          />
        )}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          isRunning ? (
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
    alignItems: 'flex-start' as const,
    gap: tokens.space3,
    paddingHorizontal: tokens.space4,
    paddingBottom: tokens.space3,
    borderBottomWidth: 1,
    borderBottomColor: tokens.borderSubtle,
  },
  headerText: {
    flex: 1,
    gap: tokens.space1,
  },
  agentName: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textLg,
    fontWeight: tokens.weightSemibold,
    color: tokens.textPrimary,
  },
  prompt: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.textSecondary,
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
  list: {
    paddingBottom: tokens.space4,
  },
}))
