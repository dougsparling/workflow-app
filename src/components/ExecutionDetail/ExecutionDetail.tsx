import { useRef, useEffect } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import StatusBadge from '@design/StatusBadge/StatusBadge'
import ActionRow, { type FeatherIconName } from '@design/ActionRow/ActionRow'
import { createThemedStyles, useThemedStyles, useTheme } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import { useExecutionStore } from '@store/executionQueue'

type Props = {
  executionId: string
  hideHeader?: boolean
  onPressMessage?: (msg: BaseMessage) => void
}

export default function ExecutionDetail({ executionId, hideHeader = false, onPressMessage }: Props) {
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

  const filtered = job.messages
  const isRunning = job.status === 'running'

  return (
    <View style={styles.container}>
      {!hideHeader && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.agentName}>{job.def.name}</Text>
            <Text style={styles.prompt} numberOfLines={2}>
              {job.prompt}
            </Text>
          </View>
          <StatusBadge status={job.status} />
        </View>
      )}

      <FlatList
        ref={listRef}
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <ActionRow
            title={messageLabel(item.msg)}
            status="complete"
            icon={messageIcon(item.msg)}
            iconColor={messageIconColor(item.msg, tokens)}
            onPress={onPressMessage ? () => onPressMessage(item.msg) : undefined}
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

function messageIcon(msg: HumanMessage | AIMessage | ToolMessage): FeatherIconName {
  if (SystemMessage.isInstance(msg)) return 'terminal'
  if (HumanMessage.isInstance(msg)) return 'user'
  if (AIMessage.isInstance(msg)) {
    if (msg.tool_calls?.length) return 'zap'
    return 'message-circle'
  }
  if (ToolMessage.isInstance(msg)) return 'check-square'
  return 'circle'
}

function messageIconColor(msg: HumanMessage | AIMessage | ToolMessage, tokens: ThemeTokens): string {
  if (SystemMessage.isInstance(msg)) return tokens.textMuted
  if (HumanMessage.isInstance(msg)) return tokens.accentBase
  if (AIMessage.isInstance(msg)) {
    if (msg.tool_calls?.length) return tokens.amberBase
    return tokens.accentBase
  }
  if (ToolMessage.isInstance(msg)) return tokens.statusComplete
  return tokens.textMuted
}

function messageLabel(msg: HumanMessage | AIMessage | ToolMessage): string {
  if (SystemMessage.isInstance(msg)) return 'System'
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
