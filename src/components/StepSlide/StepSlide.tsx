import { useState } from 'react'
import { View, Text, LayoutChangeEvent } from 'react-native'
import { type TSchema } from 'typebox'
import StatusBadge from '@design/StatusBadge/StatusBadge'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import RecordList from '@components/RecordList/RecordList'
import ExecutionDetail from '@components/ExecutionDetail/ExecutionDetail'
import type { WorkflowStepState } from '@store/workflowQueue'
import type { Step } from '@workflow/workflow'

interface Props {
  index: number
  step: WorkflowStepState
  stepDef: Step<TSchema, TSchema>
}

export default function StepSlide({ index, step, stepDef }: Props) {
  const styles = useThemedStyles(themedStyles)
  const [topHeight, setTopHeight] = useState(0)
  const [bottomHeight, setBottomHeight] = useState(0)

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
          <ExecutionDetail executionId={executionId} hideHeader />
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
    </View>
  )
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
}))
