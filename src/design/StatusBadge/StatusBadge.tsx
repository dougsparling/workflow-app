// components/StatusBadge/StatusBadge.tsx
import React from 'react'
import { View, Text } from 'react-native'
import { createThemedStyles, useThemedStyles, useTheme } from '../theme'
import type { ThemeTokens } from '../theme'

export type ExecutionStatus =
  | 'running'
  | 'complete'
  | 'pending'
  | 'failed'
  | 'idle'
  | 'stopped'
  | 'aborted'

interface StatusColors {
  bg: string
  border: string
  text: string
  dot: string
}

function getStatusColors(tokens: ThemeTokens, status: ExecutionStatus): StatusColors {
  switch (status) {
    case 'running':
      return { bg: 'rgba(41,184,168,0.10)', border: 'rgba(41,184,168,0.28)', text: tokens.statusRunning,  dot: tokens.statusRunning  }
    case 'complete':
      return { bg: 'rgba(61,186,111,0.08)', border: 'rgba(61,186,111,0.20)', text: tokens.statusComplete, dot: tokens.statusComplete }
    case 'pending':
      return { bg: tokens.amberGhost,        border: tokens.amberBorder,      text: tokens.amberBase,      dot: tokens.amberBase      }
    case 'failed':
      return { bg: tokens.errorGhost,        border: tokens.errorBorder,      text: tokens.errorBright,    dot: tokens.errorBase      }
    case 'idle':
    case 'stopped':
    default:
      return { bg: 'rgba(122,128,128,0.08)', border: 'rgba(122,128,128,0.18)', text: tokens.textMuted,    dot: tokens.textMuted      }
  }
}

interface Props {
  status: ExecutionStatus
}

export default function StatusBadge({ status }: Props) {
  const { tokens } = useTheme()
  const styles = useThemedStyles(themedStyles)
  const { bg, border, text, dot } = getStatusColors(tokens, status)

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.label, { color: text }]}>{status}</Text>
    </View>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: tokens.space2,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: tokens.radiusNone,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: tokens.radiusFull,
  },
  label: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textXs,
    fontWeight: tokens.weightMedium,
  },
}))
