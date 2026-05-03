// components/LogLine/LogLine.tsx
import React from 'react'
import { View, Text } from 'react-native'
import { createThemedStyles, useThemedStyles } from '../theme'
import type { ThemeTokens } from '../theme'

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

interface Props {
  time: string
  level: LogLevel
  message: string
}

export default function LogLine({ time, level, message }: Props) {
  const styles = useThemedStyles(themedStyles)

  const levelStyle =
    level === 'INFO'  ? styles.levelInfo  :
    level === 'WARN'  ? styles.levelWarn  :
    level === 'ERROR' ? styles.levelError :
    styles.levelDebug

  return (
    <View style={styles.row}>
      <Text style={styles.time}>{time}</Text>
      <Text style={[styles.level, levelStyle]}>{level}</Text>
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
    </View>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  row: {
    flexDirection: 'row' as const,
    gap: tokens.space2 + 2,
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
  levelInfo:  { color: tokens.accentBase  },
  levelWarn:  { color: tokens.amberBase   },
  levelError: { color: tokens.errorBright },
  levelDebug: { color: tokens.textMuted   },
  message: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.textSecondary,
    flex: 1,
    lineHeight: tokens.textSm * tokens.leadingNormal,
  },
}))
