import { View, Text } from 'react-native'
import { createThemedStyles, useThemedStyles, useTheme } from '../theme'
import type { ThemeTokens } from '../theme'
import { getStatusColors } from '@util/status'
import type { ExecutionStatus } from '@util/status'

type Props = {
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
