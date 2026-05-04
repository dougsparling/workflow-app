// components/StepRow/StepRow.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { createThemedStyles, useThemedStyles } from '../theme'
import type { ThemeTokens } from '../theme'
import StatusBadge, { type ExecutionStatus } from '../StatusBadge/StatusBadge'

interface Props {
  index: number
  name: string
  status: ExecutionStatus
  duration?: string
}

export default function StepRow({ index, name, status, duration }: Props) {
  const styles = useThemedStyles(themedStyles)
  const isRunning = status === 'running'

  return (
    <View style={[
      styles.row,
      isRunning && styles.rowRunning,
    ]}>
      <View style={styles.indexBadge}>
        <Text style={styles.indexText}>{String(index).padStart(2, '0')}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        {duration ? <Text style={styles.duration}>{duration}</Text> : null}
      </View>
      <StatusBadge status={status} />
    </View>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: tokens.space2 + 2,
    paddingHorizontal: tokens.space4,
    paddingVertical: tokens.space2 + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.borderSubtle,
    backgroundColor: tokens.bgSurface,
  },
  rowRunning: {
    borderLeftWidth: tokens.borderWidthThick,
    borderLeftColor: tokens.statusRunning,
    paddingLeft: tokens.space3,
  },
  indexBadge: {
    width: tokens.space6,
    height: tokens.space6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: tokens.accentGhost,
    borderWidth: 1,
    borderColor: tokens.accentBorder,
    flexShrink: 0,
  },
  indexText: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textXs,
    color: tokens.accentBase,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textBase - 1,
    fontWeight: tokens.weightMedium,
    color: tokens.textPrimary,
  },
  duration: {
    fontFamily: tokens.fontSans,
    fontSize: tokens.textXs,
    color: tokens.textMuted,
  },
}))
