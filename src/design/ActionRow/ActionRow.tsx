import type { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { createThemedStyles, useThemedStyles, useTheme } from '../theme'
import type { ThemeTokens } from '../theme'
import StatusBadge, { type ExecutionStatus } from '../StatusBadge/StatusBadge'

interface Props {
  title: string
  sub?: string
  sub2?: string
  status?: ExecutionStatus
  time?: string
  selected?: boolean
  accentColor?: string
  trailing?: ReactNode
  onPress?: () => void
}

export default function ActionRow({
  title,
  sub,
  sub2,
  status,
  time,
  selected = false,
  accentColor,
  trailing,
  onPress,
}: Props) {
  const { tokens: t } = useTheme()
  const styles = useThemedStyles(themedStyles)
  const borderLeft = selected
    ? { borderLeftWidth: t.borderWidthThick, borderLeftColor: t.accentBase }
    : accentColor
    ? { borderLeftWidth: t.borderWidthThick, borderLeftColor: accentColor }
    : {}

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        borderLeft,
        selected && styles.rowSelected,
        onPress && pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
        {sub2 ? <Text style={styles.sub} numberOfLines={1}>{sub2}</Text> : null}
      </View>
      {(status || time) ? (
        <View style={styles.right}>
          {status ? <StatusBadge status={status} /> : null}
          {time ? <Text style={styles.time}>{time}</Text> : null}
        </View>
      ) : null}
      {trailing !== undefined
        ? trailing
        : <Feather name="chevron-right" size={16} color={t.textDisabled} />}
    </Pressable>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: tokens.space3,
    paddingHorizontal: tokens.space4,
    paddingVertical: tokens.space3,
    minHeight: tokens.touchTargetSm,
    backgroundColor: tokens.bgSurface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.borderSubtle,
  },
  rowSelected: {
    backgroundColor: tokens.bgElevated,
    paddingHorizontal: tokens.space3,
  },
  rowPressed: {
    backgroundColor: tokens.bgOverlay,
  },
  left: {
    flex: 1,
    gap: tokens.space1,
    minWidth: 0,
  },
  title: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textBase,
    fontWeight: tokens.weightMedium,
    color: tokens.textPrimary,
    letterSpacing: tokens.trackingNormal,
  },
  sub: {
    fontFamily: tokens.fontSans,
    fontSize: tokens.textSm,
    color: tokens.textMuted,
  },
  right: {
    alignItems: 'flex-end' as const,
    gap: tokens.space1,
    flexShrink: 0,
  },
  time: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textXs,
    color: tokens.textDisabled,
  },
}))
