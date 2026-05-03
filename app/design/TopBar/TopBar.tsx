// components/TopBar/TopBar.tsx
import React, { type ReactNode } from 'react'
import { View, Text } from 'react-native'
import { createThemedStyles, useThemedStyles } from '../theme'
import type { ThemeTokens } from '../theme'

interface Props {
  title: string
  subtitle?: string
  right?: ReactNode
}

export default function TopBar({ title, subtitle, right }: Props) {
  const styles = useThemedStyles(themedStyles)

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  container: {
    backgroundColor: tokens.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.borderSubtle,
    paddingHorizontal: tokens.space4,
    paddingTop: tokens.space3 + 2,
    paddingBottom: tokens.space3,
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-between' as const,
  },
  left: {
    gap: 2,
  },
  title: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.text2xl,
    fontWeight: tokens.weightSemibold,
    color: tokens.textPrimary,
    letterSpacing: tokens.trackingTight,
    lineHeight: tokens.text2xl * tokens.leadingTight,
  },
  subtitle: {
    fontFamily: tokens.fontSans,
    fontSize: tokens.textSm,
    color: tokens.textMuted,
  },
  right: {
    flexShrink: 0,
  },
}))
