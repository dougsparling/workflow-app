import { useState } from 'react'
import { View, Text, ScrollView, LayoutChangeEvent } from 'react-native'
import { type TSchema } from 'typebox'
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import StatusBadge from '@design/StatusBadge/StatusBadge'
import BottomSheet from '@design/BottomSheet/BottomSheet'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import RecordList from '@components/RecordList/RecordList'
import ExecutionDetail from '@components/ExecutionDetail/ExecutionDetail'
import type { WorkflowStepState } from '@store/workflowQueue'
import type { Step } from '@workflow/workflow'

type Props = {
  index: number
  step: WorkflowStepState
  stepDef: Step<TSchema, TSchema>
  onModalChange?: (open: boolean) => void
  isScrolling?: boolean
}

export default function StepSlide({ index, step, stepDef, onModalChange, isScrolling }: Props) {
  const styles = useThemedStyles(themedStyles)
  const [topHeight, setTopHeight] = useState(0)
  const [bottomHeight, setBottomHeight] = useState(0)
  const [selectedMsg, setSelectedMsg] = useState<BaseMessage | null>(null)

  const inputData = step.status !== 'pending' ? step.inputData as Record<string, unknown> : undefined
  const outputData = step.status === 'complete' ? step.outputData as Record<string, unknown> : undefined
  const executionId = step.status !== 'pending' ? step.executionId : undefined

  return (
    <View style={styles.slide}>
      {/* Top panel: inputs then step info */}
      <View
        style={styles.topPanel}
        onLayout={(e: LayoutChangeEvent) => setTopHeight(e.nativeEvent.layout.height)}
      >
        <RecordList label="Inputs" schema={stepDef.input} data={inputData} />
        <View style={styles.stepHeader}>
          <Text style={styles.stepIndex}>{String(index + 1).padStart(2, '0')}</Text>
          <View style={styles.stepMeta}>
            <Text style={styles.stepName}>{step.name}</Text>
            {stepDef.model && <Text style={styles.stepModel}>{stepDef.model}</Text>}
          </View>
          <StatusBadge status={step.status} />
        </View>
      </View>

      {/* Middle: messages */}
      <View style={[styles.messages, { paddingTop: topHeight, paddingBottom: bottomHeight }]}>
        {executionId ? (
          <ExecutionDetail
            executionId={executionId}
            hideHeader
            onPressMessage={isScrolling ? undefined : msg => { setSelectedMsg(msg); onModalChange?.(true) }}
          />
        ) : (
          <View style={styles.pendingPlaceholder}>
            <Text style={styles.pendingText}>Waiting to start…</Text>
          </View>
        )}
      </View>

      {/* Bottom panel: outputs */}
      <View
        style={styles.bottomPanel}
        onLayout={(e: LayoutChangeEvent) => setBottomHeight(e.nativeEvent.layout.height)}
      >
        <RecordList label="Outputs" schema={stepDef.output} data={outputData} />
      </View>

      <BottomSheet
        visible={selectedMsg !== null}
        onDismiss={() => { setSelectedMsg(null); onModalChange?.(false) }}
      >
        {selectedMsg && (
          <MessageContent message={selectedMsg} modelName={stepDef.model} />
        )}
      </BottomSheet>
    </View>
  )
}

function MessageContent({ message, modelName }: {
  message: BaseMessage
  modelName?: string
}) {
  const styles = useThemedStyles(themedStyles)

  if (HumanMessage.isInstance(message)) {
    return (
      <ScrollView>
        <Text style={styles.detailLabel}>Prompt</Text>
        <Text style={styles.detailText}>{contentToString(message.content)}</Text>
      </ScrollView>
    )
  }

  if (AIMessage.isInstance(message)) {
    if (message.tool_calls?.length) {
      return (
        <ScrollView>
          <Text style={styles.detailLabel}>Tool Calls</Text>
          {message.tool_calls.map(tc => (
            <View key={tc.id} style={styles.detailBlock}>
              <Text style={styles.detailSubLabel}>{tc.name}</Text>
              <Text style={styles.detailCode}>{JSON.stringify(tc.args, null, 2)}</Text>
            </View>
          ))}
        </ScrollView>
      )
    }
    return (
      <ScrollView>
        <Text style={styles.detailLabel}>Response</Text>
        {modelName && <Text style={styles.detailModel}>{modelName}</Text>}
        <Text style={styles.detailText}>{contentToString(message.content)}</Text>
      </ScrollView>
    )
  }

  if (ToolMessage.isInstance(message)) {
    const toolArgs = message.additional_kwargs?.args as Record<string, unknown> | undefined
    return (
      <ScrollView>
        <Text style={styles.detailLabel}>{message.name ?? 'Tool'}</Text>
        {toolArgs && (
          <>
            <Text style={styles.detailSubLabel}>Parameters</Text>
            <Text style={styles.detailCode}>{JSON.stringify(toolArgs, null, 2)}</Text>
          </>
        )}
        <Text style={styles.detailSubLabel}>Result</Text>
        <Text style={styles.detailText}>{contentToString(message.content)}</Text>
      </ScrollView>
    )
  }

  return (
    <ScrollView>
      <Text style={styles.detailText}>{contentToString(message.content)}</Text>
    </ScrollView>
  )
}

function contentToString(content: BaseMessage['content']): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map(c => {
      if (typeof c === 'string') return c
      if ('text' in c) return c.text ?? ''
      return JSON.stringify(c)
    }).join('\n')
  }
  return String(content)
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  slide: {
    flex: 1,
    backgroundColor: tokens.bgBase,
  },
  topPanel: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.borderDefault,
    zIndex: 10,
  },
  stepHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: tokens.space2,
    paddingHorizontal: tokens.space4,
    paddingTop: tokens.space2,
    paddingBottom: tokens.space3,
    borderTopWidth: 1,
    borderTopColor: tokens.borderSubtle,
  },
  stepIndex: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.textDisabled,
    flexShrink: 0,
  },
  stepMeta: {
    flex: 1,
    gap: 2,
  },
  stepName: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textBase,
    fontWeight: tokens.weightSemibold,
    color: tokens.textPrimary,
  },
  stepModel: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textXs,
    color: tokens.textMuted,
  },
  messages: {
    flex: 1,
  },
  pendingPlaceholder: {
    padding: tokens.space4,
    alignItems: 'center' as const,
  },
  pendingText: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.textDisabled,
  },
  bottomPanel: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.bgSurface,
    borderTopWidth: 1,
    borderTopColor: tokens.borderDefault,
    zIndex: 10,
  },

  detailLabel: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    fontWeight: tokens.weightSemibold,
    color: tokens.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: tokens.trackingWide,
    marginBottom: tokens.space2,
  },
  detailSubLabel: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    fontWeight: tokens.weightSemibold,
    color: tokens.textSecondary,
    marginTop: tokens.space3,
    marginBottom: tokens.space1,
  },
  detailText: {
    fontFamily: tokens.fontSans,
    fontSize: tokens.textBase,
    color: tokens.textPrimary,
    lineHeight: tokens.textLg,
  },
  detailModel: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.accentBase,
    marginBottom: tokens.space2,
  },
  detailCode: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.textPrimary,
    backgroundColor: tokens.bgSurface,
    padding: tokens.space3,
    borderRadius: tokens.radiusSm,
    overflow: 'hidden' as const,
  },
  detailBlock: {
    marginBottom: tokens.space3,
  },
}))
