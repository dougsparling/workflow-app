// components/Label/Label.tsx
import React from 'react'
import { Text } from 'react-native'
import type { TextProps } from 'react-native'
import { createThemedStyles, useThemedStyles, useTheme } from '../theme'
import type { ThemeTokens } from '../theme'

interface Props extends TextProps {
  type?: 'primary' | 'secondary'
  enabled?: boolean
}

export default function Label({
  type = 'primary',
  enabled = true,
  style,
  children,
  ...rest
}: Props) {
  const { tokens } = useTheme()
  const styles = useThemedStyles(themedStyles)

  const color = enabled
    ? type === 'primary'
      ? tokens.textPrimary
      : tokens.textSecondary
    : tokens.textDisabled

  return (
    <Text style={[styles[type], { color }, style]} {...rest}>
      {children}
    </Text>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  primary: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textBase,
    fontWeight: tokens.weightMedium,
    letterSpacing: tokens.trackingNormal,
  },
  secondary: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    letterSpacing: tokens.trackingNormal,
  },
}))
