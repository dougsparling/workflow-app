import { View, Text } from 'react-native'
import { createThemedStyles, useThemedStyles, useTheme } from '../theme'
import type { ThemeTokens } from '../theme'
import { logLevelColor } from '@util/status'
import type { LogLevel } from '@util/status'

export type { LogLevel } from '@util/status'

type Props = {
  time: string
  level: LogLevel
  message: string
}

export default function LogLine({ time, level, message }: Props) {
  const styles = useThemedStyles(themedStyles)
  const { tokens } = useTheme()

  return (
    <View style={styles.row}>
      <Text style={styles.time}>{time}</Text>
      <Text style={[styles.level, { color: logLevelColor(level, tokens) }]}>{level}</Text>
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
    </View>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  row: {
    flexDirection: 'row' as const,
    gap: tokens.space2,
    paddingHorizontal: tokens.space4,
    paddingVertical: 3,
  },
  time: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.textDisabled,
    flexShrink: 0,
    lineHeight: tokens.textSm * tokens.leadingNormal,
  },
  level: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    width: 44,
    flexShrink: 0,
    lineHeight: tokens.textSm * tokens.leadingNormal,
  },
  message: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.textSecondary,
    flex: 1,
    lineHeight: tokens.textSm * tokens.leadingNormal,
  },
}))
