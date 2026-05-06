import type { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { createThemedStyles, useThemedStyles, useTheme } from '../theme'
import type { ThemeTokens } from '../theme'
import StatusBadge, { type ExecutionStatus } from '../StatusBadge/StatusBadge'

export type FeatherIconName = React.ComponentProps<typeof Feather>['name']

interface Props {
  title: string
  subtitles?: string[]
  status?: ExecutionStatus
  time?: string
  selected?: boolean
  accentColor?: string
  icon?: FeatherIconName
  iconColor?: string
  trailing?: ReactNode
  onPress?: () => void
}

export default function ActionRow({
  title,
  subtitles: subs,
  status,
  time,
  selected = false,
  accentColor,
  icon,
  iconColor,
  trailing,
  onPress,
}: Props) {
  const { tokens: t } = useTheme()
  const styles = useThemedStyles(themedStyles)
  const isRunning = status === 'running'
  const borderLeft = selected
    ? { borderLeftWidth: t.borderWidthThick, borderLeftColor: t.accentBase }
    : accentColor
    ? { borderLeftWidth: t.borderWidthThick, borderLeftColor: accentColor }
    : isRunning
    ? { borderLeftWidth: t.borderWidthThick, borderLeftColor: t.statusRunning }
    : {}

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        borderLeft,
        selected && styles.rowSelected,
        isRunning && styles.rowRunning,
        onPress && pressed && styles.rowPressed,
      ]}
    >
      {icon && (
        <View style={styles.iconBadge}>
          <Feather name={icon} size={14} color={iconColor ?? t.accentBase} />
        </View>
      )}
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subs?.map((s, i) => (
          <Text key={i} style={styles.sub} numberOfLines={1}>{s}</Text>
        ))}
      </View>
      {(status || time) ? (
        <View style={styles.right}>
          {status ? <StatusBadge status={status} /> : null}
          {time ? <Text style={styles.time}>{time}</Text> : null}
        </View>
      ) : null}
      {trailing}
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
  rowRunning: {
    paddingLeft: tokens.space3,
  },
  rowPressed: {
    backgroundColor: tokens.bgOverlay,
  },
  iconBadge: {
    width: tokens.space6,
    height: tokens.space6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: tokens.accentGhost,
    borderWidth: 1,
    borderColor: tokens.accentBorder,
    flexShrink: 0,
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
